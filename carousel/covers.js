// ── Card covers ──────────────────────────────────────────────────────────────
// The four live cover artworks, shared by BOTH front ends: the phone grid
// (carousel/mobile.html) and the desktop fiction room (carousel/fiction.html).
// They live here rather than being copied into each so the two cannot drift the
// first time one of them is tuned.
//
//   drawFigure  Boogie   — a dancer under a spot, in a room a mirror ball sweeps
//   drawRope    Grafting — a rope laying itself up from the bottom
//   drawGemZoom CBC      — the gem folding endlessly into its own centre circle
//   drawStar    Dorthy   — a five-point star opening out of nothing
//
// Every one takes (ctx, W, H, t) in whatever pixel box it is handed and is safe
// to call at any size: the phone draws them at card width, the desktop room at
// the ring's 600x800 face. Each was settled on its own test page next door
// (boogie_test / grafting_test / cbc_test / star_test), and the constants below
// are the settings they were chosen at.

// ── Boogie cover ──────────────────────────────────────────────────────────────
// A dancer drawn live on the card: neon top, blue trousers, black shoes, lit by
// one spot from the top right, in a room a mirror ball is sweeping. Ported from
// carousel/boogie_test.html, which is where the timing was settled.
const DANCER_SPEED = 0.55        // the setting the dance was chosen at
// Stroke weight per unit of the figure's own scale. The body already scales off
// min(W,H)/190; before this the line did not, so the same dance drawn larger
// came out spindly. 5.43 is the weight it was approved at on a phone card,
// expressed so it holds at the desktop room's 600x800 face too.
const DANCER_LINE_PER_S = 5.43
const dancerLine = (W, H) => DANCER_LINE_PER_S * Math.min(W, H) / 190

const TAU = Math.PI * 2

// Palette. Neon orange top against the card's purple — near-complementary, so
// it reads hot rather than sitting into the ground. Trousers take the blue the
// PLEASE READ card uses.
const SHIRT = '#FF6A00'        // neon orange, against the purple
const TROUSERS = '#1E2BFF'
const SHOES = '#111111'
const SKIN = '#F2C6A0'          // peach, filled

function stroke(ctx, colour, width) {
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

// Scale a hex colour's brightness — below 1 darkens, above 1 lifts. Limbs on the
// far side of a turn get shaded, which is most of what sells the depth.
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)))
  const r = cl(((n >> 16) & 255) * k)
  const g = cl(((n >> 8) & 255) * k)
  const b = cl((n & 255) * k)
  return `rgb(${r},${g},${b})`
}

// ── Light ─────────────────────────────────────────────────────────────────────
// One source, up and to the right. Two jobs: a pool that drops everything the
// figure is standing in, and a direction that shades the figure itself, so the
// two read as the same light rather than a dark card with a bright cutout on it.
const LIGHT = { x: 0.80, y: 0.10 }     // as a fraction of the card

// How lit a point is: 1 at the figure's centre, falling off away from the source.
function lightAt(x, y, W, H) {
  const lx = LIGHT.x * W, ly = LIGHT.y * H
  const d = Math.hypot(x - lx, y - ly) / Math.hypot(W, H)
  return Math.max(0.55, Math.min(1.22, 1.30 - d * 1.15))
}

// The pool. Drawn under the figure, so the figure keeps its own brightness and
// only the ground around it goes down.
function drawSpot(ctx, W, H, fx, fy) {
  const r = Math.max(W, H) * 0.62
  const g = ctx.createRadialGradient(fx, fy - H * 0.06, r * 0.10, fx, fy - H * 0.06, r)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(0.42, 'rgba(0,0,0,0.34)')
  g.addColorStop(1, 'rgba(0,0,0,0.82)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // A little warmth spilling from the source itself.
  const lx = LIGHT.x * W, ly = LIGHT.y * H
  const w = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * 0.55)
  w.addColorStop(0, 'rgba(255,226,170,0.16)')
  w.addColorStop(1, 'rgba(255,226,170,0)')
  ctx.fillStyle = w
  ctx.fillRect(0, 0, W, H)
}

