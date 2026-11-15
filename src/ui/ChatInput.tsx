import { useEffect, useRef, useState } from 'react'
import { CHAT_INTERVAL_MS, CHAT_MAX_LENGTH, readChat } from '../../shared/protocol.ts'
import { setInputBlocked } from '../input/inputGate.ts'
import { useConnection } from '../session/connection.ts'
export function ChatInput({ send, error }: { send: (text: string) => boolean; error: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const lastSent = useRef(0)
  const connection = useConnection()
  const close = () => { setOpen(false); setText(''); setNotice(''); setInputBlocked(false); input.current?.blur() }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229 || event.repeat) return
      if (event.key === 'Escape') { close(); return }
      const target = event.target
      if (event.key === 'Enter' && !(target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|BUTTON)$/.test(target.tagName)))) {
        event.preventDefault(); setInputBlocked(true); setOpen(true)
      }
    }
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('keydown', key); setInputBlocked(false) }
  }, [])
  useEffect(() => { if (open) input.current?.focus() }, [open])
  return <div className="chat-panel">
    {(notice || error) && <p className="form-error" role="status">{notice || error}</p>}
    {open ? <form onSubmit={event => {
      event.preventDefault()
      if (!readChat(text)) { setNotice('공백만 보내거나 120자를 넘길 수 없어요.'); return }
      if (Date.now() - lastSent.current < CHAT_INTERVAL_MS) { setNotice('1초 뒤에 다시 보내 주세요.'); return }
      if (send(text)) { lastSent.current = Date.now(); close() }
    }}><label htmlFor="park-chat">메시지 · Enter 전송 / Esc 닫기</label>
      <div className="chat-row"><input id="park-chat" ref={input} value={text} maxLength={CHAT_MAX_LENGTH * 2} onChange={e => setText(e.target.value)}
        onFocus={() => setInputBlocked(true)} onKeyDown={e => {
          if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229)) e.preventDefault()
        }} placeholder="함께 산책하는 사람에게 인사해요" autoComplete="off" />
      <button type="submit" disabled={connection.status !== 'connected'}>전송</button></div>
    </form> : <button className="chat-open" onClick={() => { setInputBlocked(true); setOpen(true) }}>Enter · 대화하기</button>}
  </div>
}
