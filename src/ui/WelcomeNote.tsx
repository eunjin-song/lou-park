import { useEffect, useState } from 'react'

export function WelcomeNote() {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 9000)
    return () => window.clearTimeout(timer)
  }, [])
  if (!open) return null
  return (
    <div className="welcome-note park-control">
      <p>호수를 따라 한 바퀴 걸을 수 있어요. Shift 또는 달리기로 뛰고, 지도에서 놀이터와 봉투함을 확인한 뒤 입구로 돌아갈 수 있어요.</p>
      <button type="button" onClick={() => setOpen(false)}>닫기</button>
    </div>
  )
}
