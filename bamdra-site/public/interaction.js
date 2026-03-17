(function () {
  const state = {
    canvas: null,
    ctx: null,
    nodes: [],
    rafId: 0,
    width: 0,
    height: 0,
    pointerX: -9999,
    pointerY: -9999,
    noiseSeedX: Math.random() * 1000,
    noiseSeedY: Math.random() * 1000,
    isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function fract(value) {
    return value - Math.floor(value)
  }

  function smoothstep(edge0, edge1, value) {
    const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
  }

  function rand2(x, y) {
    return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123)
  }

  function valueNoise(x, y) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy

    const a = rand2(ix, iy)
    const b = rand2(ix + 1, iy)
    const c = rand2(ix, iy + 1)
    const d = rand2(ix + 1, iy + 1)

    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)

    return a + (b - a) * ux + (c - a) * uy * (1 - ux) + (d - b) * ux * uy
  }

  function simplexLikeNoise(x, y) {
    let amplitude = 0.55
    let frequency = 1
    let total = 0
    let normalization = 0

    for (let i = 0; i < 4; i += 1) {
      total += valueNoise(x * frequency, y * frequency) * amplitude
      normalization += amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    return total / normalization
  }

  function ensureCanvas() {
    const root = document.body
    if (!root) return

    let canvas = document.getElementById('memory-neural-canvas')
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.id = 'memory-neural-canvas'
      root.prepend(canvas)
    }

    state.canvas = canvas
    state.ctx = canvas.getContext('2d')
  }

  function buildNodes() {
    if (!state.canvas) return

    const density = state.width < 768 ? 44 : 56
    const cols = Math.ceil(state.width / density)
    const rows = Math.ceil(state.height / density)
    const nodes = []

    for (let row = 0; row <= rows; row += 1) {
      for (let col = 0; col <= cols; col += 1) {
        const offset = row % 2 === 0 ? density * 0.25 : -density * 0.15
        const x = col * density + offset
        const y = row * density
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          pulse: Math.random() * Math.PI * 2
        })
      }
    }

    state.nodes = nodes
  }

  function resize() {
    if (!state.canvas) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    state.width = window.innerWidth
    state.height = window.innerHeight
    state.canvas.width = state.width * ratio
    state.canvas.height = state.height * ratio
    state.canvas.style.width = `${state.width}px`
    state.canvas.style.height = `${state.height}px`
    state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    buildNodes()
  }

  function draw(timestamp) {
    if (!state.ctx) return

    const time = timestamp * 0.00022
    const ctx = state.ctx
    ctx.clearRect(0, 0, state.width, state.height)

    for (let i = 0; i < state.nodes.length; i += 1) {
      const node = state.nodes[i]
      const noise = simplexLikeNoise(
        node.baseX * 0.0032 + state.noiseSeedX,
        node.baseY * 0.0032 + time + state.noiseSeedY
      )
      const breathe = Math.sin(time * 2.8 + node.pulse) * 1.25
      node.x = node.baseX + (noise - 0.5) * 10
      node.y = node.baseY + breathe + (noise - 0.5) * 8

      const dx = state.pointerX - node.x
      const dy = state.pointerY - node.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const activation = 1 - Math.min(distance / 150, 1)
      node.activation = activation > 0 ? activation : 0
    }

    for (let i = 0; i < state.nodes.length; i += 1) {
      const node = state.nodes[i]
      if (node.activation <= 0.02) continue

      for (let j = i + 1; j < state.nodes.length; j += 1) {
        const other = state.nodes[j]
        if (other.activation <= 0.02) continue
        const dx = other.x - node.x
        const dy = other.y - node.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 78) continue

        const alpha = Math.min(node.activation, other.activation) * (1 - distance / 78) * 0.65
        ctx.strokeStyle = `rgba(123, 231, 212, ${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(other.x, other.y)
        ctx.stroke()
      }
    }

    for (const node of state.nodes) {
      const glow = smoothstep(0, 1, node.activation)
      const radius = glow > 0 ? 2.1 + glow * 1.8 : 1.2
      ctx.beginPath()
      ctx.fillStyle = glow > 0
        ? `rgba(184, 244, 238, ${0.25 + glow * 0.65})`
        : 'rgba(162, 184, 222, 0.22)'
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!state.isReducedMotion) {
      state.rafId = window.requestAnimationFrame(draw)
    }
  }

  function bindPointer() {
    window.addEventListener('pointermove', (event) => {
      state.pointerX = event.clientX
      state.pointerY = event.clientY
    }, { passive: true })

    window.addEventListener('pointerleave', () => {
      state.pointerX = -9999
      state.pointerY = -9999
    }, { passive: true })
  }

  function bindFeatureHighlights() {
    const updateGradient = () => {
      const cards = document.querySelectorAll('.VPFeature')
      for (const card of cards) {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect()
          card.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`)
          card.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`)
        })
      }
    }

    updateGradient()
    document.addEventListener('vitepress:route-change', updateGradient)
  }

  function applyParallax() {
    const elements = document.querySelectorAll('.VPDoc :is(h1, h2, .doc-figure)')
    const viewport = window.innerHeight

    for (const element of elements) {
      const rect = element.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const normalized = (center - viewport / 2) / viewport
      const shift = Math.max(-10, Math.min(10, normalized * -12))
      element.style.setProperty('--parallax-shift', `${shift.toFixed(2)}px`)
    }
  }

  function boot() {
    ensureCanvas()
    if (!state.canvas || !state.ctx) return
    resize()
    bindPointer()
    bindFeatureHighlights()
    applyParallax()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('scroll', applyParallax, { passive: true })
    document.addEventListener('vitepress:route-change', applyParallax)

    if (state.isReducedMotion) {
      draw(0)
      return
    }

    window.cancelAnimationFrame(state.rafId)
    state.rafId = window.requestAnimationFrame(draw)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true })
  } else {
    boot()
  }
})()
