import { connectionLabel, useConnection } from '../session/connection.ts'

export function Hud() {
  const connection = useConnection()
  return (
    <div className="hud">
      <h1>LOU Park</h1>
      <p>WASD 또는 방향키로 강아지와 산책해요.</p>
      <p>마우스 오른쪽을 드래그해 둘러보고, 휠로 확대해요.</p>
      <p>울타리 안이 공원의 끝입니다. Enter로 대화해요.</p>
      <p className="hud-status" data-status={connection.status} data-people={connection.people}>
        {connectionLabel(connection.status, connection.people)}
      </p>
    </div>
  )
}
