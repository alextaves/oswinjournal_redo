import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'

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

// OP19 No.4 + Steps combined melody (inline)
const MELODY = {
  bpm: 140,
  timeSignature: 4,
  loopEnd: '14:0',
  notes: [
    ['0:0',   { note: 'B4',  dur: '8n'  }],
    ['0:0:2', { note: 'G4',  dur: '8n'  }],
    ['0:1',   { note: 'Ab4', dur: '4n'  }],
    ['0:2',   { note: 'F4',  dur: '4n'  }],
    ['0:3',   { note: 'Eb4', dur: '4n'  }],
    ['1:0',   { note: 'Db4', dur: '2n'  }],
    ['1:2',   { note: 'C4',  dur: '8n'  }],
    ['1:2:2', { note: 'B4',  dur: '8n'  }],
    ['1:3',   { note: 'Ab4', dur: '4n'  }],
    ['2:0',   { note: 'Bb4', dur: '8n'  }],
    ['2:0:2', { note: 'F4',  dur: '8n'  }],
    ['2:1',   { note: 'G4',  dur: '4n'  }],
    ['2:2',   { note: 'Eb4', dur: '4n'  }],
    ['2:3',   { note: 'Db4', dur: '4n'  }],
    ['3:0',   { note: 'C4',  dur: '2n.' }],
    ['4:0',   { note: 'Ab4', dur: '8n'  }],
    ['4:0:2', { note: 'Bb4', dur: '8n'  }],
    ['4:1',   { note: 'B4',  dur: '4n'  }],
    ['4:2',   { note: 'G4',  dur: '4n'  }],
    ['4:3',   { note: 'F4',  dur: '4n'  }],
    ['5:0',   { note: 'Eb4', dur: '2n'  }],
    ['5:2',   { note: 'Db4', dur: '4n'  }],
    ['5:3',   { note: 'C4',  dur: '4n'  }],
    // Steps section (bars 6–13)
    ['6:0:0', { note: 'C4',  dur: '16n' }],
    ['6:0:1', { note: 'Db4', dur: '16n' }],
    ['6:0:2', { note: 'Eb4', dur: '16n' }],
    ['6:0:3', { note: 'E4',  dur: '16n' }],
    ['6:1:1', { note: 'Gb4', dur: '16n' }],
    ['6:1:2', { note: 'G4',  dur: '8n'  }],
    ['6:2:0', { note: 'Bb4', dur: '16n' }],
    ['6:2:1', { note: 'B4',  dur: '16n' }],
    ['6:3:2', { note: 'F4',  dur: '16n' }],
    ['6:3:3', { note: 'E4',  dur: '16n' }],
    ['7:0:0', { note: 'C4',  dur: '8n'  }],
    ['7:0:2', { note: 'Gb4', dur: '16n' }],
    ['7:0:3', { note: 'G4',  dur: '16n' }],
    ['7:1:0', { note: 'Ab4', dur: '16n' }],
    ['7:1:1', { note: 'A4',  dur: '16n' }],
    ['7:1:2', { note: 'Bb4', dur: '8n'  }],
    ['8:2:0', { note: 'B4',  dur: '16n' }],
    ['8:2:1', { note: 'Bb4', dur: '16n' }],
    ['8:2:2', { note: 'A4',  dur: '16n' }],
    ['8:2:3', { note: 'Ab4', dur: '16n' }],
    ['8:3:0', { note: 'G4',  dur: '16n' }],
    ['8:3:1', { note: 'Gb4', dur: '16n' }],
    ['8:3:2', { note: 'E4',  dur: '16n' }],
    ['8:3:3', { note: 'Eb4', dur: '16n' }],
    ['9:0:0', { note: 'D4',  dur: '16n' }],
    ['9:0:2', { note: 'B4',  dur: '16n' }],
    ['9:1:0', { note: 'Db4', dur: '16n' }],
    ['9:1:2', { note: 'Bb4', dur: '16n' }],
    ['9:2:0', { note: 'C4',  dur: '16n' }],
    ['9:2:1', { note: 'F4',  dur: '16n' }],
    ['9:2:2', { note: 'C4',  dur: '16n' }],
    ['9:2:3', { note: 'F4',  dur: '16n' }],
    ['9:3:0', { note: 'Ab4', dur: '8n'  }],
    ['10:0',  { note: 'Gb4', dur: '8n'  }],
    ['10:1:2',{ note: 'C4',  dur: '16n' }],
    ['10:2',  { note: 'E4',  dur: '8n'  }],
    ['10:3:1',{ note: 'Bb4', dur: '16n' }],
    ['10:3:3',{ note: 'F4',  dur: '16n' }],
    ['11:0:0',{ note: 'C4',  dur: '16n' }],
    ['11:0:1',{ note: 'Db4', dur: '16n' }],
    ['11:0:2',{ note: 'D4',  dur: '16n' }],
    ['11:0:3',{ note: 'Eb4', dur: '16n' }],
    ['11:1:0',{ note: 'E4',  dur: '16n' }],
    ['11:1:1',{ note: 'F4',  dur: '16n' }],
    ['11:1:2',{ note: 'Gb4', dur: '16n' }],
    ['11:1:3',{ note: 'G4',  dur: '16n' }],
    ['11:2:0',{ note: 'Ab4', dur: '16n' }],
    ['11:2:1',{ note: 'A4',  dur: '16n' }],
    ['11:2:2',{ note: 'Bb4', dur: '16n' }],
    ['11:2:3',{ note: 'B4',  dur: '16n' }],
    ['11:3:0',{ note: 'C5',  dur: '8n'  }],
    ['12:0',  { note: 'B4',  dur: '8n'  }],
    ['12:0:2',{ note: 'Ab4', dur: '16n' }],
    ['12:1',  { note: 'F4',  dur: '16n' }],
    ['12:1:2',{ note: 'D4',  dur: '8n'  }],
    ['12:2:1',{ note: 'Bb4', dur: '16n' }],
    ['12:3',  { note: 'G4',  dur: '8n'  }],
    ['12:3:2',{ note: 'C4',  dur: '8n'  }],
    ['13:3:0',{ note: 'G4',  dur: '16n' }],
    ['13:3:1',{ note: 'C4',  dur: '16n' }],
    ['13:3:2',{ note: 'E4',  dur: '16n' }],
    ['13:3:3',{ note: 'Bb4', dur: '16n' }],
  ],
}

