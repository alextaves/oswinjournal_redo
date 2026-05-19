import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

const ASPECT = 1
const W = 2.5
const SPACING = 2.7

function SpinPlane({ x, texture, geometry }) {
  const meshRef = useRef()

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  }), [texture])

  useFrame((_, delta) => {
    meshRef.current.rotation.y -= delta * 6
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} position={[x, 0, 0]} />
}

function SpinningImages() {
  const texture = useTexture('/images/face.jpg')
  texture.colorSpace = THREE.SRGBColorSpace
  const geometry = useMemo(() => new THREE.PlaneGeometry(W, W * ASPECT), [])

  return (
    <>
      <SpinPlane x={-SPACING} texture={texture} geometry={geometry} />
      <SpinPlane x={0}        texture={texture} geometry={geometry} />
      <SpinPlane x={SPACING}  texture={texture} geometry={geometry} />
    </>
  )
}

export default function Spin() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} scene={{ background: new THREE.Color('#000') }}>
        <SpinningImages />
      </Canvas>
    </div>
  )
}
