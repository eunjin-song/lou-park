import { useEffect, useRef } from 'react'
import { useSyncExternalStore } from 'react'
import { getLabelSnapshot, labelAnchors, projectLabel, subscribeLabels } from './labelAnchors.ts'

/** Names and speech bubbles in the page, above the park picture. */
export function AvatarLabels() {
  const labels = useSyncExternalStore(subscribeLabels, getLabelSnapshot, getLabelSnapshot)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const place = () => {
      const host = root.current
      if (!host) return
      const width = host.clientWidth
      const height = host.clientHeight
      const nodes = [...host.querySelectorAll<HTMLElement>('.avatar-label')]
      for (const node of nodes) {
        node.style.setProperty('--nudge', '0px')
        node.style.visibility = ''
      }
      const placed: { left: number; right: number; top: number; bottom: number }[] = []
      const visible = nodes
        .map((node) => {
          const anchor = labelAnchors().get(node.dataset.playerId ?? '')
          const screen = anchor ? projectLabel(anchor, width, height) : null
          if (!anchor || !screen) {
            node.style.visibility = 'hidden'
            return null
          }
          node.style.left = `${screen.x}px`
          node.style.top = `${screen.y}px`
          return { node, screen }
        })
        .filter((item) => item !== null)
        .sort((a, b) => b.screen.y - a.screen.y)

      for (const { node } of visible) {
        const name = node.querySelector('.nickname')?.getBoundingClientRect()
        if (!name?.width) continue
        const bubble = node.querySelector('.chat-bubble')?.getBoundingClientRect()
        const box = {
          left: Math.min(name.left, bubble?.left ?? name.left),
          right: Math.max(name.right, bubble?.right ?? name.right),
          top: Math.min(name.top, bubble?.top ?? name.top),
          bottom: name.bottom,
        }
        let shift = 0
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const hit = placed.find(
            (other) =>
              box.left < other.right + 6 &&
              box.right > other.left - 6 &&
              box.top + shift < other.bottom + 6 &&
              box.bottom + shift > other.top - 6,
          )
          if (!hit) break
          shift = hit.top - box.bottom - 8
        }
        if (name.bottom < 8 || name.top > height || name.right < 0 || name.left > width) {
          node.style.visibility = 'hidden'
          continue
        }
        node.style.setProperty('--nudge', `${shift}px`)
        placed.push({ ...box, top: box.top + shift, bottom: box.bottom + shift })
      }
    }
    const loop = () => {
      frame = requestAnimationFrame(loop)
      place()
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="avatar-labels" ref={root}>
      {labels.map((label) => (
        <div key={label.id} className="avatar-label" data-player-id={label.id}>
          {label.bubble && <div className="chat-bubble">{label.bubble}</div>}
          <div className="nickname">
            {label.nickname}
            {label.self ? ' (나)' : ''}
          </div>
          {label.status && <div className="avatar-status">{label.status}</div>}
        </div>
      ))}
    </div>
  )
}
