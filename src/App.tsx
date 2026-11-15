import { useState } from 'react'
import { sendChat, useChatError } from './session/chatChannel.ts'
import { ChatInput } from './ui/ChatInput.tsx'
import { readNickname } from '../shared/protocol.ts'
import { NicknameEntry } from './ui/NicknameEntry.tsx'
import { ParkScene } from './scene/ParkScene.tsx'
import { Hud } from './ui/Hud.tsx'

export default function App() {
  const [nickname, setNickname] = useState('')
  const chatError = useChatError()
  return (
    <>
      {nickname ? <ParkScene nickname={nickname} /> : <NicknameEntry onEnter={name => setNickname(readNickname(name) ?? '')} />} 
      <Hud />
      {nickname && <ChatInput send={sendChat} error={chatError} />}
    </>
  )
}
