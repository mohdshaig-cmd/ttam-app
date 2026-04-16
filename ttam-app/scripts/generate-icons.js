#!/usr/bin/env node
/**
 * TTAM Icon Generator
 * Run: node scripts/generate-icons.js
 * Requires: npm install canvas (local only, not in prod)
 *
 * This creates all needed PWA icon sizes in public/icons/
 * If you prefer, use https://realfavicongenerator.net with logo.svg
 */

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outDir = path.join(__dirname, '../public/icons')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const s = size / 100  // scale factor

  // Background
  ctx.fillStyle = '#0f4a0f'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.18)
  ctx.fill()

  // Paddle (ellipse)
  ctx.fillStyle = '#2d8a2d'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = s * 2
  ctx.beginPath()
  ctx.ellipse(52 * s, 32 * s, 18 * s, 20 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Paddle handle
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(43 * s, 50 * s, 18 * s, 20 * s, 4 * s)
  ctx.fill()

  // Table
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(12 * s, 72 * s, 76 * s, 9 * s, 2 * s)
  ctx.fill()

  // Table legs
  ctx.beginPath()
  ctx.roundRect(20 * s, 80 * s, 7 * s, 14 * s, 2 * s)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(73 * s, 80 * s, 7 * s, 14 * s, 2 * s)
  ctx.fill()

  // Ball
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(80 * s, 22 * s, 8 * s, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toBuffer('image/png')
}

sizes.forEach(size => {
  try {
    const buf = drawIcon(size)
    fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buf)
    console.log(`✓ icon-${size}.png`)
  } catch (e) {
    console.error(`✗ icon-${size}.png – ${e.message}`)
  }
})

console.log('\nDone! Icons saved to public/icons/')
console.log('\nAlternatively, generate icons online at:')
console.log('https://realfavicongenerator.net')
