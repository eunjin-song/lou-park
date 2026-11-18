import { connectionLabel, useConnection } from '../session/connection.ts'
import { useFeed } from '../session/worldFeed.ts'

export function Hud() {
  const connection = useConnection()
  const { clean, used, hint } = useFeed()
  return (
    <div className="hud">
      <h1>LOU Park</h1>
      <p>WASD 또는 방향키로 강아지와 산책해요.</p>
      <p>마우스 오른쪽을 드래그해 둘러보고, 휠로 확대해요.</p>
      <p>터치 화면은 왼쪽 조이스틱, 오른쪽 드래그로 둘러봐요.</p>
      <p>울타리 안이 공원의 끝입니다. Enter로 대화해요.</p>
      {clean && <p className="hud-bag">배변봉투를 챙겼어요</p>}
      {used && <p className="hud-bag">사용한 배변봉투를 들고 있어요</p>}
      {hint && <p className="hud-bag">{hint}</p>}
      <p className="hud-status" data-status={connection.status} data-people={connection.people}>
        {connectionLabel(connection.status, connection.people)}
      </p>
    </div>
  )
}
