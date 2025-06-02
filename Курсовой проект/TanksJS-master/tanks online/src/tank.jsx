import { Model } from "./tankModel.jsx";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { HitFire } from "./hitFire.jsx";

const recoilDuration = 500;
const easing = TWEEN.Easing.Quadratic.Out;

export const Tank = (props) => {
  const TRef = useRef();
  const fireRef = useRef();
  const explosiveRef = useRef();
  const shootSoundRef = useRef();
  const reloadSoundRef = useRef();
  const EngineSoundRef = useRef();
  const [recoilAnimation, setRecoilAnimation] = useState(null);
  const [recoilBackAnimation, setRecoilBackAnimation] = useState(null);
  const [showFire, setShowFire] = useState(false);
  const isReloadRef = useRef(false);
  const wasExplosive = useRef(false);
  const wasSound = useRef(false);

  //get pos while animation
  const genNewPos = (currentPosition) => {
    const recoilOffset = new THREE.Vector3(0, 0, -0.5);
    return currentPosition.clone().add(recoilOffset);
  };

  //animation function
  const initRecoilAnimation = () => {
    const currentPosition = new THREE.Vector3(0, 0, 0);
    const initialPosition = new THREE.Vector3(0, 0, 0);
    const newPosition = genNewPos(currentPosition);

    const twRecoilAnimation = new TWEEN.Tween(currentPosition)
      .to(newPosition, recoilDuration)
      .easing(easing)
      .onUpdate(() => {
        TRef.current.position.copy(currentPosition);
      });

    const twRecoilBackAnimation = new TWEEN.Tween(currentPosition)
      .to(initialPosition, recoilDuration)
      .easing(easing)
      .onUpdate(() => {
        TRef.current.position.copy(currentPosition);
      });

    twRecoilAnimation.chain(twRecoilBackAnimation);

    setRecoilAnimation(twRecoilAnimation);
    setRecoilBackAnimation(twRecoilBackAnimation);
  };

  //fire animation
  const playFireAnimation = () => {
    setShowFire(true);

    const fireScale = { x: 0.1, y: 0.1, z: 0.1 };
    const fireGrow = new TWEEN.Tween(fireScale)
      .to({ x: 2, y: 2, z: 2 }, 1000)
      .easing(easing)
      .onUpdate(() => {
        if (fireRef.current) {
          fireRef.current.scale.set(fireScale.x, fireScale.y, fireScale.z);
        }
      });

    const fireShrink = new TWEEN.Tween(fireScale)
      .to({ x: 0.1, y: 0.1, z: 0.1 }, 1000)
      .easing(easing)
      .onUpdate(() => {
        if (fireRef.current) {
          fireRef.current.scale.set(fireScale.x, fireScale.y, fireScale.z);
        }
      })
      .onComplete(() => {
        setShowFire(false);
      });

    fireGrow.chain(fireShrink);
    fireGrow.start();
  };

  //fire animation
  const playExplosiveAnimation = () => {
    const fireScale = { x: 0.1, y: 0.1, z: 0.1 };
    const fireGrow = new TWEEN.Tween(fireScale)
      .to({ x: 17, y: 17, z: 17 }, 1000)
      .easing(easing)
      .onUpdate(() => {
        if (explosiveRef.current) {
          explosiveRef.current.scale.set(fireScale.x, fireScale.y, fireScale.z);
        }
      });

    const fireShrink = new TWEEN.Tween(fireScale)
      .to({ x: 0.1, y: 0.1, z: 0.1 }, 1000)
      .easing(easing)
      .onUpdate(() => {
        if (explosiveRef.current) {
          explosiveRef.current.scale.set(fireScale.x, fireScale.y, fireScale.z);
        }
      })
      .onComplete(() => {
        setShowFire(false);
      });

    fireGrow.chain(fireShrink);
    fireGrow.start();
  };

  if (props.isDie && !wasExplosive.current) {
    const listener = new THREE.AudioListener();
    props.camera.add(listener);
    // create the PositionalAudio object (passing in the listener)
    const sound = new THREE.PositionalAudio(listener);

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("./explosive.mp3", function (buffer) {
      sound.setBuffer(buffer);
      sound.setRefDistance(10);
      sound.play();
    });
    TRef.current.add(sound);
    playExplosiveAnimation();
    wasExplosive.current = true;
  }

  useEffect(() => {
    if (props.shoot) {
      if (recoilAnimation) {
        if (!wasSound.current) {
          wasSound.current = true;
          setTimeout(() => {
            wasSound.current = false;
          }, 1000);
          const listener = new THREE.AudioListener();
          props.camera.add(listener);
          // create the PositionalAudio object (passing in the listener)
          const sound = new THREE.PositionalAudio(listener);

          // load a sound and set it as the PositionalAudio object's buffer
          const audioLoader = new THREE.AudioLoader();
          audioLoader.load("./shootVer2.mp3", function (buffer) {
            sound.setBuffer(buffer);
            sound.setRefDistance(10);
            sound.play();
          });
          TRef.current.add(sound);
        }
        recoilAnimation.start();
        playFireAnimation();
      }
    }
  }, [props.shoot, recoilAnimation]);

  useEffect(() => {
    initRecoilAnimation();
  }, []);

  useEffect(() => {
    const shootHandler = (event) => {
      if (event.button == 0 && props.statement === 2) {
        if (!isReloadRef.current) {
          setTimeout(() => {
            isReloadRef.current = false;
          }, 5000);
          props.setisShoot(true);
          isReloadRef.current = true;
          shootSoundRef.current.play();
          recoilAnimation.start();
          playFireAnimation();
        } else {
          reloadSoundRef.current.play();
        }
      }
    };
    document.addEventListener("mousedown", shootHandler);
    initRecoilAnimation();
    if (props.camera) {
      //sound for shoot
      const listener = new THREE.AudioListener();
      props.camera.add(listener);
      const sound = new THREE.PositionalAudio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load("./shootVer2.mp3", function (buffer) {
        sound.setBuffer(buffer);
        sound.setRefDistance(50);
      });
      TRef.current.add(sound);
      shootSoundRef.current = sound;

      //sound for reload
      const soundReload = new THREE.Audio(listener);
      audioLoader.load("./Reload.mp3", function (buffer) {
        soundReload.setBuffer(buffer);
        soundReload.setVolume(0.5);
      });
      reloadSoundRef.current = soundReload;

      //sound for engine
      if (EngineSoundRef.current == null) {
        if (props.camera) {
          const listener = new THREE.AudioListener();
          props.camera.add(listener);
          const audioLoader = new THREE.AudioLoader();
          const soundEngine = new THREE.PositionalAudio(listener);
          audioLoader.load("./dvigatel.mp3", function (buffer) {
            soundEngine.setBuffer(buffer);
            soundEngine.setRefDistance(20);
            soundEngine.setLoop(true);
            soundEngine.setVolume(0.4);
            soundEngine.play();
          });
          TRef.current.add(soundEngine);
          EngineSoundRef.current = soundEngine;
        }
      }
    }
    return () => {
      document.removeEventListener("mousedown", shootHandler);
    };
  }, [props.statement]);

  useFrame(() => {
    TWEEN.update();
  });

  return (
    <group>
      <group ref={TRef}>
        <Model tankid={props.id} />
        {showFire && (
          <group ref={fireRef} position={[0, 4, 12]}>
            <HitFire />
          </group>
        )}
        {props.isDie && (
          <group ref={explosiveRef} position={[0, 0, 0]}>
            <HitFire />
          </group>
        )}
      </group>
    </group>
  );
};
