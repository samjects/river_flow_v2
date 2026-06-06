interface TemperatureGaugeProps {
  temperatureC?: number
  size?: 'sm' | 'lg'
}

function temperatureClass(value?: number) {
  if (value === undefined) return 'temp-cool'
  if (value <= 0) return 'temp-frozen'
  if (value <= 5) return 'temp-cold'
  if (value <= 12) return 'temp-cool'
  if (value <= 18) return 'temp-moderate'
  if (value <= 22) return 'temp-warm'
  if (value <= 28) return 'temp-hot'
  return 'temp-very-hot'
}

export function TemperatureGauge({ temperatureC, size = 'sm' }: TemperatureGaugeProps) {
  const min = -5
  const max = 35
  const value = temperatureC ?? min
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))

  return (
    <div className={`temp-gauge ${size}`}>
      <div className="temp-column">
        <div className={`temp-fill ${temperatureClass(temperatureC)}`} style={{ height: `${percent}%` }} />
      </div>
      <p className="tabular-nums">{temperatureC === undefined ? '--' : `${temperatureC.toFixed(1)} C`}</p>
    </div>
  )
}
