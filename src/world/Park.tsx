import { Benches } from './Benches.tsx'
import { Boundary } from './Boundary.tsx'
import { Flowers } from './Flowers.tsx'
import { Ground } from './Ground.tsx'
import { Path } from './Path.tsx'
import { Pond } from './Pond.tsx'
import { Trees } from './Trees.tsx'

export function Park() {
  return (
    <group>
      <Ground />
      <Path />
      <Pond />
      <Trees />
      <Benches />
      <Flowers />
      <Boundary />
    </group>
  )
}
