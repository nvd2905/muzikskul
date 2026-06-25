'use client'

import { useEffect, useRef } from 'react'

export default function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let t = 0
    let raf: number

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      W = rect.width
      H = canvas!.offsetHeight
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = `${W}px`
      canvas!.style.height = `${H}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)

      // subtle grid
      ctx!.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx!.lineWidth = 1
      for (let i = 1; i < 4; i++) {
        ctx!.beginPath()
        ctx!.moveTo(0, H * i / 4)
        ctx!.lineTo(W, H * i / 4)
        ctx!.stroke()
      }
      for (let i = 1; i < 5; i++) {
        ctx!.beginPath()
        ctx!.moveTo(W * i / 5, 0)
        ctx!.lineTo(W * i / 5, H)
        ctx!.stroke()
      }

      const cy = H / 2

      // wave 1 — indigo (music)
      ctx!.beginPath()
      ctx!.strokeStyle = '#818cf8'
      ctx!.lineWidth = 2
      ctx!.shadowColor = '#6366f1'
      ctx!.shadowBlur = 10
      for (let x = 0; x <= W; x++) {
        const p = x / W
        const y =
          cy +
          Math.sin(p * Math.PI * 2 * 2.2 + t) * (H * 0.19) +
          Math.sin(p * Math.PI * 2 * 3.7 + t * 1.3) * (H * 0.08) +
          Math.sin(p * Math.PI * 2 * 0.5 + t * 0.7) * (H * 0.05)
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
      }
      ctx!.stroke()
      ctx!.shadowBlur = 0

      // wave 2 — amber (fund pulse)
      ctx!.beginPath()
      ctx!.strokeStyle = 'rgba(245,158,11,0.65)'
      ctx!.lineWidth = 1.5
      ctx!.shadowColor = '#f59e0b'
      ctx!.shadowBlur = 6
      for (let x = 0; x <= W; x++) {
        const p = x / W
        const y =
          cy +
          Math.sin(p * Math.PI * 2 * 1.8 + t * 0.8 + 1.5) * (H * 0.14) +
          Math.sin(p * Math.PI * 2 * 5.1 + t * 1.1) * (H * 0.05)
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
      }
      ctx!.stroke()
      ctx!.shadowBlur = 0

      // centre dashes
      ctx!.beginPath()
      ctx!.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx!.lineWidth = 1
      ctx!.setLineDash([4, 7])
      ctx!.moveTo(0, cy)
      ctx!.lineTo(W, cy)
      ctx!.stroke()
      ctx!.setLineDash([])

      t += 0.022
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="block h-full w-full" />
}
