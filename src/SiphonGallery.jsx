import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import * as Tone from 'tone'

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

const ALL_IMGS = [
  '/images/detroit/32b copy.jpg',
  '/images/detroit/02.jpg',
  '/images/detroit/08.jpg',
  '/images/detroit/10.jpg',
  '/images/detroit/31 copy.jpg',
  '/images/detroit/30.jpg',
  '/images/detroit/29.jpg',
  '/images/detroit/28.jpg',
  '/images/detroit/28 copy.jpg',
  '/images/detroit/27.jpg',
  '/images/detroit/26.jpg',
  '/images/detroit/25.jpg',
  '/images/detroit/24.jpg',
  '/images/detroit/23.jpg',
  '/images/detroit/18.jpg',
  '/images/detroit/13.jpg',
]

const pick = (n) => Array.from({ length: 4 }, (_, i) => ALL_IMGS[(n * 4 + i) % ALL_IMGS.length])

const CUBES = [
  { z:  0,   x: -4.5, y: -0.1, speed: 0.25, imgs: pick(0)  },
  { z:  0,   x:  0,   y: -0.1, speed: 0.20, imgs: pick(1)  },
  { z:  0,   x:  4.5, y: -0.1, speed: 0.28, imgs: pick(2)  },
  { z: -7,   x: -4.2, y: -0.1, speed: 0.22, imgs: pick(3)  },
  { z: -7,   x:  0.3, y: -0.1, speed: 0.30, imgs: pick(4)  },
  { z: -7,   x:  4.8, y: -0.1, speed: 0.18, imgs: pick(5)  },
  { z: -14,  x: -4.6, y: -0.1, speed: 0.26, imgs: pick(6)  },
  { z: -14,  x: -0.2, y: -0.1, speed: 0.21, imgs: pick(7)  },
  { z: -14,  x:  4.3, y: -0.1, speed: 0.32, imgs: pick(8)  },
  { z: -21,  x: -4.4, y: -0.1, speed: 0.19, imgs: pick(9)  },
  { z: -21,  x:  0.1, y: -0.1, speed: 0.27, imgs: pick(10) },
  { z: -21,  x:  4.6, y: -0.1, speed: 0.23, imgs: pick(11) },
  { z: -28,  x: -4.7, y: -0.1, speed: 0.24, imgs: pick(12) },
  { z: -28,  x: -0.1, y: -0.1, speed: 0.29, imgs: pick(13) },
  { z: -28,  x:  4.4, y: -0.1, speed: 0.20, imgs: pick(14) },
  { z: -35,  x: -4.3, y: -0.1, speed: 0.31, imgs: pick(15) },
  { z: -35,  x:  0.2, y: -0.1, speed: 0.22, imgs: pick(16) },
  { z: -35,  x:  4.7, y: -0.1, speed: 0.26, imgs: pick(17) },
]

function ArtCube({ position, speed, imgs }) {
  const ref = useRef()
  const textures = useTexture(imgs, (ts) => {
    ts.forEach(t => { t.colorSpace = THREE.SRGBColorSpace })
  })

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * speed
  })

  const materials = useMemo(() => {
    const blank = new THREE.MeshBasicMaterial({ color: '#ffffff' })
    return [
      new THREE.MeshBasicMaterial({ map: textures[0] }),
      new THREE.MeshBasicMaterial({ map: textures[1] }),
      blank,
      blank,
      new THREE.MeshBasicMaterial({ map: textures[2] }),
      new THREE.MeshBasicMaterial({ map: textures[3] }),
    ]
  }, [textures])

  return (
    <mesh ref={ref} position={position} material={materials}>
      <boxGeometry args={[2, 2.8, 2]} />
    </mesh>
  )
}

function Scene({ scrollRef }) {
  const { camera, scene } = useThree()
  const cameraZ = useRef(4)

  useEffect(() => {
    scene.fog = new THREE.FogExp2('#ffffff', 0.022)
    scene.background = new THREE.Color('#ffffff')
  }, [scene])

  useFrame(() => {
    cameraZ.current = THREE.MathUtils.lerp(cameraZ.current, scrollRef.current, 0.06)
    camera.position.z = cameraZ.current
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 8, 4]} intensity={1.2} />
      <pointLight position={[0, 4, -20]} intensity={0.8} color="#fff8f0" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -21]}>
        <planeGeometry args={[30, 120]} />
        <meshStandardMaterial color="#d5d6d8" roughness={0.05} metalness={0.2} />
      </mesh>

      {CUBES.map((c, i) => (
        <ArtCube key={i} position={[c.x, c.y, c.z]} speed={c.speed} imgs={c.imgs} />
      ))}
    </>
  )
}

// Drone audio
const N = 8
const MIN_LOG = Math.log2(55)
const MAX_LOG = Math.log2(7040)
const MID_LOG = (MIN_LOG + MAX_LOG) / 2
const RANGE   = MAX_LOG - MIN_LOG
const SIGMA   = RANGE / 3.5
const RATE    = 0.04

function gaussian(logFreq) {
  return Math.exp(-0.5 * ((logFreq - MID_LOG) / SIGMA) ** 2)
}

const VOICES = [
  { freq: 55,    detune:  0  },
  { freq: 55,    detune:  8  },
  { freq: 110,   detune: -5  },
  { freq: 82.5,  detune:  3  },
  { freq: 27.5,  detune:  0  },
]

function useDrone(playing) {
  const nodesRef  = useRef([])
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
      Tone.start().then(() => {
        nodesRef.current.forEach(({ osc }) => osc.start())
        masterRef.current?.gain.rampTo(1, 4)
      })
      wasPlayingRef.current = true
    } else if (!playing && wasPlayingRef.current) {
      masterRef.current?.gain.rampTo(0, 3)
      setTimeout(() => {
        nodesRef.current.forEach(({ osc }) => { try { osc.stop() } catch {} })
      }, 3500)
      wasPlayingRef.current = false
    }
  }, [playing])
}

export default function SiphonGallery() {
  const scrollRef = useRef(4)
  const [droneOn, setDroneOn] = useState(false)
  useDrone(droneOn)

  useEffect(() => {
    const handleWheel = (e) => {
      scrollRef.current = THREE.MathUtils.clamp(scrollRef.current - e.deltaY * 0.01, -50, 4)
    }
    let touchStartY = 0
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY }
    const handleTouchMove = (e) => {
      const delta = touchStartY - e.touches[0].clientY
      touchStartY = e.touches[0].clientY
      scrollRef.current = THREE.MathUtils.clamp(scrollRef.current - delta * 0.02, -50, 4)
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <Scene scrollRef={scrollRef} />
      </Canvas>

      <button
        onClick={() => setDroneOn(d => !d)}
        style={{
          position: 'absolute', bottom: 24, right: 24,
          fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: droneOn ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.25)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {droneOn ? '■ sound' : '▶ sound'}
      </button>
    </div>
  )
}
