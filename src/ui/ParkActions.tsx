import { useEffect, useState } from 'react'
import { actionOffer, requestBin, requestRest, requestScoop } from '../input/parkActions.ts'
import { isInputBlocked } from '../input/inputGate.ts'
import { useFeed } from '../session/worldFeed.ts'

/** Context buttons for touch, plus the same E key the desktop park already uses. */
export function ParkActions() {
  const feed = useFeed()
  const [offer, setOffer] = useState({ scoop: false, bin: false, rest: false })

  useEffect(() => {
    const tick = () => {
      const next = actionOffer(feed.poops, feed.selfId, feed.holding)
      setOffer((current) =>
        current.scoop === next.scoop && current.bin === next.bin && current.rest === next.rest ? current : next,
      )
    }
    tick()
    const timer = window.setInterval(tick, 100)
    return () => window.clearInterval(timer)
  }, [feed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat || isInputBlocked()) return
      const next = actionOffer(feed.poops, feed.selfId, feed.holding)
      if (next.scoop) requestScoop()
      else if (next.bin) requestBin()
      else if (next.rest) requestRest()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [feed])

  return (
    <div className="park-actions park-control">
      {offer.scoop && (
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => requestScoop()}>
          줍기
        </button>
      )}
      {offer.bin && (
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => requestBin()}>
          버리기
        </button>
      )}
      {offer.rest && (
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => requestRest()}>
          쉬기
        </button>
      )}
    </div>
  )
}