// ── Mirror ball ───────────────────────────────────────────────────────────────
// The ball itself is never drawn — only what it throws. Each facet is a point on
// a spinning sphere; what you see is where its beam lands, sweeping an arc
// across the room and dragging a short trail behind it. Blended additively, so
// two spots crossing get brighter rather than painting over each other.
const FACETS = Array.from({ length: 162 }, (_, i) => ({
  a: (i * 2.39996),                    // golden angle, so they never clump
  lat: -0.55 + ((i * 0.618) % 1) * 1.5,
  speed: 0.55 + ((i * 0.37) % 1) * 0.5,
  size: 0.5 + ((i * 0.73) % 1) * 0.9,
  warm: (i % 5) === 0,
}))

function facetAt(f, t, W, H) {
  const ang = f.a + t * f.speed
  // A wide ellipse: spots travel mostly sideways, rising and falling a little.
  const x = W * 0.5 + Math.cos(ang) * W * 0.92
  const y = H * (0.42 + f.lat * 0.30) + Math.sin(ang * 0.8 + f.a) * H * 0.16
  // Facing away from the room, a facet throws nothing.
  const face = Math.sin(ang)
  return { x, y, on: Math.max(0, face) }
}

// One spot, drawn once into an offscreen canvas per colour and then blitted.
// Building a fresh radial gradient for every spot of every trail of every frame
// is what the field actually costs; a sprite makes it a texture copy instead.
const SPOT_PX = 64
const SPOT_SPRITES = {}
function spotSprite(colour) {
  if (SPOT_SPRITES[colour]) return SPOT_SPRITES[colour]
  const c = document.createElement('canvas')
  c.width = c.height = SPOT_PX
  const x = c.getContext('2d')
  const g = x.createRadialGradient(SPOT_PX / 2, SPOT_PX / 2, 0, SPOT_PX / 2, SPOT_PX / 2, SPOT_PX / 2)
  g.addColorStop(0, `rgba(${colour},1)`)
  g.addColorStop(1, `rgba(${colour},0)`)
  x.fillStyle = g
  x.fillRect(0, 0, SPOT_PX, SPOT_PX)
  SPOT_SPRITES[colour] = c
  return c
}

function drawMirrorBall(ctx, W, H, t) {
  const unit = Math.min(W, H)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  FACETS.forEach((f) => {
    if (facetAt(f, t, W, H).on <= 0.02) return
    const sprite = spotSprite(f.warm ? '255,214,150' : '214,226,255')
    // The trail: the same facet a few moments ago, fading out.
    for (let k = 3; k >= 0; k--) {
      const past = facetAt(f, t - k * 0.055, W, H)
      if (past.on <= 0) continue
      const r = unit * 0.030 * f.size * (1 - k * 0.13)
      ctx.globalAlpha = 0.30 * (1 - k / 4.2) * past.on
      ctx.drawImage(sprite, past.x - r, past.y - r, r * 2, r * 2)
    }
  })
  ctx.restore()
}

// The figure is built in body space — x across the body, y down, z toward the
// viewer — and turned about the vertical axis before being drawn. That is what
// makes a turn read as a body rotating rather than a cutout being squashed:
// lateral offsets swing into depth, and depth swings out into width.
const px = (xb, zb, turn) => xb * Math.cos(turn) + zb * Math.sin(turn)
const pz = (xb, zb, turn) => -xb * Math.sin(turn) + zb * Math.cos(turn)

// Walk a two-segment limb in body space, returning its projected points and the
// depth of its midpoint (used for ordering and shading).
function limbPath(ox, oy, oz, segs, turn) {
  let xb = ox, y = oy, zb = oz
  const pts = [[px(xb, zb, turn), y]]
  let midZ = pz(xb, zb, turn)
  segs.forEach(([ang, sag, len], i) => {
    xb += Math.sin(ang) * len
    zb += Math.sin(sag) * len
    y += Math.cos(ang) * len
    pts.push([px(xb, zb, turn), y])
    if (i === 0) midZ = pz(xb, zb, turn)
  })
  return { pts, z: midZ }
}

function drawPath(ctx, cx, path, colour, width) {
  stroke(ctx, colour, width)
  ctx.beginPath()
  path.pts.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, y) : ctx.moveTo(cx + x, y)))
  ctx.stroke()
}

