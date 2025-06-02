import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import floorTexture from "./assets/groundTexture.jpg";
import React from "react";
import { RigidBody } from "@react-three/rapier";

export const Ground = () => {
  const texture = useTexture(floorTexture);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return (
    <RigidBody>
      <mesh receiveShadow position={[0, 0.5, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          color="gray"
          map={texture}
          map-repeat={[120, 120]}
        />
      </mesh>
    </RigidBody>
  );
};
