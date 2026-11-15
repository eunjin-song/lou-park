import { useState } from 'react'
import { readNickname } from '../../shared/protocol.ts'
const key = 'lou-park.nickname'
export function NicknameEntry({ onEnter }: { onEnter: (name: string) => void }) {
  const [value, setValue] = useState(() => {
    try { return readNickname(localStorage.getItem(key)) ?? '' } catch { return '' }
  })
  const [error, setError] = useState('')
  return <div className="entry-screen"><form className="entry-card" onSubmit={event => {
    event.preventDefault()
    const name = readNickname(value)
    if (!name) { setError('닉네임은 2~12자, 한글·영문·숫자·공백·_·-로 입력해 주세요.'); return }
    try { localStorage.setItem(key, name) } catch { /* Entry still works when storage is unavailable. */ }
    onEnter(name)
  }}>
    <h1>LOU Park</h1><p>강아지와 함께 산책할 이름을 알려 주세요.</p>
    <label htmlFor="nickname">닉네임</label>
    <input id="nickname" autoFocus value={value} maxLength={48} onChange={e => setValue(e.target.value)} autoComplete="nickname" />
    <p className="form-error" role="alert">{error}</p><button type="submit">공원 입장</button>
  </form></div>
}