function drawFigure(ctx, W, H, p, lineWidth, t) {
  const S = Math.min(W, H) / 190
  const spine = 46 * S, neck = 8 * S, headR = 11 * S
  const upperArm = 26 * S, foreArm = 24 * S
  const thigh = 30 * S, shin = 30 * S
  const shoulderW = 15 * S, hipW = 9 * S
  const shoe = 13 * S

  const wTorso = lineWidth * 2.6
  const wLimb  = lineWidth * 1.7
  const wShoe  = lineWidth * 2.2

  const turn = p.turn
  const cx = W / 2 + p.driftX * S
  const pelvisY = H * 0.62 + p.bob * S
  const z = (v) => (v || 0)

  drawSpot(ctx, W, H, cx, pelvisY)
  // Thrown onto the room before the figure, so he stands in the light rather
  // than wearing it.
  drawMirrorBall(ctx, W, H, t)

  // Spine top, leaning across the body.
  const spineXb = Math.sin(p.lean) * spine
  const neckY = pelvisY - Math.cos(p.lean) * spine
  const shoulderY = pelvisY - Math.cos(p.lean) * spine * 0.86
  const shoulderXb = Math.sin(p.lean) * spine * 0.86

  // Limbs, built in body space then projected.
  const arms = [
    { side: -1, ...limbPath(shoulderXb - shoulderW, shoulderY, 0,
        [[p.armL, z(p.armLz), upperArm], [p.armL + p.foreL, z(p.armLz), foreArm]], turn) },
    { side:  1, ...limbPath(shoulderXb + shoulderW, shoulderY, 0,
        [[p.armR, z(p.armRz), upperArm], [p.armR + p.foreR, z(p.armRz), foreArm]], turn) },
  ]
  const legs = [
    { side: -1, ...limbPath(-hipW, pelvisY, 0,
        [[p.legL, z(p.legLz), thigh], [p.legL + p.kneeL, z(p.legLz), shin]], turn) },
    { side:  1, ...limbPath(hipW, pelvisY, 0,
        [[p.legR, z(p.legRz), thigh], [p.legR + p.kneeR, z(p.legRz), shin]], turn) },
  ]

  // Behind the body, and away from the light, are two separate darkenings; a
  // limb can be both.
  const tint = (part) => {
    const [mx, my] = part.pts[1] || part.pts[0]
    return (part.z < 0 ? 0.62 : 1) * lightAt(cx + mx, my, W, H)
  }

  const drawLeg = (l) => {
    drawPath(ctx, cx, l, shade(TROUSERS, tint(l)), wLimb)
    const [fx, fy] = l.pts[l.pts.length - 1]
    stroke(ctx, shade(SHOES, tint(l)), wShoe)
    ctx.beginPath(); ctx.moveTo(cx + fx, fy)
    // The toe points along the body's own facing, so it swings round with it.
    ctx.lineTo(cx + fx + px(shoe * l.side, 0, turn), fy + wShoe * 0.15)
    ctx.stroke()
  }
  const drawArm = (a) => drawPath(ctx, cx, a, shade(SHIRT, tint(a)), wLimb)

  // Back to front: whatever is behind the torso, then the torso, then the rest.
  legs.filter(l => l.z < 0).forEach(drawLeg)
  arms.filter(a => a.z < 0).forEach(drawArm)

  // Torso. Its width follows the turn, so the body narrows as it comes side-on,
  // with a floor so it stays a slab rather than disappearing to a line.
  const torsoH = spine * 0.86
  const torsoW = Math.max(shoulderW * 0.42, shoulderW * 1.9 * Math.abs(Math.cos(turn)))
  const hem = wTorso * 0.35
  ctx.save()
  ctx.translate(cx + px(0, 0, turn), pelvisY)
  ctx.rotate(p.lean)
  // Lit across the body from the source, so the shirt turns rather than sitting flat.
  const tg = ctx.createLinearGradient(torsoW / 2, -torsoH, -torsoW / 2, hem)
  tg.addColorStop(0, shade(SHIRT, Math.min(1.18, lightAt(cx + torsoW / 2, pelvisY - torsoH, W, H))))
  tg.addColorStop(1, shade(SHIRT, lightAt(cx - torsoW / 2, pelvisY, W, H) * 0.82))
  ctx.fillStyle = tg
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(-torsoW / 2, -torsoH, torsoW, torsoH + hem, torsoW * 0.16)
  else ctx.rect(-torsoW / 2, -torsoH, torsoW, torsoH + hem)
  ctx.fill()
  ctx.restore()

  legs.filter(l => l.z >= 0).forEach(drawLeg)
  arms.filter(a => a.z >= 0).forEach(drawArm)

  // Neck and head.
  const headXb = spineXb + Math.sin(p.lean + p.headTilt) * (neck + headR)
  const headY = neckY - Math.cos(p.lean + p.headTilt) * (neck + headR)
  stroke(ctx, SKIN, wLimb)
  ctx.beginPath()
  ctx.moveTo(cx + px(spineXb, 0, turn), neckY)
  ctx.lineTo(cx + px(headXb, 0, turn), headY)
  ctx.stroke()
  // Facing away, the head is the back of a head — same shape, less light on it.
  const facing = Math.cos(turn)
  const hxs = cx + px(headXb, 0, turn)
  const hl = lightAt(hxs, headY, W, H) * (facing < 0 ? 0.78 : 1)
  // A ball lit from the source: the highlight sits toward it, not at the centre.
  const hg = ctx.createRadialGradient(hxs + headR * 0.45, headY - headR * 0.45, headR * 0.1,
                                      hxs, headY, headR * 1.15)
  hg.addColorStop(0, shade(SKIN, Math.min(1.25, hl * 1.15)))
  hg.addColorStop(1, shade(SKIN, hl * 0.72))
  ctx.fillStyle = hg
  ctx.beginPath(); ctx.arc(hxs, headY, headR, 0, TAU); ctx.fill()
}

