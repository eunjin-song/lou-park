let blocked = false
export function setInputBlocked(value: boolean) {
  blocked = value
  window.dispatchEvent(new Event('park-input-reset'))
}
export function isInputBlocked() {
  const active = document.activeElement
  return blocked || active instanceof HTMLElement && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))
}
