import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

const BASE_GREY = {
  C4: 'rgba(232, 232, 228, 0.28)',
  D4: 'rgba(195, 195, 190, 0.33)',
  E4: 'rgba(155, 155, 150, 0.38)',
  F4: 'rgba(115, 115, 110, 0.41)',
  G4: 'rgba(75,  75,  72,  0.46)',
  A4: 'rgba(42,  42,  40,  0.53)',
  B4: 'rgba(18,  18,  16,  0.60)',
  C5: 'rgba(4,   4,   3,   0.69)',
}

const BASE_BLUE = {
  C4: 'rgba(232, 232, 228, 0.28)',
  D4: 'rgba(199, 207, 223, 0.34)',
  E4: 'rgba(166, 181, 218, 0.40)',
  F4: 'rgba(133, 156, 213, 0.46)',
  G4: 'rgba(100, 131, 208, 0.51)',
  A4: 'rgba(66,  106, 203, 0.57)',
  B4: 'rgba(33,  80,  198, 0.63)',
  C5: 'rgba(0,   55,  193, 0.69)',
}

const BLOOM_COLOR = 'rgba(255, 255, 240, 0.55)'
const BLOOM_HOVER = 'rgba(255, 255, 240, 0.35)'

const SAMPLES = {
  A3: 'A3.mp3',
  C4: 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4: 'A4.mp3',
  C5: 'C5.mp3',
}

const NOTE_TO_BAR = {
  'Db4': 'C4', 'C#4': 'C4',
  'Eb4': 'E4', 'D#4': 'E4',
  'Gb4': 'G4', 'F#4': 'G4',
  'Ab4': 'A4', 'G#4': 'A4',
  'Bb4': 'B4', 'A#4': 'B4',
  'Db5': 'C5', 'C#5': 'C5',
}


const MOBILE_NOTES = new Set(['F4', 'G4', 'A4', 'B4', 'C5'])

