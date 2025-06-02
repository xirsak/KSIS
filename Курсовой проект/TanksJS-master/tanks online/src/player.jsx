import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { usePersonControls } from "./hooks.js";
import { useFrame } from "@react-three/fiber";
import { Tank } from "./tank.jsx";
import {Vector3, Raycaster} from "three";
import { useCamera } from "./cameraContex.jsx";

const MOVE_SPEED = 5;
const ROTATION_SPEED = 0.5;
const SCOPE_SPEED = 0.1;
const direction = new THREE.Vector3();
const coords={
  x: Math.random()*200-100,
  y: 1.5,
  z: Math.random()*200-100
}

export const Player = ({socket, hitData}) => {
  const playerRef = useRef();
  const { forward, backward, left, right } = usePersonControls();
  const [sides,setSide] = useState(0);
  const [theta, setTheta] = useState(-Math.PI);
  const [scopeOffsetX,setScopeOffsetX] = useState(0);
  const [scopeOffsetY,setScopeOffsetY] = useState(0);
  const [isShoot,setIsShooted] = useState(0);
  const [scopeObject,setScopeObj] = useState(null);
  const [firePos,setFirePos] = useState(null);
  const [isDie,setIsDie] = useState(false);
  const [moveDirection, setMoveDirection] = useState({ x: 0, y: 0 });
  const shootSended = useRef(false);

  const cameraRef = useCamera();
  const radius = 3;
  const tankRef = useRef();
  let quaternion = new THREE.Quaternion();
  const raycaster = new THREE.Raycaster();

  //death handler
  const handleDeath = (state) => {
    const { x, y, z } = playerRef.current.translation();
    setSide(1);
    state.camera.position.set(x + 10, y + 7, z);
    state.camera.setFocalLength(10);
    state.camera.lookAt(x, y + 4, z);
    document.removeEventListener("keydown", switchSide);
  };

  //look around
  const handleLookAround = (state) => {
    state.camera.setFocalLength(15);
    const { x, y, z } = playerRef.current.translation();
    state.camera.position.set(x, y + 7, z);
  };

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    cameraRef.current = state.camera;

    if (isDie) {
      handleDeath(state);
      return;
    }
    //meh position
    if (sides == 1) {
      state.camera.setFocalLength(10);
      const velocity = playerRef.current.linvel();
      const deltaY =  tankRef.current.rotation.y;
      setTheta(deltaY);
      //model rotation
      if (left) {
        tankRef.current.rotation.y += ROTATION_SPEED * delta;
        const deltaX =  tankRef.current.rotation.y;
        setTheta(deltaX);
      }
      if (right) {
        tankRef.current.rotation.y -= ROTATION_SPEED * delta;
        const deltaX =  tankRef.current.rotation.y;
        setTheta(deltaX);
      }

      //movement direction
      quaternion.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        tankRef.current.rotation.y
      );
      if (forward) {
        direction.set(0, 0, 1).applyQuaternion(quaternion).normalize().multiplyScalar(MOVE_SPEED);
      } else if (backward) {
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize().multiplyScalar(MOVE_SPEED);
      } else {
        direction.set(0, 0, 0);
      }
      playerRef.current.wakeUp();
      playerRef.current.setLinvel({
        x: direction.x,
        y: velocity.y,
        z: direction.z,
      });
    
      //camera position and direction
      const { x, y, z } = playerRef.current.translation();
      socket.emit('stateNow',{
        x: x,
        y: y,
        z: z,
        rotation: tankRef.current.rotation.y,
        socketID: socket.id,
        isDie: isDie
      })

      let posX = x + radius * Math.sin(theta);
      let posZ = z + radius * Math.cos(theta);
      state.camera.position.set(posX, y + 3, posZ);
      posX = x + radius * Math.sin(theta)*2;
      posZ = z + radius * Math.cos(theta)*2;
      state.camera.lookAt(new Vector3(posX,y + 3, posZ));
    }

    //position for look around
    if (sides == 0) {
      handleLookAround(state);
    }

    //scope position
    if (sides == 2){
      state.camera.setFocalLength(70);//90
      
      //camera position
      let R = 11;
      const { x, y, z } = playerRef.current.translation();
      let posX = x + R * Math.sin(theta);
      let posZ = z + R * Math.cos(theta);
      let posY = y + 4;
      state.camera.position.set(posX, posY, posZ);
      setFirePos({posx:posX, posy:posY, posz:posZ});

      //camera direction
      if(scopeOffsetX>Math.PI/24){
        setScopeOffsetX(Math.PI/24);
      }
      if(scopeOffsetX<-Math.PI/24){
        setScopeOffsetX(-Math.PI/24)
      }
      if(scopeOffsetY>Math.PI/12){
        setScopeOffsetY(Math.PI/12);
      }
      if(scopeOffsetY<-Math.PI/12){
        setScopeOffsetY(-Math.PI/12)
      }

      posX = x + R * Math.sin(theta)*2;
      posZ = z + R * Math.cos(theta)*2;
      posY = y+3;
      /////////////////////

      posY=  (y+3) * R * Math.sin(scopeOffsetY);
      //R=R*Math.cos((scopeOffsetY+theta));
      R=50;
      posX= x + R * Math.sin((theta+scopeOffsetX))*2;
      posZ= z + R * Math.cos((theta+scopeOffsetX))*2;
      ///////////////////////////
      state.camera.lookAt(new THREE.Vector3(posX,posY,posZ));      
      
      // Raycasting from the camera to the target point
      const cameraPosition = state.camera.position.clone();
      const targetPosition = new THREE.Vector3(posX, posY, posZ);
      raycaster.set(cameraPosition, targetPosition.sub(cameraPosition).normalize());

      // Check for intersections
      const intersects = raycaster.intersectObjects(state.scene.children, true);
      if (intersects.length > 0) {
        if (intersects[0].object.parent.userData.id!=undefined){
          setScopeObj(intersects[0].object);
        }
        else if(intersects.length>6){
          setScopeObj(intersects[6].object);
        }
        else{
          setScopeObj(intersects[0].object);
        }
      }
    }

    if (isShoot && !shootSended.current){
      console.log('sended');
      socket.emit('hit',{
        hitted: scopeObject.parent.userData.id,
        whoIsShooted: socket.id,
      })
      shootSended.current=true;
      setTimeout(() => {
        shootSended.current=false;
      }, 500);
    }

    //animate camera when shooting
    if (isShoot){
      let coords = state.camera.position;
      state.camera.position.set(coords.x+Math.random()/5,coords.y+Math.random()/5,coords.z+Math.random()/5);
      setTimeout(() => {
        setIsShooted(false);
      }, 300);
      state.camera.position.set(coords.x,coords.y,coords.z);
    }

    //check is player die
    if (hitData.hittedObj==socket.id){
      console.log(hitData)
      setIsDie(true);
      const { x, y, z } = playerRef.current.translation();
      socket.emit('died',{
        x: x,
        y: y,
        z: z,
        rotation: tankRef.current.rotation.y,
        socketID: socket.id,
        isDie: true
      });
      coords.x=x;
      coords.y=y;
      coords.z=z;
      document.getElementById('lose').classList.add('showRes');
    }

    setScopeOffsetX((oldOffset) => oldOffset + moveDirection.x * SCOPE_SPEED * delta);
    setScopeOffsetY((oldOffset) => oldOffset + moveDirection.y * SCOPE_SPEED * delta);
  });

  //handler for keydown
  const switchSide=(event)=>{

     //change position of the player in the tank
    switch (event.keyCode){
      case 49: 
        setSide(0);
        break;
      case 50:
        setSide(1);
        break;
      case 51:
        setSide(2);
        break;
    }
  };
  
  const handleScopeMove = (event) => {
    switch (event.keyCode) {
      case 37:
        setMoveDirection((dir) => ({ ...dir, x: 1 }));
        break;
      case 38:
        setMoveDirection((dir) => ({ ...dir, y: 1 }));
        break;
      case 39:
        setMoveDirection((dir) => ({ ...dir, x: -1 }));
        break;
      case 40:
        setMoveDirection((dir) => ({ ...dir, y: -1 }));
        break;
    }
  };
  
  const handleScopeStop = (event) => {
    switch (event.keyCode) {
      case 37:
      case 39:
        setMoveDirection((dir) => ({ ...dir, x: 0 }));
        break;
      case 38:
      case 40:
        setMoveDirection((dir) => ({ ...dir, y: 0 }));
        break;
    }
  };



  //add mask for canvas if the side of the player is "shooter"
  useEffect(()=>{
    if (sides == 2){
      setScopeOffsetX(0);
      setScopeOffsetY(0);
      document.getElementById('scope').classList.add('scope');
      document.querySelector('.canvas').classList.add('mask');
    }else{
      document.getElementById('scope').classList.remove('scope');
      document.querySelector('.canvas').classList.remove('mask');
    }
  }, [sides])
  //change camera direction
  
//initialize component
  useEffect(() => {
    document.addEventListener("keydown", switchSide);
    document.addEventListener("keydown", handleScopeMove);
    document.addEventListener("keyup", handleScopeStop);
    tankRef.current.rotation.y = Math.random()*6;
    playerRef.current.x= coords.x;
    playerRef.current.y= coords.y;
    playerRef.current.z= coords.z;
    socket.emit('stateNow',{
      x: coords.x,
      y: coords.y,
      z: coords.z,
      rotation: tankRef.current.rotation.y,
      socketID: socket.id,
      isDie: false
    })
    direction.set(1, 0, 0);
    return () => {
      document.removeEventListener("keydown", switchSide);
      document.removeEventListener("keydown", handleScopeMove);
      document.removeEventListener("keyup", handleScopeStop);
    };
  }, []);

  return (
    <>
      <RigidBody position={[coords.x, 1.5, coords.z]} ref={playerRef} lockRotations>
        <group ref={tankRef}>
          <Tank isDie={isDie} camera={cameraRef.current} firePos = {firePos} statement={sides} setisShoot={setIsShooted}/>
        </group>
      </RigidBody>
    </>
  );
};