// ── The dances ────────────────────────────────────────────────────────────────
// Each returns the pose at time t (seconds). Angles in radians.
const DANCES = {

  'spinPoint': (t) => {
    // Four beats of dancing, then a turn with the arm out — the story's move.
    const cycle = 4.0
    const u = (t % cycle) / cycle
    const spinning = u > 0.5
    // Eased, so the turn accelerates away and settles rather than running at one
    // rate — a constant spin looks mechanical once the depth is real.
    const raw = spinning ? (u - 0.5) / 0.5 : 0
    const sp = raw * raw * (3 - 2 * raw)
    const b = t * TAU * 1.6
    const side = Math.sin(b)
    const point = spinning ? Math.min(1, sp * 2.2) : 0
    const kick = Math.max(0, Math.sin(b)), kick2 = Math.max(0, -Math.sin(b))
    return {
      turn: spinning ? sp * TAU : 0,
      driftX: side * 3, bob: Math.abs(Math.cos(b)) * -3,
      lean: side * 0.08, headTilt: -side * 0.10 + point * 0.16,
      // The pointing arm comes up and straightens, and reaches forward as the
      // body comes round — the sagittal swing is what carries it through depth
      // instead of it sliding flat across the card.
      armL: -0.42 - point * 1.15, foreL: -0.55 + point * 0.55, armLz: point * 1.05,
      armR:  0.42 + side * 0.25,  foreR:  0.55,                armRz: -point * 0.35,
      legL: -0.10 - kick * 0.32, kneeL: kick * 0.9,  legLz: Math.sin(b) * 0.22,
      legR:  0.10 + kick2 * 0.32, kneeR: -kick2 * 0.9, legRz: -Math.sin(b) * 0.22,
    }
  },


}


function mountDancer(el) {
  const canvas = document.createElement('canvas')
  canvas.className = 'dancer'
  el.insertBefore(canvas, el.firstChild)
  const ctx = canvas.getContext('2d')
  const dance = DANCES.spinPoint
  let clock = 0, last = performance.now(), onScreen = true

  // Off-screen cards stop drawing; a phone should not be running a mirror ball
  // for a room you are not looking at.
  if (window.IntersectionObserver) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0.05 }).observe(el)
  }
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const frame = (now) => {
    // The card is rebuilt whenever the room opens, so the loop ends with it
    // rather than leaking one per visit.
    if (!canvas.isConnected) return
    requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    if (!onScreen) return
    if (!still) clock += dt * DANCER_SPEED

    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(r.width * dpr)) {
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    ctx.clearRect(0, 0, r.width, r.height)
    drawFigure(ctx, r.width, r.height, dance(clock), dancerLine(r.width, r.height), clock)
  }
  requestAnimationFrame(frame)
}

