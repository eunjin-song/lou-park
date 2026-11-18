import { useEffect, useState } from 'react'
import { actionOffer, requestBin, requestDraw, requestRest, requestScoop } from '../input/parkActions.ts'
import { isInputBlocked } from '../input/inputGate.ts'
import { publishFeed, useFeed } from '../session/worldFeed.ts'

const labels = { scoop: '줍기', bin: '버리기', draw: '봉투 뽑기', rest: '쉬기' } as const

/** One nearby action for touch, plus the same E key the desktop park already uses. */
export function ParkActions() {
  const feed = useFeed()
  const [offer, setOffer] = useState(actionOffer([], '', false, false))

  useEffect(() => {
    const tick = () => {
      const next = actionOffer(feed.poops, feed.selfId, feed.clean, feed.used)
      publishFeed({ hint: next.hint })
      setOffer((current) => current.action === next.action && current.hint === next.hint ? current : next)
    }
    tick()
    const timer = window.setInterval(tick, 100)
    return () => window.clearInterval(timer)
  }, [feed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat || isInputBlocked()) return
      const next = actionOffer(feed.poops, feed.selfId, feed.clean, feed.used)
      if (next.action === 'scoop') requestScoop()
      else if (next.action === 'bin') requestBin()
      else if (next.action === 'draw') requestDraw()
      else if (next.action === 'rest') requestRest()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [feed])

  return (
    <div className="park-actions park-control">
      {offer.action !== 'none' && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            if (offer.action === 'scoop') requestScoop()
            else if (offer.action === 'bin') requestBin()
            else if (offer.action === 'draw') requestDraw()
            else requestRest()
          }}
        >
          {labels[offer.action]}
        </button>
      )}
    </div>
  )
}
