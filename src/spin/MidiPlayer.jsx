import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

function pcmToWav(left, right, sampleRate) {
  let peak = 0
  for (let i = 0; i < left.length; i++) {
    if (Math.abs(left[i]) > peak) peak = Math.abs(left[i])
    if (Math.abs(right[i]) > peak) peak = Math.abs(right[i])
  }
  const gain = peak > 0 ? (0.944 / peak) : 1
  const numCh = 2, bitsPerSample = 16
  const dataLen = left.length * numCh * 2
  const buf = new ArrayBuffer(44 + dataLen)
  const v = new DataView(buf)
  const str = (off, s) => [...s].forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)))
  str(0, 'RIFF'); v.setUint32(4, 36 + dataLen, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, numCh, true); v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * numCh * 2, true); v.setUint16(32, numCh * 2, true)
  v.setUint16(34, bitsPerSample, true); str(36, 'data'); v.setUint32(40, dataLen, true)
  let off = 44
  for (let i = 0; i < left.length; i++) {
    v.setInt16(off, Math.max(-32768, Math.min(32767, left[i] * gain * 32768)), true); off += 2
    v.setInt16(off, Math.max(-32768, Math.min(32767, right[i] * gain * 32768)), true); off += 2
  }
  return new Blob([buf], { type: 'audio/wav' })
}

const PRESETS = [
  { name: 'Triangle',   make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 }, volume: -12 }) },
  { name: 'Sine',       make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 1.2 }, volume: -10 }) },
  { name: 'Square',     make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.5 }, volume: -18 }) },
  { name: 'Sawtooth',   make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.6 }, volume: -18 }) },
  { name: 'FM Bell',    make: () => new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.01, modulationIndex: 14, envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1.5 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 }, volume: -14 }) },
  { name: 'AM Organ',   make: () => new Tone.PolySynth(Tone.AMSynth, { harmonicity: 2, envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.8 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }, volume: -14 }) },
  { name: 'Soft Piano', make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 1.2 }, volume: -10 }) },
  { name: 'Pad',        make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 1.2, decay: 0.5, sustain: 0.8, release: 2.0 }, volume: -10 }) },
  { name: 'Pluck',      make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 }, volume: -10 }) },
  { name: 'Strings',    make: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.4, decay: 0.1, sustain: 0.8, release: 1.5 }, volume: -16 }) },
]

const TRACKS = [
  { label: 'Ruth I',  url: '/ruth.mid'  },
  { label: 'Ruth II', url: '/ruth2.mid' },
]

const defaultTrackState = () => ({ active: true, presetIdx: 0, pitch: 0, reverb: 0.3, stutter: 0, volume: 0 })

function scheduleMidi(midi, synth, chain, pitch) {
  midi.tracks.forEach(track => {
    track.notes.forEach(note => {
      if (note.duration <= 0) return
      Tone.Transport.schedule(time => {
        synth.triggerAttackRelease(
          Tone.Frequency(note.name).transpose(pitch).toNote(),
          note.duration, time, note.velocity
        )
      }, note.time)
    })
  })
}

