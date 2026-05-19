import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

const FRAME_COUNT = 195
const NATURAL_SPEED = 30  // frames per second

const FRAME_URLS = Array.from({ length: FRAME_COUNT }, (_, i) =>
  `/frames/frame_${String(i + 1).padStart(3, '0')}.jpg`
)

function Strip() {
  const textures = useTexture(FRAME_URLS)
  const { viewport } = useThree()
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
        targetSpeedRef.current + e.deltaY * 0.15,
        NATURAL_SPEED * 0.01,
        NATURAL_SPEED * 20
      )
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  const { geometry, materials } = useMemo(() => ({
    geometry: new THREE.PlaneGeometry(1, 1),
    materials: textures.map(t => new THREE.MeshBasicMaterial({ map: t })),
  }), [textures])

  useFrame((_, delta) => {
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeedRef.current, 0.04)

    const W = viewport.width
    const H = viewport.height
    const SPACING = W
    const TOTAL = FRAME_COUNT * SPACING

    scrollRef.current += speedRef.current * SPACING * delta

    const children = groupRef.current?.children
    if (!children) return
    for (let i = 0; i < children.length; i++) {
      const x = ((i * SPACING - scrollRef.current % TOTAL) % TOTAL + TOTAL) % TOTAL - TOTAL / 2
      children[i].position.x = x
      children[i].scale.set(W, H, 1)
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

export default function SingleFrame() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ height: '85vh', width: 'calc(85vh * 225 / 400)', flexShrink: 0 }}>
        <Canvas camera={{ position: [0, 0, 4], fov: 60 }} scene={{ background: new THREE.Color('#000') }}>
          <Strip />
        </Canvas>
      </div>
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
