import { useState } from 'react'
import { sendChat, useChatError } from './session/chatChannel.ts'
import { ChatInput } from './ui/ChatInput.tsx'
import { readNickname } from '../shared/protocol.ts'
import { NicknameEntry } from './ui/NicknameEntry.tsx'
import { ParkScene } from './scene/ParkScene.tsx'
import { Hud } from './ui/Hud.tsx'
import { Joystick } from './ui/Joystick.tsx'
import { ParkActions } from './ui/ParkActions.tsx'
import { ParkMap } from './ui/ParkMap.tsx'
import { TravelControls } from './ui/TravelControls.tsx'
import { WelcomeNote } from './ui/WelcomeNote.tsx'

export default function App() {
  const [nickname, setNickname] = useState('')
  const chatError = useChatError()
  return (
    <>
      {nickname ? <ParkScene nickname={nickname} /> : <NicknameEntry onEnter={name => setNickname(readNickname(name) ?? '')} />} 
      <Hud />
      {nickname && <Joystick />}
      {nickname && <ParkActions />}
      {nickname && <ParkMap />}
      {nickname && <TravelControls />}
      {nickname && <WelcomeNote />}
      {nickname && <ChatInput send={sendChat} error={chatError} />}
    </>
  )
}