export default function MidiPlayer() {
  const [loaded, setLoaded] = useState([false, false])
  const [playing, setPlaying] = useState([false, false])
  const [recording, setRecording] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [tracks, setTracks] = useState([defaultTrackState(), defaultTrackState()])
  const [downloadUrl, setDownloadUrl] = useState(null)
  const midisRef = useRef([null, null])
  const synthsRef = useRef([[], []])
  const recorderRef = useRef(null)

  useEffect(() => {
    TRACKS.forEach(({ url }, i) => {
      Midi.fromUrl(url).then(midi => {
        midisRef.current[i] = midi
        setLoaded(prev => { const n = [...prev]; n[i] = true; return n })
      })
    })
    return () => stopAll()
  }, [])

  function stopTrack(i) {
    synthsRef.current[i].forEach(s => { try { s.vol?.dispose(); s.rev?.dispose(); s.synth?.dispose() } catch {} })
    synthsRef.current[i] = []
    setPlaying(prev => { const n = [...prev]; n[i] = false; return n })
    // stop transport only if both tracks stopped
    const otherPlaying = synthsRef.current[1 - i].length > 0
    if (!otherPlaying) { Tone.Transport.stop(); Tone.Transport.cancel() }
  }

  async function startTrack(i, t = tracks[i]) {
    await Tone.start()
    // clear existing nodes for this track
    synthsRef.current[i].forEach(s => { try { s.vol?.dispose(); s.rev?.dispose(); s.synth?.dispose() } catch {} })
    synthsRef.current[i] = []

    const midi = midisRef.current[i]
    if (!midi) return

    // if transport not running, reset and start it
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.cancel()
      Tone.Transport.bpm.value = midi.header.tempos[0]?.bpm ?? 120
      Tone.Transport.start()
    }

    const vol = new Tone.Volume(t.volume).toDestination()
    const rev = new Tone.Reverb({ decay: 4, wet: t.reverb }).connect(vol)
    let chain = rev
    if (t.stutter > 0) {
      const trem = new Tone.Tremolo({ frequency: t.stutter, depth: 0.85, type: 'sine' }).connect(rev).start()
      synthsRef.current[i].push({ synth: trem, rev, vol })
      chain = trem
    } else {
      synthsRef.current[i].push({ synth: null, rev, vol })
    }

    midi.tracks.forEach(track => {
      if (!track.notes.length) return
      const synth = PRESETS[t.presetIdx].make()
      synth.connect(chain)
      synthsRef.current[i].push({ synth, rev: null })
      scheduleMidi({ tracks: [track] }, synth, chain, t.pitch)
    })

    setPlaying(prev => { const n = [...prev]; n[i] = true; return n })
  }

  async function startBoth() {
    await Tone.start()
    synthsRef.current.forEach((group, i) => {
      group.forEach(s => { try { s.vol?.dispose(); s.rev?.dispose(); s.synth?.dispose() } catch {} })
      synthsRef.current[i] = []
    })
    Tone.Transport.cancel()
    Tone.Transport.bpm.value = midisRef.current[0]?.header.tempos[0]?.bpm ?? 120
    Tone.Transport.start()
    await Promise.all([startTrack(0), startTrack(1)])
  }

  function stopAll() {
    synthsRef.current.forEach((group, i) => {
      group.forEach(s => { try { s.vol?.dispose(); s.rev?.dispose(); s.synth?.dispose() } catch {} })
      synthsRef.current[i] = []
    })
    Tone.Transport.stop()
    Tone.Transport.cancel()
    setPlaying([false, false])
  }

  async function toggleRecord() {
    if (recording) {
      recorderRef.current?.stop()
      recorderRef.current = null
    } else {
      await Tone.start()
      const ctx = Tone.getContext().rawContext
      const streamDest = ctx.createMediaStreamDestination()
      Tone.getDestination().input.connect(streamDest)
      const chunks = []
      const mr = new MediaRecorder(streamDest.stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      mr.onstop = async () => {
        try { Tone.getDestination().input.disconnect(streamDest) } catch {}
        stopPlaying()
        setRecording(false)
        const blob = new Blob(chunks, { type: mr.mimeType })
        try {
          const ab = await blob.arrayBuffer()
          const decodeCtx = new AudioContext()
          const audioBuf = await new Promise((res, rej) => decodeCtx.decodeAudioData(ab, res, rej))
          decodeCtx.close()
          const left = audioBuf.getChannelData(0)
          const right = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : audioBuf.getChannelData(0)
          const wav = pcmToWav(left, right, audioBuf.sampleRate)
          const url = URL.createObjectURL(wav)
          setDownloadUrl(url)
          const a = document.createElement('a')
          a.href = url; a.download = 'ruth.wav'
          document.body.appendChild(a); a.click()
          setTimeout(() => document.body.removeChild(a), 1000)
        } catch (err) { console.error('WAV failed:', err) }
      }
      mr.start(100)
      recorderRef.current = mr
      setRecording(true)
      await startBoth()
    }
  }

  const setTrack = (i, key, val) => {
    setTracks(prev => { const n = prev.map(t => ({ ...t })); n[i][key] = val; return n })
  }

  const allLoaded = loaded.every(Boolean)
  const dim = 'rgba(255,255,255,0.25)'
  const bright = 'rgba(255,255,255,0.85)'
  const mid = 'rgba(255,255,255,0.5)'
  const disabled = 'rgba(255,255,255,0.12)'
  const btnStyle = (active, off) => ({
    fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
    color: off ? disabled : active ? bright : mid,
    background: 'none', border: 'none', cursor: off ? 'default' : 'pointer', padding: 0,
  })

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {downloadUrl && (
        <a href={downloadUrl} download="ruth.wav" style={{ position: 'fixed', top: 30, left: 48, fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: mid, textDecoration: 'none' }}>
          ↓ download ruth.wav
        </a>
      )}

      {/* Two track columns */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {TRACKS.map(({ label }, i) => {
          const t = tracks[i]
          return (
            <div key={i} style={{ display: 'flex' }}>
              {/* Divider between tracks */}
              {i > 0 && (
                <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', margin: '0 60px', alignSelf: 'stretch' }} />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 28, width: 140 }}>

                <span style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: mid }}>{label}</span>

                {/* Instrument list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                  {PRESETS.map((p, pi) => (
                    <button key={pi} onClick={() => { setTrack(i, 'presetIdx', pi); if (playing[i]) startTrack(i, { ...t, presetIdx: pi }) }}
                      style={{ ...btnStyle(pi === t.presetIdx, false), textAlign: 'left' }}>
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start', width: '100%' }}>
                  {[
                    { label: `volume ${t.volume > 0 ? '+' : ''}${t.volume} dB`, min: -30, max: 6, step: 1, val: t.volume, key: 'volume' },
                    { label: `pitch ${t.pitch > 0 ? '+' : ''}${t.pitch}`, min: -12, max: 12, step: 1, val: t.pitch, key: 'pitch' },
                    { label: `reverb ${Math.round(t.reverb * 100)}%`, min: 0, max: 1, step: 0.01, val: t.reverb, key: 'reverb' },
                    { label: `stutter ${t.stutter === 0 ? 'off' : t.stutter.toFixed(1) + 'hz'}`, min: 0, max: 20, step: 0.1, val: t.stutter, key: 'stutter' },
                  ].map(({ label: lbl, min, max, step, val, key }) => (
                    <label key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                      <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: dim }}>{lbl}</span>
                      <input type="range" min={min} max={max} step={step} value={val}
                        onChange={e => { const v = Number(e.target.value); setTrack(i, key, v); if (playing[i]) startTrack(i, { ...t, [key]: v }) }}
                        style={{ width: '100%', accentColor: 'rgba(255,255,255,0.4)' }} />
                    </label>
                  ))}
                </div>

              </div>
            </div>
          )
        })}
      </div>

      {/* Transport */}
      <div style={{ position: 'fixed', bottom: 40, left: 48, display: 'flex', gap: 40, alignItems: 'center' }}>
        {TRACKS.map(({ label }, i) => (
          <button key={i} onClick={() => playing[i] ? stopTrack(i) : startTrack(i)} disabled={!loaded[i] || recording} style={btnStyle(playing[i], !loaded[i] || recording)}>
            {!loaded[i] ? 'loading...' : playing[i] ? `■ stop ${label}` : `▶ ${label}`}
          </button>
        ))}
        <button onClick={toggleRecord} disabled={!allLoaded} style={btnStyle(recording, !allLoaded)}>
          {recording ? '■ stop recording' : '● record'}
        </button>
      </div>

    </div>
  )
}