const MOBILE_NOTES = new Set(['F4', 'G4', 'A4', 'B4', 'C5'])

export default function PianoBarsArt({ audioPlaying, windowWidth }) {
  const isMobile = windowWidth <= 820
  const barRefs = useRef({})
  const imageRefs = useRef({})
  const samplerRef = useRef(null)
  const started = useRef(false)
  const activeTouches = useRef({})

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
      el.style.backgroundColor = BASE_GREY[barNote] ?? ''
      hideStrip(barNote, 2800)
    }, 380)
  }, [showStrip, hideStrip])

  useEffect(() => {
    let disposed = false
    let sampler
    let part

    Tone.Transport.bpm.value = MELODY.bpm
    Tone.Transport.timeSignature = MELODY.timeSignature

    sampler = new Tone.Sampler(SAMPLES, {
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => {
        if (disposed) return
        samplerRef.current = sampler
        part = new Tone.Part((time, val) => {
          sampler.triggerAttackRelease(val.note, val.dur, time)
          const delay = Math.max(0, (time - sampler.context.currentTime) * 1000)
          setTimeout(() => glowBar(val.note), delay)
        }, MELODY.notes)
        part.loop = true
        part.loopEnd = MELODY.loopEnd
        part.start(0)
      },
    }).toDestination()

    return () => {
      disposed = true
      Tone.Transport.stop()
      part?.dispose()
      sampler?.dispose()
      samplerRef.current = null
    }
  }, [glowBar])

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
    samplerRef.current?.triggerAttackRelease(note, '2n')
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
    el.style.backgroundColor = BASE_GREY[note] ?? ''
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
    el.style.backgroundColor = BASE_GREY[note] ?? ''
    hideStrip(note, 2800)
  }, [hideStrip])

  const getNoteAtPoint = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y)
    return Object.entries(barRefs.current).find(([, ref]) => ref === el || ref?.contains(el))?.[0] ?? null
  }, [])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(touch => {
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
      const note = getNoteAtPoint(touch.clientX, touch.clientY)
      const prev = activeTouches.current[touch.identifier]
      if (note && note !== prev) {
        if (prev) deactivateBar(prev)
        activeTouches.current[touch.identifier] = note
        activateBar(note)
      }
    })
  }, [activateBar, deactivateBar, getNoteAtPoint])

  const handleTouchEnd = useCallback((e) => {
    Array.from(e.changedTouches).forEach(touch => {
      const note = activeTouches.current[touch.identifier]
      if (note) {
        deactivateBar(note)
        delete activeTouches.current[touch.identifier]
      }
    })
  }, [deactivateBar])

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: '#F5DD33',
        display: 'flex', flexDirection: 'column',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {NOTES.map((note) => (
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
            backgroundColor: BASE_GREY[note],
          }}
          onMouseEnter={(e) => handleEnter(e, note)}
          onMouseLeave={(e) => handleLeave(e, note)}
        >
          <div
            ref={(el) => { imageRefs.current[note] = el }}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/images/giftshop-yellow.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundAttachment: 'fixed',
              backgroundRepeat: 'no-repeat',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      ))}
    </div>
  )
}