// ── Grafting: a rope laying itself up ────────────────────────────────────────
// Built the way rope is built, so the braid falls out of the geometry rather
// than being drawn: a fibre rides a helix around its yarn's centre, and that
// yarn rides a second helix around the rope's axis, wound the opposite way — the
// opposing twists are what stop real rope unravelling.
//
// `close` is how far a height has been laid up: 0 loose and splayed, 1 closed
// into rope. The laying front is where it crosses over, and it climbs the card.
const ROPE_SPEED = 0.45          // the settings the rope was chosen at
const ROPE_TURNS = 1.6
const ROPE_WEIGHT = 1.3
const ROPE_CFG = { yarns: 3, fibres: 4, yarnR: 0.055, fibreR: 0.026, gauge: 0.0125,
                   openness: 3.2, fibreTwist: 2.1, drift: 0.14 }
// Darker than the card's green and in its family, so the rope reads as cut out
// of the background: far side toward the shadow, near side toward the lit.
const ROPE_SHADE = [2, 18, 10]
const ROPE_LIT = [10, 58, 32]
const ROPE_BANDS = 12            // depth steps; also the draw order

const ropeSmooth = (v) => v * v * (3 - 2 * v)
const ropeClamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v

function ropeFibre(cfg, yarn, fibre, h, t, close) {
  const open = 1 - close
  // Each yarn hangs out on its own wide lane while loose and is drawn into the
  // bundle as the front passes; the wobble gives the slack part some life.
  const wobble = Math.sin(h * 5.5 + yarn * 2.1 + t * 1.3) * 0.16 * open
  const yarnR = cfg.yarnR * (1 + open * cfg.openness) * (1 + wobble)
  const yarnA = (yarn / cfg.yarns) * TAU + h * ROPE_TURNS * TAU + t * cfg.drift
  const fibreR = cfg.fibreR * (1 + open * cfg.openness * 1.4)
  const fibreA = (fibre / cfg.fibres) * TAU - h * ROPE_TURNS * cfg.fibreTwist * TAU + t * cfg.drift
  return {
    x: Math.cos(yarnA) * yarnR + Math.cos(fibreA) * fibreR,
    z: Math.sin(yarnA) * yarnR + Math.sin(fibreA) * fibreR,
  }
}

function drawRope(ctx, W, H, t) {
  const cfg = ROPE_CFG
  const unit = Math.min(W, H)
  const cx = W / 2
  const bottom = H * 0.97, top = -H * 0.04     // runs off the top edge
  const span = bottom - top

  // Climbs, holds a beat fully laid, starts again.
  const u = (t % 6.0) / 6.0
  const frontY = bottom - ropeSmooth(ropeClamp(u / 0.8)) * span
  const band = span * 0.16                     // how abruptly it closes

  // Sampled per pixel rather than a fixed count, so a small card does not pay
  // for detail it cannot show. ~2px a segment is smooth under a round cap.
  const steps = Math.max(70, Math.min(160, Math.round(H / 2)))

  const n = cfg.yarns * cfg.fibres
  const prev = new Float32Array(n * 2)
  const reach = cfg.yarnR * (1 + cfg.openness) + cfg.fibreR
  ctx.lineCap = 'round'

  // Depth is quantised into bands, and every segment is appended to its band's
  // path. Because a band IS a depth, stroking them in order draws back to front
  // for free — no sort, and a handful of stroke calls instead of one per
  // segment. Strands still genuinely pass behind one another, which is what
  // stops the bundle reading flat.
  const paths = []
  for (let b = 0; b < ROPE_BANDS; b++) paths.push(new Path2D())

  for (let i = 0; i <= steps; i++) {
    const y = bottom - (i / steps) * span
    const h = (bottom - y) / span
    // Below the front it is closed, above it open, softened over `band` so the
    // rope forms rather than snaps shut.
    const close = ropeSmooth(ropeClamp((y - frontY) / band))

    for (let yarn = 0; yarn < cfg.yarns; yarn++) {
      for (let fibre = 0; fibre < cfg.fibres; fibre++) {
        const k = yarn * cfg.fibres + fibre
        const p = ropeFibre(cfg, yarn, fibre, h, t, close)
        const sx = cx + p.x * unit
        if (i > 0) {
          const d = ropeClamp(p.z / reach * 0.5 + 0.5)   // 0 far, 1 near
          const path = paths[Math.min(ROPE_BANDS - 1, (d * ROPE_BANDS) | 0)]
          path.moveTo(prev[k * 2], prev[k * 2 + 1])
          path.lineTo(sx, y)
        }
        prev[k * 2] = sx
        prev[k * 2 + 1] = y
      }
    }
  }

  for (let b = 0; b < ROPE_BANDS; b++) {
    const d = (b + 0.5) / ROPE_BANDS
    const m = 0.10 + d * 0.90
    ctx.strokeStyle = 'rgb(' + Math.round(ROPE_SHADE[0] + (ROPE_LIT[0] - ROPE_SHADE[0]) * m) + ',' +
                               Math.round(ROPE_SHADE[1] + (ROPE_LIT[1] - ROPE_SHADE[1]) * m) + ',' +
                               Math.round(ROPE_SHADE[2] + (ROPE_LIT[2] - ROPE_SHADE[2]) * m) + ')'
    ctx.lineWidth = ROPE_WEIGHT * unit * cfg.gauge * (0.62 + d * 0.66)
    ctx.stroke(paths[b])
  }
}

