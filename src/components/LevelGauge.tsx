interface LevelGaugeProps {
  value: number
  min: number
  max: number
  record: number
  temperatureC?: number
}

function toTemperatureClass(temperatureC?: number) {
  if (temperatureC === undefined) return 'temp-cool'
  if (temperatureC <= 0) return 'temp-frozen'
  if (temperatureC <= 5) return 'temp-cold'
  if (temperatureC <= 12) return 'temp-cool'
  if (temperatureC <= 18) return 'temp-moderate'
  if (temperatureC <= 22) return 'temp-warm'
  if (temperatureC <= 28) return 'temp-hot'
  return 'temp-very-hot'
}

export function LevelGauge({ value, min, max, record, temperatureC }: LevelGaugeProps) {
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const aboveRecord = value >= record

  return (
    <div className="level-gauge">
      <div className="level-axis">
        <span>{max.toFixed(1)}m</span>
        <span>{min.toFixed(1)}m</span>
      </div>
      <div className="level-column water-column">
        <div className={`level-fill ${toTemperatureClass(temperatureC)}`} style={{ height: `${percent}%` }} />
      </div>
      <div className="level-stats">
        <p className="value tabular-nums">{value.toFixed(2)} m</p>
        <p className={aboveRecord ? 'warning' : ''}>Record {record.toFixed(1)} m</p>
      </div>
    </div>
  )
}
