import { useSyncExternalStore } from 'react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'full'

export type ConnectionState = {
  status: ConnectionStatus
  people: number
}

let state: ConnectionState = { status: 'connecting', people: 0 }
const listeners = new Set<() => void>()

export function publishConnection(next: ConnectionState) {
  if (state.status === next.status && state.people === next.people) return
  state = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): ConnectionState {
  return state
}

export function useConnection(): ConnectionState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function connectionLabel(status: ConnectionStatus, people: number): string {
  if (status === 'connected' && people <= 1) return '공원에 연결됐어요. 다른 사람을 기다리는 중이에요.'
  if (status === 'connected') return `공원에 연결됐어요. 지금 ${people}명이 함께 있어요.`
  if (status === 'disconnected') return '연결이 끊겼어요. 다시 접속하는 중이에요.'
  if (status === 'full') return '공원이 가득 찼어요. 잠시 후 다시 시도해요.'
  return '공원에 들어가는 중이에요.'
}
