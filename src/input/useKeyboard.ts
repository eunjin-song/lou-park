import { useEffect, useRef } from 'react'
import { isInputBlocked } from './inputGate.ts'
import { isMoveKey } from './readMoveInput.ts'

/** Tracks physical keys. Cleared on blur so a released key cannot stick. */
export function useKeyboard() {
  const keys = useRef(new Set<string>())

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInputBlocked()) { keys.current.clear(); return }
      keys.current.add(event.code)
      if (isMoveKey(event.code)) {
        event.preventDefault()
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.code)
    }
    const clear = () => {
      keys.current.clear()
    }

    const onHide = () => {
      if (document.visibilityState === 'hidden') clear()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clear)
    window.addEventListener('pagehide', clear)
    window.addEventListener('park-input-reset', clear)
    window.addEventListener('focusin', clear)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clear)
      window.removeEventListener('pagehide', clear)
      window.removeEventListener('park-input-reset', clear)
      window.removeEventListener('focusin', clear)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  return keys
}