function mountRope(el) {
  const canvas = document.createElement('canvas')
  canvas.className = 'cardArt'
  el.insertBefore(canvas, el.firstChild)
  const ctx = canvas.getContext('2d')
  let clock = 0, last = performance.now(), onScreen = true

  if (window.IntersectionObserver) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0.05 }).observe(el)
  }
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (still) clock = 5.0                       // held fully laid

  const frame = (now) => {
    if (!canvas.isConnected) return            // the loop ends with the card
    requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    if (!onScreen) return
    if (!still) clock += dt * ROPE_SPEED

    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(r.width * dpr)) {
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    ctx.clearRect(0, 0, r.width, r.height)
    drawRope(ctx, r.width, r.height, clock)
  }
  requestAnimationFrame(frame)
}

// ── CBC: the gem folding into itself ─────────────────────────────────────────
// Measured off the mark: it is thirteen identical circles, one at the centre,
// eight on a lattice a circle-and-a-gutter out, four further out on the axes,
// each clipped to its own cell in a five-by-five grid. The outer radius comes to
// exactly 2.79 circles — which is also the ratio at which the whole mark nests
// inside its own centre circle. That is the trick the animation runs on.
//
// Nothing draws its own centre circle: the next copy down IS that circle. So the
// mark scales inward for ever, and the copy arriving from outside fades up as it
// comes, which leaves the cycle seamless and the shape at rest exactly the logo.
const GEM_SPEED = 0.22           // the setting it was chosen at
const GEM_INK = '#A80022'        // tonal: a shade deeper than the card's red
const GEM_GROUND = '#E4002B'

const GEM_G = 0.1450             // gutter, in circle radii
const GEM_A2 = 1 + GEM_G         // inner edge of the middle ring
const GEM_A3 = 2 + GEM_G         // outer edge of the middle ring
const GEM_A4 = 2 + 2 * GEM_G     // inner edge of the outer ring
const GEM_A5 = 2.5 + 2 * GEM_G   // outer radius of the mark
const GEM_K = GEM_A5             // nest ratio: mark : its own centre circle

