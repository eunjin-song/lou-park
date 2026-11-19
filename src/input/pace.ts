let running = false

export function runHeld(): boolean {
  return running
}

export function setRunHeld(next: boolean): void {
  running = next
}

export function toggleRun(): boolean {
  running = !running
  return running
}
