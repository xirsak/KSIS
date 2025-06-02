import React, { useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'

export function HitFire(props) {
  const group = useRef()
  const { nodes, materials, animations } = useGLTF('./hitFire.glb')
  const { actions } = useAnimations(animations, group)
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <mesh
          name="Icosphere"
          castShadow
          receiveShadow
          geometry={nodes.Icosphere.geometry}
          material={materials.Material}
          scale={0.1}
        />
        <mesh
          name="Icosphere001"
          castShadow
          receiveShadow
          geometry={nodes.Icosphere001.geometry}
          material={materials['Material.001']}
          scale={0.101}
        />
        <mesh
          name="Icosphere002"
          castShadow
          receiveShadow
          geometry={nodes.Icosphere002.geometry}
          material={materials['Material.002']}
          scale={0.096}
        />
      </group>
    </group>
  )
}

useGLTF.preload('./hitFire.glb')

