import { connectionLabel, useConnection } from '../session/connection.ts'
import { useFeed } from '../session/worldFeed.ts'

export function Hud() {
  const connection = useConnection()
  const { clean, used, hint } = useFeed()
  return (
    <div className="hud">
      <h1>LOU Park</h1>
      <p>호숫가를 따라 산책해요.</p>
      {clean && <p className="hud-bag">배변봉투를 챙겼어요</p>}
      {used && <p className="hud-bag">사용한 배변봉투를 들고 있어요</p>}
      {hint && <p className="hud-bag">{hint}</p>}
      <p className="hud-status" data-status={connection.status} data-people={connection.people}>
        {connectionLabel(connection.status, connection.people)}
      </p>
    </div>
  )
}
