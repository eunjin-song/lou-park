import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { clearStick, setStick, setStickPointer } from '../input/stick.ts'

function resetInput() {
  clearStick()
}

/** Left-hand stick. It is mounted only in the park, and only shown on touch devices. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const queries = [window.matchMedia('(pointer: coarse)'), window.matchMedia('(hover: none)')]
    const apply = () => {
      document.documentElement.classList.toggle('touch-ui', queries.some((query) => query.matches))
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        resetInput()
        setKnob({ x: 0, y: 0 })
      }
    }
    const onReset = () => {
      resetInput()
      setKnob({ x: 0, y: 0 })
    }
    apply()
    for (const query of queries) query.addEventListener('change', apply)
    window.addEventListener('blur', onReset)
    window.addEventListener('pagehide', onReset)
    window.addEventListener('park-input-reset', onReset)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      for (const query of queries) query.removeEventListener('change', apply)
      window.removeEventListener('blur', onReset)
      window.removeEventListener('pagehide', onReset)
      window.removeEventListener('park-input-reset', onReset)
      document.removeEventListener('visibilitychange', onHide)
      document.documentElement.classList.remove('touch-ui')
      resetInput()
    }
  }, [])

  const place = (event: PointerEvent<HTMLDivElement>) => {
    const rect = base.current?.getBoundingClientRect()
    if (!rect) return
    const max = rect.width * 0.34
    let dx = event.clientX - (rect.left + rect.width / 2)
    let dy = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy)
    if (length > max && length > 0) {
      dx = (dx / length) * max
      dy = (dy / length) * max
    }
    setStick(dx / max, dy / max)
    setKnob({ x: dx, y: dy })
  }

  return (
    <div
      ref={base}
      className="joystick park-control"
      onPointerDown={(event) => {
        if (event.button !== 0) return
        setStickPointer(event.pointerId)
        event.currentTarget.setPointerCapture(event.pointerId)
        place(event)
        event.preventDefault()
        event.stopPropagation()
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        place(event)
        event.preventDefault()
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        resetInput()
        setKnob({ x: 0, y: 0 })
      }}
      onPointerCancel={() => {
        resetInput()
        setKnob({ x: 0, y: 0 })
      }}
      onLostPointerCapture={() => {
        resetInput()
        setKnob({ x: 0, y: 0 })
      }}
    >
      <span className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
