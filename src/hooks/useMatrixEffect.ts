import { useCallback, useRef } from 'react'

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

/**
 * Returns event handlers that run a Matrix-style character-scramble on a
 * canvas element overlaid on the heading, then fade it out on mouse-leave.
 */
export function useMatrixEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const fadeRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  const stop = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    if (fadeRef.current !== null) {
      cancelAnimationFrame(fadeRef.current)
      fadeRef.current = null
    }
  }, [])

  const removeCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.remove()
      canvasRef.current = null
    }
  }, [])

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    stop()
    removeCanvas()

    const target = e.currentTarget
    containerRef.current = target

    const rect = target.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    const canvas = document.createElement('canvas')
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.position = 'fixed'
    canvas.style.top = `${rect.top}px`
    canvas.style.left = `${rect.left}px`
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '9999'
    canvas.style.opacity = '1'
    document.body.appendChild(canvas)
    canvasRef.current = canvas

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const fontSize = rect.height * 0.85
    ctx.font = `bold ${fontSize}px monospace`

    // Measure actual text to know how many columns fit
    const colWidth = fontSize * 0.62
    const cols = Math.ceil(rect.width / colWidth)
    const rows = Math.ceil(rect.height / fontSize)

    // Each column tracks its current head y position (in rows)
    const heads: number[] = Array.from({ length: cols }, () =>
      -Math.floor(Math.random() * rows * 2),
    )
    // Track how many frames each column has been active
    const speeds: number[] = Array.from({ length: cols }, () =>
      0.3 + Math.random() * 0.7,
    )

    // Get the computed accent / success color from the document root
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent')
      .trim() || '#a855f7'

    let frame = 0

    function draw() {
      ctx.clearRect(0, 0, rect.width, rect.height)

      for (let c = 0; c < cols; c++) {
        const headRow = heads[c]

        for (let r = 0; r < rows; r++) {
          const distFromHead = headRow - r

          if (distFromHead < 0 || distFromHead > rows) continue

          // Head char — bright white/accent
          if (distFromHead === 0) {
            ctx.fillStyle = '#ffffff'
            ctx.globalAlpha = 1
          } else {
            // Trail fades from accent to transparent
            const fade = 1 - distFromHead / (rows * 0.6)
            if (fade <= 0) continue
            ctx.fillStyle = accentColor
            ctx.globalAlpha = fade
          }

          const x = c * colWidth
          const y = (r + 1) * fontSize
          ctx.fillText(randomChar(), x, y)
        }

        heads[c] += speeds[c]

        // Reset once the tail has scrolled fully off
        if (heads[c] - rows > rows) {
          heads[c] = -Math.floor(Math.random() * rows)
          speeds[c] = 0.3 + Math.random() * 0.7
        }
      }

      ctx.globalAlpha = 1
      frame++
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
  }, [stop, removeCanvas])

  const onMouseLeave = useCallback(() => {
    // Stop drawing new frames and fade the canvas out
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }

    const canvas = canvasRef.current
    if (!canvas) return

    let opacity = 1

    function fade() {
      opacity -= 0.05
      if (canvas && opacity > 0) {
        canvas.style.opacity = String(opacity)
        fadeRef.current = requestAnimationFrame(fade)
      } else {
        removeCanvas()
      }
    }

    fadeRef.current = requestAnimationFrame(fade)
  }, [removeCanvas])

  return { onMouseEnter, onMouseLeave }
}