const GEM_SHAPES = (() => {
  const band = (s, i, o) => s === 0 ? [-1, 1] : s > 0 ? [i, o] : [-o, -i]
  const out = [{ x: 0, y: 0, cell: [-1, 1, -1, 1] }]
  for (const [sx, sy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
    const [x0, x1] = band(sx, GEM_A2, GEM_A3), [y0, y1] = band(sy, GEM_A2, GEM_A3)
    out.push({ x: sx * GEM_A2, y: sy * GEM_A2, cell: [x0, x1, y0, y1] })
  }
  const D = 1.5 + 2 * GEM_G
  for (const [sx, sy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const [x0, x1] = band(sx, GEM_A4, GEM_A5), [y0, y1] = band(sy, GEM_A4, GEM_A5)
    out.push({ x: sx * D, y: sy * D, cell: [x0, x1, y0, y1] })
  }
  return out
})()

function drawGemZoom(ctx, W, H, t) {
  const ox = W / 2, oy = H / 2
  const u = ((t % 1) + 1) % 1
  ctx.fillStyle = GEM_GROUND
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = GEM_INK

  let R = (Math.min(W, H) * 0.44 / GEM_A5) * Math.pow(GEM_K, 1 - u)
  let alpha = u                                  // the one still arriving
  let last = R
  while (R > 0.35) {
    ctx.globalAlpha = alpha
    for (let i = 1; i < GEM_SHAPES.length; i++) {  // skip the centre: the child is it
      const sh = GEM_SHAPES[i]
      ctx.save()
      ctx.beginPath()
      ctx.rect(ox + sh.cell[0] * R, oy + sh.cell[2] * R,
               (sh.cell[1] - sh.cell[0]) * R, (sh.cell[3] - sh.cell[2]) * R)
      ctx.clip()
      ctx.beginPath()
      ctx.arc(ox + sh.x * R, oy + sh.y * R, R, 0, TAU)
      ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = 1
    alpha = 1
    last = R
    R /= GEM_K
  }
  ctx.beginPath(); ctx.arc(ox, oy, last, 0, TAU); ctx.fill()   // innermost keeps its centre
}

function mountGem(el) {
  const canvas = document.createElement('canvas')
  canvas.className = 'cardArt'
  el.insertBefore(canvas, el.firstChild)
  const ctx = canvas.getContext('2d')
  let clock = 0, last = performance.now(), onScreen = true

  if (window.IntersectionObserver) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0.05 }).observe(el)
  }
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const frame = (now) => {
    if (!canvas.isConnected) return              // the loop ends with the card
    requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    if (!onScreen) return
    if (!still) clock += dt * GEM_SPEED

    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(r.width * dpr)) {
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    drawGemZoom(ctx, r.width, r.height, clock)
  }
  requestAnimationFrame(frame)
}

// ── Dorthy Sotherby: a star opening out of nothing ───────────────────────────
// A five-point star opens from a speck at the centre and keeps growing until it
// runs off the card, with the next already coming up behind it.
//
// The growth is exponential, not linear, and that is what makes it loop: every
// star multiplies by the same ratio over a lap, so after one lap the whole
// ladder is identical with the rungs shifted by one. Nothing fades, nothing
// pops. The lap is two rungs rather than one because the fills alternate — at
// one rung a lap every star would swap colour at the seam.
const STAR_SPEED = 0.3           // the settings it was chosen at
const STAR_RATIO = 1.9           // how much bigger each star is than the last
const STAR_INK = '#AF5018'       // tonal: a shade deeper than the card's orange
const STAR_GROUND = '#F37021'
const STAR_INNER = 0.382         // inner/outer radius of a true five-point star

function starPath(ctx, cx, cy, R) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5
    const r = (i & 1) ? R * STAR_INNER : R
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
  }
  ctx.closePath()
}

function drawStar(ctx, W, H, t) {
  const cx = W / 2, cy = H / 2
  const maxR = Math.hypot(W, H) / 2 * 1.02
  const R0 = 0.35
  const u = ((t % 2) + 2) % 2
  const N = Math.ceil(Math.log(maxR / R0) / Math.log(STAR_RATIO))

  ctx.fillStyle = STAR_GROUND
  ctx.fillRect(0, 0, W, H)
  // Biggest first: each smaller star is laid over the one it grew out of.
  for (let n = N + 1; n >= 0; n--) {
    const R = R0 * Math.pow(STAR_RATIO, u + n)
    if (R > maxR * STAR_RATIO * 1.05) continue
    ctx.fillStyle = (n & 1) ? STAR_GROUND : STAR_INK
    starPath(ctx, cx, cy, R)
    ctx.fill()
  }
}

function mountStar(el) {
  const canvas = document.createElement('canvas')
  canvas.className = 'cardArt'
  el.insertBefore(canvas, el.firstChild)
  const ctx = canvas.getContext('2d')
  let clock = 0, last = performance.now(), onScreen = true

  if (window.IntersectionObserver) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0.05 }).observe(el)
  }
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (still) clock = 0.7                         // a good-looking rung to sit on

  const frame = (now) => {
    if (!canvas.isConnected) return              // the loop ends with the card
    requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    if (!onScreen) return
    if (!still) clock += dt * STAR_SPEED

    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(r.width * dpr)) {
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    drawStar(ctx, r.width, r.height, clock)
  }
  requestAnimationFrame(frame)
}