export default function PianoBarsArt({ audioPlaying, windowWidth, barImages, background, barColors, onSwipeLeft, onSwipeRight }) {
  const colors = barColors ?? BASE_GREY
  const isMobile = windowWidth <= 820
  const barRefs = useRef({})
  const imageRefs = useRef({})
  const noiseCanvasRefs = useRef({})
  const samplerRef = useRef(null)
  const touchSamplerRef = useRef(null)
  const started = useRef(false)
  const activeTouches = useRef({})
  const swipeTrack = useRef({})

  const showStrip = useCallback((note, duration = 80) => {
    const el = imageRefs.current[note]
    if (!el) return
    el.style.transition = `opacity ${duration}ms ease-in`
    el.style.opacity = '1'
  }, [])

  const hideStrip = useCallback((note, duration = 2800) => {
    const el = imageRefs.current[note]
    if (!el) return
    el.style.transition = `opacity ${duration}ms ease-out`
    el.style.opacity = '0'
  }, [])

  const glowBar = useCallback((note) => {
    const barNote = NOTE_TO_BAR[note] ?? note
    const el = barRefs.current[barNote]
    if (!el) return
    el.style.transition = 'background-color 60ms ease-in'
    el.style.backgroundColor = BLOOM_COLOR
    showStrip(barNote, 60)
    setTimeout(() => {
      el.style.transition = 'background-color 2800ms ease-out'
      el.style.backgroundColor = colors[barNote] ?? ''
      hideStrip(barNote, 2800)
    }, 380)
  }, [showStrip, hideStrip])

  useEffect(() => {
    let disposed = false
    const parts = []

    // Shared reverb — the main source of warmth
    const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination()

    // Ch1: Op.19 Complete — Vol -2, Pitch -1 semitone (via detune), subtle dist
    const dist1 = new Tone.Distortion({ distortion: 0.3, wet: 0.35 }).connect(reverb)
    const vol1  = new Tone.Volume(-2).connect(dist1)

    // Ch2: Op.19 No.2 — Vol -11, Pitch -6 semitones (via detune), no dist
    const vol2  = new Tone.Volume(-11).connect(reverb)

    // Touch sampler — clean path, no distortion, quiet
    const volTouch = new Tone.Volume(-6).connect(reverb)
    const touchSampler = new Tone.Sampler(SAMPLES, {
      baseUrl: '/audio/salamander/',
      onload: () => { touchSamplerRef.current = touchSampler },
    }).connect(volTouch)

    let s1Ready = false, s2Ready = false

    function buildParts(midi, sampler) {
      midi.tracks.forEach(track => {
        if (!track.notes.length) return
        const events = track.notes.map(n => ({ time: n.time, name: n.name, duration: n.duration, velocity: n.velocity }))
        const part = new Tone.Part((time, note) => {
          sampler.triggerAttackRelease(note.name, note.duration, time, note.velocity)
          const delay = Math.max(0, (time - sampler.context.currentTime) * 1000)
          setTimeout(() => glowBar(note.name), delay)
        }, events)
        part.loop = true
        part.loopEnd = midi.duration
        part.start(0)
        parts.push(part)
      })
    }

    function trySetup() {
      if (!s1Ready || !s2Ready || disposed) return
      Promise.all([
        Midi.fromUrl('/midi/op19.mid'),
        Midi.fromUrl('/midi/op19no2.mid'),
      ]).then(([midi1, midi2]) => {
        if (disposed) return
        buildParts(midi1, sampler1)
        buildParts(midi2, sampler2)
        samplerRef.current = sampler1

      }).catch(console.error)
    }

    // detune in cents: -1 semitone = -100c, -6 semitones = -600c
    const sampler1 = new Tone.Sampler(SAMPLES, {
      baseUrl: '/audio/salamander/',
      onload: () => { s1Ready = true; trySetup() },
    }).connect(vol1)
    sampler1.detune = -100

    const sampler2 = new Tone.Sampler(SAMPLES, {
      baseUrl: '/audio/salamander/',
      onload: () => { s2Ready = true; trySetup() },
    }).connect(vol2)
    sampler2.detune = -600

    return () => {
      disposed = true
      Tone.Transport.stop()
      parts.forEach(p => p.dispose())
      sampler1.dispose(); sampler2.dispose(); touchSampler.dispose()
      vol1.dispose(); dist1.dispose()
      vol2.dispose(); volTouch.dispose()
      reverb.dispose()
      samplerRef.current = null
      touchSamplerRef.current = null
    }
  }, [glowBar])

  useEffect(() => {
    let rafId
    const draw = () => {
      Object.values(noiseCanvasRefs.current).forEach(canvas => {
        if (!canvas) return
        const parent = canvas.parentElement
        if (!parent) return
        if (canvas.width !== Math.ceil(parent.offsetWidth / 2)) canvas.width = Math.ceil(parent.offsetWidth / 2)
        if (canvas.height !== Math.ceil(parent.offsetHeight / 2)) canvas.height = Math.ceil(parent.offsetHeight / 2)
        if (!canvas.width || !canvas.height) return
        const ctx = canvas.getContext('2d')
        const img = ctx.createImageData(canvas.width, canvas.height)
        const d = img.data
        for (let i = 0; i < d.length; i += 4) {
          const v = Math.random() * 255 | 0
          d[i] = d[i + 1] = d[i + 2] = v
          d[i + 3] = 15
        }
        ctx.putImageData(img, 0, 0)
      })
      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Start/stop Transport and mute based on audioPlaying
  useEffect(() => {
    if (audioPlaying) {
      Tone.start().then(() => {
        Tone.getDestination().mute = false
        if (Tone.Transport.state !== 'started') Tone.Transport.start()
        started.current = true
      })
    } else {
      Tone.getDestination().mute = true
    }
  }, [audioPlaying])

  const playNote = useCallback(async (note) => {
    if (!audioPlaying) return
    touchSamplerRef.current?.triggerAttackRelease(note, '2n', undefined, 0.5)
  }, [audioPlaying])

  const handleEnter = useCallback((e, note) => {
    if (isMobile && !MOBILE_NOTES.has(note)) return
    const el = e.currentTarget
    el.style.transition = 'background-color 80ms ease-in'
    el.style.backgroundColor = BLOOM_HOVER
    showStrip(note, 80)
    playNote(note)
  }, [isMobile, playNote, showStrip])

  const handleLeave = useCallback((e, note) => {
    const el = e.currentTarget
    el.style.transition = 'background-color 2800ms ease-out'
    el.style.backgroundColor = colors[note] ?? ''
    hideStrip(note, 2800)
  }, [hideStrip])

  const activateBar = useCallback((note) => {
    if (isMobile && !MOBILE_NOTES.has(note)) return
    const el = barRefs.current[note]
    if (!el) return
    el.style.transition = 'background-color 80ms ease-in'
    el.style.backgroundColor = BLOOM_HOVER
    showStrip(note, 80)
    playNote(note)
  }, [isMobile, playNote, showStrip])

  const deactivateBar = useCallback((note) => {
    const el = barRefs.current[note]
    if (!el) return
    el.style.transition = 'background-color 2800ms ease-out'
    el.style.backgroundColor = colors[note] ?? ''
    hideStrip(note, 2800)
  }, [hideStrip])

  const getNoteAtPoint = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y)
    return Object.entries(barRefs.current).find(([, ref]) => ref === el || ref?.contains(el))?.[0] ?? null
  }, [])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(touch => {
      swipeTrack.current[touch.identifier] = { startX: touch.clientX, startY: touch.clientY, isSwipe: false }
      const note = getNoteAtPoint(touch.clientX, touch.clientY)
      if (note) {
        activeTouches.current[touch.identifier] = note
        activateBar(note)
      }
    })
  }, [activateBar, getNoteAtPoint])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(touch => {
      const track = swipeTrack.current[touch.identifier]
      if (!track) return
      const dx = touch.clientX - track.startX
      const dy = touch.clientY - track.startY
      // Commit to swipe if predominantly horizontal and past threshold
      if (!track.isSwipe && Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        track.isSwipe = true
        track.swipeDir = dx > 0 ? 'right' : 'left'
        // Release any bar that was activated
        const note = activeTouches.current[touch.identifier]
        if (note) { deactivateBar(note); delete activeTouches.current[touch.identifier] }
      }
      if (!track.isSwipe) {
        const note = getNoteAtPoint(touch.clientX, touch.clientY)
        const prev = activeTouches.current[touch.identifier]
        if (note && note !== prev) {
          if (prev) deactivateBar(prev)
          activeTouches.current[touch.identifier] = note
          activateBar(note)
        }
      }
    })
  }, [activateBar, deactivateBar, getNoteAtPoint])

  const handleTouchEnd = useCallback((e) => {
    Array.from(e.changedTouches).forEach(touch => {
      const track = swipeTrack.current[touch.identifier]
      if (track?.isSwipe) {
        if (track.swipeDir === 'left' && onSwipeLeft) onSwipeLeft()
        if (track.swipeDir === 'right' && onSwipeRight) onSwipeRight()
      }
      const note = activeTouches.current[touch.identifier]
      if (note) { deactivateBar(note); delete activeTouches.current[touch.identifier] }
      delete swipeTrack.current[touch.identifier]
    })
  }, [deactivateBar, onSwipeLeft, onSwipeRight])

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: background ?? '#F5DD33',
        display: 'flex', flexDirection: 'column',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {NOTES.map((note, i) => {
        const imgSrc = barImages == null
          ? '/images/giftshop-yellow.jpg'
          : barImages.length > 0 ? barImages[i % barImages.length] : null;
        return (
          <div
            key={note}
            ref={(el) => { barRefs.current[note] = el }}
            style={{
              flex: 1,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              userSelect: 'none',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: colors[note],
            }}
            onMouseEnter={(e) => handleEnter(e, note)}
            onMouseLeave={(e) => handleLeave(e, note)}
          >
            {imgSrc && <div
              ref={(el) => { imageRefs.current[note] = el }}
              style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${imgSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat',
                opacity: 0,
                filter: 'blur(0.75px)',
                pointerEvents: 'none',
              }}
            >
              <canvas
                ref={(el) => { noiseCanvasRefs.current[note] = el }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              />
            </div>}
          </div>
        );
      })}
    </div>
  )
}
