import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Tank } from "./tank.jsx";
import { useCamera } from "./cameraContex.jsx"; 

const direction = new THREE.Vector3();

export const OtherPlayer = ({id,x,y,z,rotation,shoot,setHitData, isDie}) => {
  const playerRef = useRef();
  const tankRef = useRef();
  const cameraRef = useCamera();

  const [isMonted, setIsMonted] = useState(false);
  const [isShow,setIsShow] = useState(true);
  useEffect(() => {
    if (shoot) {
      const timeout = setTimeout(() => {
        setHitData(prevState => ({
          ...prevState,
          whoShooted: ''
        }));
      }, 1);
      return () => clearTimeout(timeout);
    }
    
  }, [shoot, setHitData]);

  useFrame(() => {
    if(isMonted){
      playerRef.current.wakeUp();
      tankRef.current.rotation.y = rotation;
      playerRef.current.position=[x,y,z];
    }
    if (isDie && isShow){
      setTimeout(() => {
        setIsShow(false);
      }, 2000);
    }
  });
  
//initialize component
  useEffect(() => {
    tankRef.current.rotation.y = Math.PI;
    direction.set(1, 0, 0);
    setIsMonted(true);
  }, []);

  return (
    <>
      <RigidBody position={[x,y,z]} ref={playerRef} lockRotations>
        <group ref={tankRef}>
        { isShow && (
          <Tank position={[0, 0, 0]} camera={cameraRef.current} isDie={isDie} id = {id} statement={3} shoot={shoot}/>
          )}
        </group>
      </RigidBody>
      
    </>
  );
};
