import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, MeshReflectorMaterial } from '@react-three/drei'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import PlaygroundDrone from './PlaygroundDrone'
import PlaygroundHamburger from './PlaygroundHamburger'
import SpinApp from './SpinApp'

const isMobile = () => window.innerWidth < 768
const isTablet = () => window.innerWidth >= 768 && window.innerWidth < 1024

function getSpread() {
  if (isMobile()) return 2.5
  if (isTablet()) return 3.5
  return 4.5
}

function getFov() {
  if (isMobile()) return 75
  if (isTablet()) return 65
  return 60
}

const ALL_IMGS = Array.from({ length: 16 }, (_, i) => `/images/face${i + 1}.jpg`)
const pick = (n) => Array.from({ length: 4 }, (_, i) => ALL_IMGS[(n * 4 + i) % ALL_IMGS.length])

function makeCubes(s) {
  return [
    { z:  0,   x: -s,       y: -0.1, speed: 0.25, imgs: pick(0)  },
    { z:  0,   x:  0,       y: -0.1, speed: 0.20, imgs: pick(1)  },
    { z:  0,   x:  s,       y: -0.1, speed: 0.28, imgs: pick(2)  },
    { z: -7,   x: -(s-0.3), y: -0.1, speed: 0.22, imgs: pick(3)  },
    { z: -7,   x:  0.3,     y: -0.1, speed: 0.30, imgs: pick(4)  },
    { z: -7,   x:  s+0.3,   y: -0.1, speed: 0.18, imgs: pick(5)  },
    { z: -14,  x: -(s+0.1), y: -0.1, speed: 0.26, imgs: pick(6)  },
    { z: -14,  x: -0.2,     y: -0.1, speed: 0.21, imgs: pick(7)  },
    { z: -14,  x:  s-0.2,   y: -0.1, speed: 0.32, imgs: pick(8)  },
    { z: -21,  x: -(s+0.1), y: -0.1, speed: 0.19, imgs: pick(9)  },
    { z: -21,  x:  0.1,     y: -0.1, speed: 0.27, imgs: pick(10) },
    { z: -21,  x:  s+0.1,   y: -0.1, speed: 0.23, imgs: pick(11) },
    { z: -28,  x: -(s+0.2), y: -0.1, speed: 0.24, imgs: pick(12) },
    { z: -28,  x: -0.1,     y: -0.1, speed: 0.29, imgs: pick(13) },
    { z: -28,  x:  s-0.1,   y: -0.1, speed: 0.20, imgs: pick(14) },
    { z: -35,  x: -(s+0.2), y: -0.1, speed: 0.31, imgs: pick(15) },
    { z: -35,  x:  0.2,     y: -0.1, speed: 0.22, imgs: pick(16) },
    { z: -35,  x:  s+0.2,   y: -0.1, speed: 0.26, imgs: pick(17) },
    { z: -42,  x: -s,       y: -0.1, speed: 0.18, imgs: pick(18) },
    { z: -42,  x:  0,       y: -0.1, speed: 0.25, imgs: pick(19) },
    { z: -42,  x:  s,       y: -0.1, speed: 0.23, imgs: pick(20) },
  ]
}

function ArtCube({ position, speed, imgs }) {
  const ref = useRef()
  const textures = useTexture(imgs, (ts) => {
    ts.forEach(t => { t.colorSpace = THREE.SRGBColorSpace })
  })
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * speed
  })
  const blank = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  const materials = [
    new THREE.MeshBasicMaterial({ map: textures[0] }),
    new THREE.MeshBasicMaterial({ map: textures[1] }),
    blank,
    blank,
    new THREE.MeshBasicMaterial({ map: textures[2] }),
    new THREE.MeshBasicMaterial({ map: textures[3] }),
  ]
  return (
    <mesh ref={ref} position={position} material={materials}>
      <boxGeometry args={[2, 2.8, 2]} />
    </mesh>
  )
}

function Floor({ mobile }) {
  if (mobile) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -18]}>
        <planeGeometry args={[30, 120]} />
        <meshStandardMaterial color="#d5d6d8" roughness={0.4} metalness={0.1} />
      </mesh>
    )
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -18]}>
      <planeGeometry args={[30, 120]} />
      <MeshReflectorMaterial
        color="#d5d6d8"
        roughness={0.1}
        metalness={0.0}
        mirror={0.9}
        blur={[400, 100]}
        resolution={1024}
        mixBlur={6}
        mixStrength={1.5}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
      />
    </mesh>
  )
}

function Scene({ scrollRef, cubes, mobile }) {
  const { camera, scene } = useThree()
  const cameraZ = useRef(4)

  useEffect(() => {
    scene.fog = new THREE.FogExp2('#ffffff', 0.022)
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
      <Floor mobile={mobile} />
      {cubes.map((c, i) => (
        <ArtCube key={i} position={[c.x, c.y, c.z]} speed={c.speed} imgs={c.imgs} />
      ))}
    </>
  )
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function Playground({ onBack, initialExperiment = 'cubes' }) {
  const [experiment, setExperiment] = useState(initialExperiment)
  const scrollRef = useRef(4)
  const [playing, setPlaying] = useState(false)
  const [mobile, setMobile] = useState(isMobile)
  const [cubes, setCubes] = useState(() => makeCubes(getSpread()))
  const [fov] = useState(getFov)

  useEffect(() => {
    const handleResize = () => {
      setMobile(isMobile())
      setCubes(makeCubes(getSpread()))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleWheel = (e) => {
      scrollRef.current = THREE.MathUtils.clamp(
        scrollRef.current - e.deltaY * 0.01,
        -50, 4
      )
    }
    let touchStartY = 0
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY }
    const handleTouchMove = (e) => {
      const delta = touchStartY - e.touches[0].clientY
      touchStartY = e.touches[0].clientY
      scrollRef.current = THREE.MathUtils.clamp(
        scrollRef.current - delta * 0.03,
        -50, 4
      )
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
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0, zIndex: 10 }}>
      <PlaygroundHamburger active={experiment} onSelect={setExperiment} />

      {experiment === 'spin' && <SpinApp />}

      {experiment === 'cubes' && (
        <div style={{ width: '100%', height: '100%', background: '#ffffff' }}>
          <PlaygroundDrone playing={playing} />
          <Canvas camera={{ position: [0, 0, 4], fov }} dpr={[1, 2]}>
            <Scene scrollRef={scrollRef} cubes={cubes} mobile={mobile} />
          </Canvas>
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 24,
          }}>
            <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
              scroll or swipe to move
            </span>
            <button
              onClick={() => setPlaying(p => !p)}
              style={{
                fontFamily: SANS, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: playing ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.25)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {playing ? '■ sound' : '▶ sound'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
