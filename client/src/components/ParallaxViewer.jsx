import React, { useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

function ParallaxImage({ imageSrc, depthSrc }) {
  const meshRef = useRef()
  
  // Load the textures
  const colorMap = useLoader(THREE.TextureLoader, imageSrc)
  const depthMap = useLoader(THREE.TextureLoader, depthSrc)

  useFrame((state) => {
    if (!meshRef.current) return
    
    // Smoothly rotate the plane based on mouse position
    const targetX = (state.pointer.x * 0.25)
    const targetY = (state.pointer.y * 0.25)
    
    meshRef.current.rotation.y += 0.05 * (targetX - meshRef.current.rotation.y)
    meshRef.current.rotation.x += 0.05 * (targetY - meshRef.current.rotation.x)
  })

  // Calculate aspect ratio so image doesn't stretch
  const aspect = colorMap.image ? colorMap.image.width / colorMap.image.height : 1

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[5 * aspect, 5, 128, 128]} />
      <meshStandardMaterial 
        map={colorMap}
        displacementMap={depthMap}
        displacementScale={0.4} 
        displacementBias={-0.2} 
        roughness={1}
      />
    </mesh>
  )
}

export default function ParallaxViewer({ imageSrc, depthSrc }) {
  if (!imageSrc || !depthSrc) return null

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden', cursor: 'grab', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        <React.Suspense fallback={<Html center><p style={{color:'white'}}>Loading 3D...</p></Html>}>
          <ParallaxImage imageSrc={imageSrc} depthSrc={depthSrc} />
        </React.Suspense>
      </Canvas>
    </div>
  )
}

// Simple fallback HTML wrapper
import { Html } from '@react-three/drei'
