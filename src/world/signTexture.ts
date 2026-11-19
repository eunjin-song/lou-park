import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'

function board(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('sign')
  draw(ctx, width, height)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function paintPaw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y + 8 * scale, 16 * scale, 12 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  for (const toe of [-18, -6, 6, 18]) {
    ctx.beginPath()
    ctx.arc(x + toe * scale, y - 16 * scale, 6 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function playgroundSignTexture(): Texture {
  return board(640, 320, (ctx, width, height) => {
    ctx.fillStyle = '#fff8ef'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#ef86a8'
    ctx.lineWidth = 16
    ctx.strokeRect(12, 12, width - 24, height - 24)
    paintPaw(ctx, 108, 168, 2.1, '#e39b74')
    ctx.fillStyle = '#3d5c52'
    ctx.font = '700 78px "Malgun Gothic", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('강아지 놀이터', 380, height / 2)
  })
}

export function directionSignTexture(turn: 'left' | 'right' = 'right'): Texture {
  return board(512, 220, (ctx, width, height) => {
    ctx.fillStyle = '#fffdf8'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#8fbfa8'
    ctx.lineWidth = 12
    ctx.strokeRect(8, 8, width - 16, height - 16)
    ctx.fillStyle = '#3d5c52'
    ctx.font = '700 48px "Malgun Gothic", "Segoe UI", sans-serif'
    ctx.textAlign = turn === 'right' ? 'left' : 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText('강아지 놀이터', turn === 'right' ? 28 : width - 28, height / 2)
    ctx.fillStyle = '#ef86a8'
    const tip = turn === 'right' ? width - 26 : 26
    const back = turn === 'right' ? width - 82 : 82
    ctx.beginPath()
    ctx.moveTo(back, 70)
    ctx.lineTo(back, 150)
    ctx.lineTo(tip, 110)
    ctx.closePath()
    ctx.fill()
  })
}

export function bagLabelTexture(): Texture {
  return board(512, 200, (ctx, width, height) => {
    ctx.fillStyle = '#fff4ea'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#8a5a3a'
    ctx.font = '700 72px "Malgun Gothic", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('배변봉투', width / 2, height / 2)
  })
}

export function binLabelTexture(): Texture {
  return board(640, 240, (ctx, width, height) => {
    ctx.fillStyle = '#e7f6ee'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#2f6d58'
    ctx.font = '700 58px "Malgun Gothic", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('배변 전용 휴지통', width / 2, height / 2 + 8)
    paintPaw(ctx, 78, 132, 1.15, '#d98a62')
  })
}
