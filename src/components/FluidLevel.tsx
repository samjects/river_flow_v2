import { useEffect, useRef, useCallback } from 'react'

interface FluidLevelProps {
  /** Current water level in meters */
  value: number
  /** Minimum gauge level */
  min: number
  /** Maximum gauge level */
  max: number
  /** Record level */
  record: number
  /** Water temperature in Celsius */
  temperatureC?: number
  /** Visual size */
  size?: 'sm' | 'lg'
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  density: number
}

const GRAVITY = 0.28
const REST_DENSITY = 5.0
const STIFFNESS = 0.5
const VISCOSITY = 0.12
const PARTICLE_RADIUS = 3
const DAMPING = 0.96
const INTERACTION_RADIUS = 22

function tempToColor(temperatureC?: number): { h: number; s: number; l: number } {
  if (temperatureC === undefined) return { h: 195, s: 78, l: 52 }
  if (temperatureC <= 0) return { h: 206, s: 88, l: 72 }
  if (temperatureC <= 5) return { h: 204, s: 80, l: 60 }
  if (temperatureC <= 12) return { h: 195, s: 75, l: 50 }
  if (temperatureC <= 18) return { h: 178, s: 65, l: 42 }
  if (temperatureC <= 22) return { h: 160, s: 58, l: 42 }
  if (temperatureC <= 28) return { h: 35, s: 85, l: 50 }
  return { h: 27, s: 75, l: 47 }
}

export function FluidLevel({ value, min, max, record, temperatureC, size = 'sm' }: FluidLevelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)
  const initializedRef = useRef(false)
  const targetLevelRef = useRef(0)

  const percent = Math.max(0, Math.min(1, (value - min) / (max - min)))
  targetLevelRef.current = percent

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const waterHeight = height * percent
    const cols = Math.floor(width / (PARTICLE_RADIUS * 2.4))
    const rows = Math.floor(waterHeight / (PARTICLE_RADIUS * 2.4))

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const jitter = (Math.random() - 0.5) * 2
        particles.push({
          x: (col + 0.5) * (width / cols) + jitter,
          y: height - (row + 0.5) * (waterHeight / rows) + jitter,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.2,
          density: 0,
        })
      }
    }
    return particles
  }, [percent])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      if (!initializedRef.current) {
        particlesRef.current = initParticles(rect.width, rect.height)
        initializedRef.current = true
      }
    }
    resize()

    const simulate = () => {
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const H = rect.height
      const particles = particlesRef.current
      const targetY = H * (1 - targetLevelRef.current)

      // Compute density
      for (let i = 0; i < particles.length; i++) {
        particles[i].density = 0
        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue
          const dx = particles[j].x - particles[i].x
          const dy = particles[j].y - particles[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < INTERACTION_RADIUS) {
            const q = 1 - dist / INTERACTION_RADIUS
            particles[i].density += q * q
          }
        }
      }

      // Apply forces
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        // Gravity
        p.vy += GRAVITY

        // Pressure & viscosity from neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const n = particles[j]
          const dx = n.x - p.x
          const dy = n.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < INTERACTION_RADIUS && dist > 0.01) {
            const q = 1 - dist / INTERACTION_RADIUS
            // Pressure
            const pressure = STIFFNESS * (p.density + n.density - 2 * REST_DENSITY) * q
            const fx = (dx / dist) * pressure * q
            const fy = (dy / dist) * pressure * q
            p.vx -= fx
            p.vy -= fy
            n.vx += fx
            n.vy += fy
            // Viscosity
            const relVx = n.vx - p.vx
            const relVy = n.vy - p.vy
            p.vx += VISCOSITY * q * relVx
            p.vy += VISCOSITY * q * relVy
            n.vx -= VISCOSITY * q * relVx
            n.vy -= VISCOSITY * q * relVy
          }
        }

        // Gentle surface tension toward target level
        if (p.y < targetY) {
          p.vy += 0.12
        }
      }

      // Integrate
      for (const p of particles) {
        p.vx *= DAMPING
        p.vy *= DAMPING
        p.x += p.vx
        p.y += p.vy

        // Boundary collisions
        if (p.x < PARTICLE_RADIUS) { p.x = PARTICLE_RADIUS; p.vx *= -0.4 }
        if (p.x > W - PARTICLE_RADIUS) { p.x = W - PARTICLE_RADIUS; p.vx *= -0.4 }
        if (p.y < PARTICLE_RADIUS) { p.y = PARTICLE_RADIUS; p.vy *= -0.3 }
        if (p.y > H - PARTICLE_RADIUS) { p.y = H - PARTICLE_RADIUS; p.vy *= -0.5 }
      }
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const H = rect.height
      const particles = particlesRef.current
      const color = tempToColor(temperatureC)

      ctx.clearRect(0, 0, W, H)

      // Simple background
      ctx.fillStyle = 'hsl(210 15% 96%)'
      ctx.fillRect(0, 0, W, H)

      // Target level line
      const targetY = H * (1 - targetLevelRef.current)
      ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.15)`
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(0, targetY)
      ctx.lineTo(W, targetY)
      ctx.stroke()
      ctx.setLineDash([])

      // Record level line
      const recordPercent = Math.max(0, Math.min(1, (record - min) / (max - min)))
      const recordY = H * (1 - recordPercent)
      ctx.strokeStyle = 'hsla(0, 65%, 50%, 0.25)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 2])
      ctx.beginPath()
      ctx.moveTo(0, recordY)
      ctx.lineTo(W, recordY)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw water body - simple solid base
      ctx.fillStyle = `hsla(${color.h}, ${color.s - 15}%, ${color.l}%, 0.08)`
      ctx.fillRect(0, targetY, W, H - targetY)

      // Draw particles - clean circles
      for (const p of particles) {
        ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.6)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      // Scale labels
      ctx.font = '10px system-ui, sans-serif'
      ctx.fillStyle = 'hsl(210 10% 50%)'
      ctx.textAlign = 'left'
      ctx.fillText(`${max.toFixed(1)}m`, 6, 12)
      ctx.fillText(`${min.toFixed(1)}m`, 6, H - 4)

      // Current value label
      ctx.font = '600 11px system-ui, sans-serif'
      ctx.fillStyle = `hsl(${color.h}, ${color.s}%, 30%)`
      ctx.textAlign = 'right'
      ctx.fillText(`${value.toFixed(2)} m`, W - 6, targetY - 6)
    }

    const loop = () => {
      simulate()
      render()
      animRef.current = requestAnimationFrame(loop)
    }

    loop()

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [min, max, record, value, temperatureC, initParticles])

  const aboveRecord = value >= record

  return (
    <div className={`fluid-level ${size}`}>
      <canvas ref={canvasRef} className="fluid-level-canvas" />
      {aboveRecord && <span className="fluid-level-warning">Above record!</span>}
    </div>
  )
}
