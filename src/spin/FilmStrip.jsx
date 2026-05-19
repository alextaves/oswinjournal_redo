import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

const FRAME_COUNT = 195
const FRAME_H = 2 * Math.tan((60 / 2) * (Math.PI / 180)) * 4  // fills 100vh at fov60, z=4
const FRAME_W = FRAME_H * (225 / 400)
const GAP = 0
const SPACING = FRAME_W + GAP
const TOTAL = FRAME_COUNT * SPACING
const NATURAL_SPEED = SPACING * 30   // plays at real 30fps

const FRAME_URLS = Array.from({ length: FRAME_COUNT }, (_, i) =>
  `/frames/frame_${String(i + 1).padStart(3, '0')}.jpg`
)

function Strip() {
  const textures = useTexture(FRAME_URLS)
  const groupRef = useRef()
  const scrollRef = useRef(0)
  const speedRef = useRef(NATURAL_SPEED)
  const targetSpeedRef = useRef(NATURAL_SPEED)

  useEffect(() => {
    textures.forEach(t => { t.colorSpace = THREE.SRGBColorSpace })
  }, [textures])

  useEffect(() => {
    const onWheel = (e) => {
      targetSpeedRef.current = THREE.MathUtils.clamp(
        targetSpeedRef.current + e.deltaY * 0.4,
        NATURAL_SPEED * 0.02,
        NATURAL_SPEED * 12
      )
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  const { geometry, materials } = useMemo(() => ({
    geometry: new THREE.PlaneGeometry(FRAME_W, FRAME_H),
    materials: textures.map(t => new THREE.MeshBasicMaterial({ map: t })),
  }), [textures])

  useFrame((_, delta) => {
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeedRef.current, 0.04)
    scrollRef.current += speedRef.current * delta
    const scroll = scrollRef.current
    const children = groupRef.current?.children
    if (!children) return
    for (let i = 0; i < children.length; i++) {
      const x = ((i * SPACING - scroll % TOTAL) % TOTAL + TOTAL) % TOTAL - TOTAL / 2
      children[i].position.x = x
    }
  })

  return (
    <group ref={groupRef}>
      {materials.map((mat, i) => (
        <mesh key={i} geometry={geometry} material={mat} />
      ))}
    </group>
  )
}

export default function FilmStrip() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }} scene={{ background: new THREE.Color('#000') }}>
        <Strip />
      </Canvas>
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.25)', pointerEvents: 'none',
      }}>
        scroll to change speed
      </div>
    </div>
  )
}
