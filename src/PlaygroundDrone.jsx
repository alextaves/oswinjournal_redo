import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

const VOICES = [
  { freq: 55,    detune:  0   },
  { freq: 55,    detune:  8   },
  { freq: 110,   detune: -5   },
  { freq: 82.5,  detune:  3   },
  { freq: 27.5,  detune:  0   },
]

export default function PlaygroundDrone({ playing }) {
  const nodesRef = useRef([])
  const masterRef = useRef(null)
  const wasPlayingRef = useRef(false)

  useEffect(() => {
    const reverb = new Tone.Reverb({ decay: 8, wet: 0.6 })
    const master = new Tone.Gain(0).toDestination()
    reverb.connect(master)
    masterRef.current = master

    VOICES.forEach(({ freq, detune }) => {
      const osc = new Tone.Oscillator(freq, 'sine')
      const vol = new Tone.Volume(-18)
      const lfo = new Tone.LFO({ frequency: 0.05 + Math.random() * 0.05, min: -1, max: 1 })
      osc.detune.value = detune
      lfo.connect(osc.detune)
      osc.connect(vol)
      vol.connect(reverb)
      lfo.start()
      nodesRef.current.push({ osc, vol, lfo })
    })

    return () => {
      nodesRef.current.forEach(({ osc, vol, lfo }) => {
        try { osc.stop(); osc.dispose() } catch {}
        try { lfo.stop(); lfo.dispose() } catch {}
        try { vol.dispose() } catch {}
      })
      try { reverb.dispose() } catch {}
      try { master.dispose() } catch {}
    }
  }, [])

  useEffect(() => {
    if (playing && !wasPlayingRef.current) {
      nodesRef.current.forEach(({ osc }) => osc.start())
      masterRef.current.gain.rampTo(1, 4)
      wasPlayingRef.current = true
    } else if (!playing && wasPlayingRef.current) {
      masterRef.current.gain.rampTo(0, 3)
      setTimeout(() => {
        nodesRef.current.forEach(({ osc }) => { try { osc.stop() } catch {} })
      }, 3500)
      wasPlayingRef.current = false
    }
  }, [playing])

  return null
}
