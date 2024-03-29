import './style.css'

import { ComponentParam, Point } from './global'
import { getQueryParams, QueryParams } from './get-query-params'

type Hook = {
  onHit?: () => void
  testHit?: (point: Point) => boolean
}
type Component = (param: ComponentParam) => Hook

let hooks: Hook[]

const Edge: Component = (param: ComponentParam) => {
  EdgeInnerShadow(param)
  EdgeLine(param)
  return {}
}

const EdgeLine: Component = ({ ctx, centerX, centerY }: ComponentParam) => {
  const path = new Path2D()
  path.arc(centerX, centerY, 420, 0, 2 * Math.PI)
  ctx.save()
  ctx.lineWidth = 40
  ctx.strokeStyle = 'white'
  ctx.stroke(path)
  ctx.restore()
  return {}
}

const EdgeInnerShadow: Component = ({
  ctx,
  centerX,
  centerY,
}: ComponentParam) => {
  const path = new Path2D()
  path.arc(centerX, centerY, 400, 0, 2 * Math.PI)
  ctx.save()
  ctx.shadowColor = 'black'
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 10
  ctx.shadowOffsetY = 10
  ctx.strokeStyle = 'white'
  ctx.stroke(path)
  ctx.restore()
  return {}
}

export type Entry = {
  label: string
}
type PieceParam = Entry & {
  angle: number
  arcLength: number
  color: string
}
const Piece = ({
  ctx,
  centerX,
  centerY,
  angle,
  arcLength,
  color,
  label,
}: PieceParam & ComponentParam) => {
  const path = new Path2D()
  path.moveTo(0, 0)
  path.arc(0, 0, 400, -arcLength / 2, +arcLength / 2)
  path.lineTo(0, 0)
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(angle)
  ctx.lineWidth = 20
  ctx.strokeStyle = 'white'
  ctx.stroke(path)
  ctx.fillStyle = color
  ctx.fill(path)
  ctx.fillStyle = 'white'
  ctx.font = '50px Arial'
  ctx.fillText(label, 100, 0, 250)
  ctx.restore()
}

type PiecesParam = {
  entries: Entry[]
}
const Pieces = ({ entries, rotate, ...rest }: PiecesParam & ComponentParam) => {
  entriesToPieceParams(entries).forEach(({ angle, ...restParam }) => {
    Piece({ angle: angle + rotate, ...restParam, rotate, ...rest })
  })
  return {}
}

const entriesToPieceParams = (entries: Entry[]): PieceParam[] => {
  const total = entries.length
  return entries.map((entry, index) => {
    const angle = (index / total) * Math.PI * 2
    return {
      ...entry,
      angle,
      arcLength: (Math.PI * 2) / total,
      color: `HSLA(${(angle / Math.PI) * 180}, 100%, 66%, 1)`,
    }
  })
}

const PlaySign = ({ ctx, centerX, centerY }: ComponentParam) => {
  const side = 30
  const path = new Path2D()
  path.moveTo(centerX - side / Math.sqrt(3), centerY - side)
  path.lineTo(centerX + (side * 2) / Math.sqrt(3), centerY)
  path.lineTo(centerX - side / Math.sqrt(3), centerY + side)
  path.closePath()
  ctx.save()
  ctx.fillStyle = 'white'
  ctx.fill(path)
  ctx.restore()
}

const ShaftBody = ({ ctx, centerX, centerY }: ComponentParam) => {
  const path = new Path2D()
  path.arc(centerX, centerY, 50, 0, 2 * Math.PI)
  ctx.save()
  ctx.lineWidth = 30
  ctx.strokeStyle = 'white'
  ctx.stroke(path)
  ctx.fillStyle = 'royalblue'
  ctx.fill(path)
  ctx.restore()
}

const Shaft: Component = (param: ComponentParam) => {
  ShaftBody(param)
  PlaySign(param)

  const testHit = (point: Point) =>
    (point.x - param.centerX) ** 2 + (point.y - param.centerY) ** 2 < 50 ** 2
  return { onHit: param.initSpin, testHit }
}

const draw = (
  canvas: HTMLCanvasElement,
  queryParams: QueryParams,
  rotate: number
): Hook[] => {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const spin = (r: number, delta: number): void => {
    if (delta < 0.005) {
      return
    }
    hooks = draw(canvas, queryParams, r)
    window.requestAnimationFrame(() => spin(r + delta, delta * 0.966))
  }
  const initSpin = () => spin(rotate, 0.75 + Math.random())

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const param: ComponentParam = {
    rotate,
    ctx,
    centerX,
    centerY,
    initSpin,
  }
  return [
    Pieces({ ...param, entries: queryParams.entries || [] }),
    Shaft(param),
    Edge(param),
  ]
}

const main = () => {
  const canvas = <HTMLCanvasElement>document.getElementById('spinner')
  const queryParams = getQueryParams(location.search)

  hooks = draw(canvas, queryParams, 0)
  canvas.addEventListener('click', function (e) {
    const rect = canvas.getBoundingClientRect()
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    hooks.forEach((hook) => {
      if (hook?.testHit?.(point)) {
        hook?.onHit?.()
      }
    })
  })
}

document.addEventListener('DOMContentLoaded', main)
