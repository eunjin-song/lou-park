import { palette } from '../game/constants.ts'

export function Lights() {
  return (
    <>
      <hemisphereLight color="#fff6e6" groundColor={palette.grass} intensity={0.7} />
      <ambientLight color="#fffaf4" intensity={0.28} />
      <directionalLight
        position={[18, 26, 12]}
        intensity={1.55}
        color="#fff1dc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={2}
        shadow-camera-far={80}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-bias={-0.0002}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[-14, 8, 18]} intensity={0.38} color="#d9ecff" />
    </>
  )
}
