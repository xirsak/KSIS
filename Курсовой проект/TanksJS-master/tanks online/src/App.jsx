import { PointerLockControls, Sky } from "@react-three/drei";
import { Ground } from "./Ground.jsx";
import { Physics, RigidBody } from "@react-three/rapier";
import { Player } from "./player.jsx";
import { OtherPlayer } from "./otherPlayer.jsx";
import { useEffect, useState, useCallback } from "react";
import { CameraProvider } from "./cameraContex.jsx";

const shadowOffset = 100;

export const App = ({socket}) => {
  const [playersData, setPlayersData] = useState(null);
  const [hitData, setHitData] = useState({ hittedObj: null, whoShooted: ''});

  // Get hit info
  useEffect(() => {
    socket.on('responseHit', (data) => {
      setHitData({ hittedObj: data.hitted, whoShooted: data.whoIsShooted });
    });
    socket.on('win',()=>{
      document.getElementById('win').classList.add('showRes');
      document.getElementById('scope').classList.remove('scope');
      document.querySelector('.canvas').classList.remove('mask');
    })
    socket.on('responseState', (data) => {
      setPlayersData(data);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('responseHit');
      socket.off('responseState');
    };
  }, []);

  const handleSetHitData = (newData) => {
    setHitData(newData);
  };

  const renderOtherPlayers = useCallback(() => {
    return playersData && playersData.map((data) => {
      if (data.socketID !== socket.id) {
        const shoot = data.socketID === hitData.whoShooted;
        return (
          <OtherPlayer
            key={data.socketID}
            id={data.socketID}
            x={data.x}
            y={data.y}
            z={data.z}
            rotation={data.rotation}
            shoot={shoot}
            isDie = {data.isDie}
            setHitData={handleSetHitData}
          />
        );
      }
      return null;
    });
  }, [playersData, hitData]);

  return (
    <><CameraProvider>
      <PointerLockControls mousespeed={0.1} />
      <Sky sunPosition={[100, 20, 100]}></Sky>
      <ambientLight intensity={1.5} />
      <directionalLight
        castShadow
        intensity={1.5}
        position={[100, 100, 0]}
        shadow-mapSize={4096}
        shadow-camera-top={shadowOffset}
        shadow-camera-bottom={-shadowOffset}
        shadow-camera-left={shadowOffset}
        shadow-camera-right={-shadowOffset}
      />
      <Physics gravity={[0, -20, 0]}>
        <Ground />
        <Player socket={socket} hitData={hitData}/>
        {renderOtherPlayers()}
        <RigidBody>
          <mesh position={[0, 0, 0]}>
            <boxGeometry />
          </mesh>
        </RigidBody>
      </Physics>
      </CameraProvider>
    </>
  );
};

export default App;
