import { useEffect, useState } from "react";

export const usePersonControls = () => {
    const keys = {
        87: "forward",
        83: "backward",
        65: "left",
        68: "right"
    }

    const moveFieldByKey = (key) => {
        return keys[key.keyCode]
    };

    const [movement, setMovement] = useState({
        forward:false,
        backward:false,
        left:false,
        right:false,
    })

    const setMovementStatus = (code,status) =>{
        setMovement((m)=>({...m,[code]:status}))
    }

    useEffect(()=>{
        const handleKeyDown = (ev) => {
            setMovementStatus(moveFieldByKey(ev),true);
        }
        const handleKeyUp = (ev) => {
            setMovementStatus(moveFieldByKey(ev),false);
        }
        document.addEventListener('keydown',handleKeyDown);
        document.addEventListener('keyup',handleKeyUp);

        return()=>{
            document.removeEventListener('keydown',handleKeyDown);
            document.removeEventListener('keyup',handleKeyUp);
        }
    },[]);

    return movement;
}