import { downloadBlob, slugify } from '../utils/downloadHelper'
import type { Character as BaseCharacter } from '../../../shared/types/database'
import type { NodeDatum, LinkDatum } from '../../relationships/types'

type Character = BaseCharacter & Record<string, any>

// Helper for rounded rectangles on standard Canvas context
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number | { tl: number, tr: number, bl: number, br: number }
) {
  let radii = { tl: 0, tr: 0, bl: 0, br: 0 }
  if (typeof r === 'number') {
    radii = { tl: r, tr: r, bl: r, br: r }
  } else {
    radii = { ...radii, ...r }
  }
  ctx.beginPath()
  ctx.moveTo(x + radii.tl, y)
  ctx.lineTo(x + w - radii.tr, y)
  ctx.arcTo(x + w, y, x + w, y + radii.tr, radii.tr)
  ctx.lineTo(x + w, y + h - radii.br)
  ctx.arcTo(x + w, y + h, x + w - radii.br, y + h, radii.br)
  ctx.lineTo(x + radii.bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - radii.bl, radii.bl)
  ctx.lineTo(x, y + radii.tl)
  ctx.arcTo(x, y, x + radii.tl, y, radii.tl)
  ctx.closePath()
}

function truncate(text: string, count: number): string {
  if (text.length <= count) return text
  return text.substring(0, count) + '...'
}

export function exportCharacterCardPng(char: Character): void {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 560
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const accent = '#7B5EA7'
  const bg = '#13131F'
  const card = '#1A1A28'
  const textPrimary = '#E6E6F0'
  const textSecondary = '#8E8EA8'
  const textMuted = '#56566A'

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 400, 560)

  // Card
  ctx.fillStyle = card
  roundRect(ctx, 20, 20, 360, 520, 16)
  ctx.fill()

  // Accent top stripe
  ctx.fillStyle = accent
  roundRect(ctx, 20, 20, 360, 6, { tl: 16, tr: 16, bl: 0, br: 0 })
  ctx.fill()

  // Character avatar circle
  const avatarX = 200
  const avatarY = 100
  const avatarR = 52

  // Derive color from name
  const colors = ['#7B5EA7','#4F8AF4','#FF6B9D','#4ADE80','#FBBF24','#FB923C','#60A5FA','#F87171']
  const colorIdx = char.name.charCodeAt(0) % colors.length
  ctx.fillStyle = colors[colorIdx]
  ctx.beginPath()
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2)
  ctx.fill()

  // Initial letter
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 44px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char.name.charAt(0).toUpperCase(), avatarX, avatarY)

  // Name
  ctx.fillStyle = textPrimary
  ctx.font = 'bold 22px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(truncate(char.name, 22), 200, 168)

  // Pronouns + species
  const sub = [char.pronouns, char.species].filter(Boolean).join(' · ')
  if (sub) {
    ctx.fillStyle = textSecondary
    ctx.font = '14px Inter, system-ui, sans-serif'
    ctx.fillText(sub, 200, 196)
  }

  // Role badge
  let currentY = 226
  if (char.narrative_role) {
    ctx.fillStyle = 'rgba(123,94,167,0.2)'
    roundRect(ctx, 140, currentY, 120, 24, 12)
    ctx.fill()
    ctx.fillStyle = '#B97AFF'
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(truncate(char.narrative_role.toUpperCase(), 16), 200, currentY + 12)
    currentY += 40
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const drawField = (label: string, value: string | null | undefined, x: number, y: number) => {
    if (!value) return false
    ctx.fillStyle = textMuted
    ctx.font = '600 10px Inter, system-ui, sans-serif'
    ctx.fillText(label.toUpperCase(), x, y)
    ctx.fillStyle = textPrimary
    ctx.font = '14px Inter, system-ui, sans-serif'
    ctx.fillText(truncate(value, 20), x, y + 16)
    return true
  }

  drawField('Age', char.age, 40, currentY)
  drawField('Occupation', char.occupation, 200, currentY)
  currentY += 50

  drawField('Core Wound', char.core_wound, 40, currentY)
  currentY += 50

  if (char.personality_summary) {
    ctx.fillStyle = textMuted
    ctx.font = '600 10px Inter, system-ui, sans-serif'
    ctx.fillText('PERSONALITY', 40, currentY)
    currentY += 16

    ctx.fillStyle = textPrimary
    ctx.font = '13px Inter, system-ui, sans-serif'
    
    // Simple line wrapper
    const words = char.personality_summary.split(' ')
    let line = ''
    for (const word of words) {
      if (ctx.measureText(line + word + ' ').width > 320) {
        ctx.fillText(line, 40, currentY)
        currentY += 20
        line = word + ' '
        if (currentY > 480) break
      } else {
        line += word + ' '
      }
    }
    if (currentY <= 480) {
      ctx.fillText(line, 40, currentY)
    }
  }

  // Draw logo / footer
  ctx.fillStyle = textMuted
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Generated with Recoil', 200, 510)

  // Export
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(`${slugify(char.name)}-card.png`, blob, 'image/png')
  }, 'image/png')
}

export function exportRelationshipWebSvg(
  svgRef: React.RefObject<SVGSVGElement | null>,
  title: string
) {
  if (!svgRef.current) return
  
  const svgNode = svgRef.current.cloneNode(true) as SVGSVGElement
  
  // Set explicit dimensions based on viewBox or bounding client rect
  const viewBox = svgNode.getAttribute('viewBox')
  if (viewBox) {
    const [, , w, h] = viewBox.split(' ').map(Number)
    svgNode.setAttribute('width', `${w}px`)
    svgNode.setAttribute('height', `${h}px`)
  } else {
    const rect = svgRef.current.getBoundingClientRect()
    svgNode.setAttribute('width', `${rect.width}px`)
    svgNode.setAttribute('height', `${rect.height}px`)
  }

  // Ensure CSS namespace
  svgNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svgNode)

  // Extract necessary styles to embed so SVG works standalone
  const embeddedCss = `
    <style>
      text { font-family: Inter, system-ui, sans-serif; }
      .node-label { fill: #E6E6F0; font-weight: 500; font-size: 14px; pointer-events: none; }
      .link-path { fill: none; stroke: rgba(255,255,255,0.15); stroke-width: 1.5; stroke-dasharray: 4,4; }
    </style>
  `
  
  svgString = svgString.replace(/^<svg[^>]*>/, match => match + embeddedCss)

  downloadBlob(`${slugify(title)}-web.svg`, svgString, 'image/svg+xml')
}
