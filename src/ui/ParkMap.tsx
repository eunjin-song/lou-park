import { useEffect, useRef, useState } from 'react'
import { requestReturn, whereabouts } from '../input/parkActions.ts'
import { paintParkMap } from '../world/paintMap.ts'

export function ParkMap() {
  const [open, setOpen] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!open) return
    const draw = () => {
      const node = canvas.current
      const ctx = node?.getContext('2d')
      if (!node || !ctx) return
      paintParkMap(ctx, node.width, node.height, { x: whereabouts.x, z: whereabouts.z })
    }
    draw()
    const timer = window.setInterval(draw, 200)
    return () => window.clearInterval(timer)
  }, [open])

  return (
    <div className="park-map park-control">
      <div className="park-map-actions">
        <button type="button" onClick={() => requestReturn()}>입구로 돌아가기</button>
        <button type="button" onClick={() => setOpen((value) => !value)}>{open ? '지도 닫기' : '지도'}</button>
      </div>
      {open && <canvas ref={canvas} width={640} height={860} />}
    </div>
  )
}
