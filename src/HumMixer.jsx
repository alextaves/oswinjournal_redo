import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

const SAMPLES = [
  { id: 'none',     label: '—',        url: null },
  { id: 'mixitin',  label: 'Mixitin',  url: '/audio/hum/mixitin.webm' },
  { id: 'jasman',   label: 'Jasman',   url: '/audio/hum/jasman.mp3' },
  { id: 'hummix',   label: 'Hum Mix',  url: '/audio/hum/hum-mix.webm' },
  { id: 'techno',   label: 'Techno',   url: '/audio/hum/techno.wav' },
  { id: 'detroit',  label: 'Detroit',  url: '/audio/hum/detroit.mp3' },
]

const INIT = () => ({ sample: 'none', volume: 75, pitch: 0, reverb: 30 })

export default function HumMixer({ audioPlaying }) {
  const [ui, setUi] = useState([INIT(), INIT(), INIT()])
  const [playing, setPlaying] = useState([false, false, false])
  const [loading, setLoading] = useState([false, false, false])
  const [recording, setRecording] = useState(false)

  const chRef = useRef(null)
  const masterRef = useRef(null)
  const recRef = useRef(null)
  const streamDestRef = useRef(null)

  useEffect(() => {
    const master = new Tone.Gain(1).toDestination()
    masterRef.current = master

    chRef.current = [0, 1, 2].map(() => {
      const vol = new Tone.Volume(-3)
      const pitch = new Tone.PitchShift(0)
      const rev = new Tone.Reverb({ decay: 4, wet: 0.3 })
      vol.connect(pitch)
      pitch.connect(rev)
      rev.connect(master)
      return { player: null, vol, pitch, rev }
    })

    return () => {
      chRef.current.forEach(ch => {
        if (ch.player) { try { ch.player.stop(); ch.player.dispose() } catch {} }
        ch.rev.dispose(); ch.pitch.dispose(); ch.vol.dispose()
      })
      master.dispose()
      if (streamDestRef.current) { try { Tone.getDestination().input.disconnect(streamDestRef.current) } catch {}; streamDestRef.current = null }
      if (recRef.current) { try { recRef.current.stop() } catch {}; recRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (!chRef.current) return
    ui.forEach((u, i) => {
      const ch = chRef.current[i]
      ch.vol.volume.value = u.volume === 0 ? -60 : Tone.gainToDb(u.volume / 100)
      ch.rev.wet.value = u.reverb / 100
    })
  }, [ui])

  const togglePlay = async (i) => {
    await Tone.start()
    const ch = chRef.current[i]
    const u = ui[i]

    if (playing[i]) {
      if (ch.player) { try { ch.player.stop(); ch.player.dispose() } catch {} ch.player = null }
      setPlaying(p => { const n = [...p]; n[i] = false; return n })
    } else {
      if (u.sample === 'none') return
      const sample = SAMPLES.find(s => s.id === u.sample)
      if (!sample?.url) return

      setLoading(l => { const n = [...l]; n[i] = true; return n })

      const player = new Tone.Player({
        url: sample.url,
        loop: true,
        onload: () => {
          if (chRef.current?.[i]?.player === player) {
            ch.pitch.pitch = u.pitch
            player.start()
            setLoading(l => { const n = [...l]; n[i] = false; return n })
            setPlaying(p => { const n = [...p]; n[i] = true; return n })
          }
        },
        onerror: (e) => {
          console.warn('sample load error', e)
          setLoading(l => { const n = [...l]; n[i] = false; return n })
        },
      })
      player.connect(ch.vol)
      ch.player = player
    }
  }

  const changeSample = (i, sampleId) => {
    const ch = chRef.current?.[i]
    if (ch?.player) { try { ch.player.stop(); ch.player.dispose() } catch {} ch.player = null }
    setPlaying(p => { const n = [...p]; n[i] = false; return n })
    setLoading(l => { const n = [...l]; n[i] = false; return n })
    setUi(prev => prev.map((u, j) => j === i ? { ...u, sample: sampleId } : u))
  }

  const changePitch = (i, pitch) => {
    setUi(prev => prev.map((u, j) => j === i ? { ...u, pitch } : u))
    const ch = chRef.current?.[i]
    if (ch?.pitch) ch.pitch.pitch = pitch
  }

  const set = (i, key, value) => setUi(prev => prev.map((u, j) => j === i ? { ...u, [key]: value } : u))

  const toggleRecord = async () => {
    if (recording) {
      if (recRef.current) recRef.current.stop()
      if (streamDestRef.current) {
        try { Tone.getDestination().input.disconnect(streamDestRef.current) } catch {}
        streamDestRef.current = null
      }
      recRef.current = null
      setRecording(false)
    } else {
      await Tone.start()
      const ctx = Tone.getContext().rawContext
      const streamDest = ctx.createMediaStreamDestination()
      Tone.getDestination().input.connect(streamDest)
      streamDestRef.current = streamDest

      const chunks = []
      const mr = new MediaRecorder(streamDest.stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'hum-mix.webm'
        document.body.appendChild(a); a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      mr.start()
      recRef.current = mr
      setRecording(true)
    }
  }

  return (
    <>
      <style>{`
        @keyframes hum-blink{0%,100%{opacity:1}50%{opacity:0.15}}
        .hum-fader {
          writing-mode: vertical-lr;
          direction: rtl;
          width: 28px;
          height: 110px;
          cursor: pointer;
          accent-color: rgba(0,55,193,0.9);
          background: transparent;
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0, background: 'transparent',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '28px 16px', fontFamily: SANS, overflowY: 'auto',
      }}>
        <p style={{ margin: '0 0 24px', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,55,193,0.35)' }}>
          Mix
        </p>

        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 620, marginBottom: 24 }}>
          {ui.map((u, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 0,
              background: playing[i] ? 'rgba(0,55,193,0.1)' : 'rgba(199,207,223,0.45)',
              border: `1px solid ${playing[i] ? 'rgba(0,55,193,0.4)' : 'rgba(100,131,208,0.3)'}`,
              borderRadius: 6, padding: '16px 11px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              backdropFilter: 'blur(2px)',
              transition: 'background 0.4s, border-color 0.4s',
            }}>
              <p style={{ margin: 0, fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(0,55,193,0.45)', alignSelf: 'stretch', textAlign: 'center' }}>
                Ch {i + 1}
              </p>

              <select
                value={u.sample}
                onChange={e => changeSample(i, e.target.value)}
                style={{
                  background: 'rgba(199,207,223,0.6)', border: '1px solid rgba(100,131,208,0.35)', borderRadius: 3,
                  color: u.sample === 'none' ? 'rgba(0,55,193,0.3)' : 'rgba(0,55,193,0.8)',
                  fontFamily: SANS, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '5px 6px', width: '100%', cursor: 'pointer', outline: 'none',
                }}
              >
                {SAMPLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                <VerticalSlider label="Vol" value={u.volume} min={0} max={100} onChange={v => set(i, 'volume', v)} />
                <VerticalSlider
                  label={`${u.pitch > 0 ? '+' : ''}${u.pitch}`}
                  value={u.pitch} min={-12} max={12}
                  onChange={v => changePitch(i, v)}
                  sublabel="Pitch"
                />
                <VerticalSlider label="Rev" value={u.reverb} min={0} max={100} onChange={v => set(i, 'reverb', v)} />
              </div>

              <button
                onClick={() => togglePlay(i)}
                disabled={u.sample === 'none' || loading[i]}
                style={{
                  padding: '7px 0', borderRadius: 3, width: '100%',
                  cursor: (u.sample === 'none' || loading[i]) ? 'not-allowed' : 'pointer',
                  background: playing[i] ? 'rgba(0,55,193,0.15)' : 'rgba(133,156,213,0.15)',
                  border: `1px solid ${playing[i] ? 'rgba(0,55,193,0.5)' : 'rgba(100,131,208,0.3)'}`,
                  color: playing[i] ? 'rgba(0,55,193,1)' : 'rgba(0,55,193,0.5)',
                  fontFamily: SANS, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                  opacity: (u.sample === 'none' || loading[i]) ? 0.3 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading[i] ? '… loading' : playing[i] ? '■  stop' : '▶  play'}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={toggleRecord}
          style={{
            padding: '9px 22px', borderRadius: 3, cursor: 'pointer',
            background: recording ? 'rgba(0,55,193,0.12)' : 'rgba(199,207,223,0.4)',
            border: `1px solid ${recording ? 'rgba(0,55,193,0.45)' : 'rgba(100,131,208,0.3)'}`,
            color: recording ? 'rgba(0,55,193,0.9)' : 'rgba(0,55,193,0.4)',
            fontFamily: SANS, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            backdropFilter: 'blur(2px)',
          }}
        >
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: recording ? 'rgba(0,55,193,0.9)' : 'rgba(0,55,193,0.4)',
            animation: recording ? 'hum-blink 1s ease-in-out infinite' : 'none',
          }} />
          {recording ? 'recording — click to save' : 'record mix'}
        </button>
      </div>
    </>
  )
}

function VerticalSlider({ label, value, min, max, onChange, sublabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,55,193,0.55)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        {label}
      </span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="hum-fader"
      />
      <span style={{ fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,55,193,0.35)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        {sublabel ?? ''}
      </span>
    </div>
  )
}
