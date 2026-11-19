import { useEffect, useState } from 'react'
import { runHeld, toggleRun } from '../input/pace.ts'

export function TravelControls() {
  const [running, setRunning] = useState(runHeld())

  useEffect(() => {
    const tick = () => {
      const next = runHeld()
      setRunning((current) => current === next ? current : next)
    }
    const timer = window.setInterval(tick, 200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="travel-controls park-control">
      <button type="button" className="run-toggle" aria-pressed={running} onClick={() => setRunning(toggleRun())}>
        {running ? '걷는 중' : '달리기'}
      </button>
    </div>
  )
}
