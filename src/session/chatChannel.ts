import { useSyncExternalStore } from 'react'
let sender: (text: string) => boolean = () => false
let error = ''
const listeners = new Set<() => void>()
export function bindChatSender(next: (text: string) => boolean) { sender = next }
export function sendChat(text: string) { return sender(text) }
export function publishChatError(next: string) {
  error = next
  for (const listener of listeners) listener()
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function useChatError() { return useSyncExternalStore(subscribe, () => error, () => '') }
