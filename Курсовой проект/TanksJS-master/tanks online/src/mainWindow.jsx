import React, { useState,useEffect, useRef } from "react";
import App from "./App.jsx";
import "./index.css";
import { Canvas } from "@react-three/fiber";
import KillFeedItem from "./killFeedItem/killFeedItem.jsx";
import {Link} from "react-router-dom"

export const MainWindow = ({socket}) => {
  const [killEvents,setKillEvents]= useState([]);
  const processedEvents = useRef(new Set());
  useEffect(() => {
    socket.on('responseDied', (data) => {
      const dataString = JSON.stringify(data);
      if (!processedEvents.current.has(dataString)) {
        console.log(data);
        setKillEvents((prev) => [...prev, data]);
        processedEvents.current.add(dataString);  // Добавление события в обработанные
      }
    });
    return () => {
      socket.off('responseDied');
    };
  },[]);

  const removeCB=(index)=>{
    setKillEvents((prevFeeds)=>prevFeeds.filter((_, i) => i !== index))
  }

  return (
    <div id="container" >
      <div id="killfeed" className="killfeed">
        {
          killEvents && killEvents.map((data,index)=>(
            <KillFeedItem 
              key={index}
              killer={data.killer} 
              killed={data.killed}
              index={index}
              removeCB={removeCB}
            />
          ))
        }
      </div>
      <div id="scope"> </div>
      <div id="win" className="ResWindow winWindow">
        <div className="resContainer">
          <div className="resText win">
            YOU WIN
          </div>    
          <a href={"/"} className="backBtn win" onClick={()=>{socket.disconnect(true)}}>Back to main</a>
        </div>   
      </div>
      <div id="lose" className="ResWindow">
        <div className="resContainer">
          <div className="resText die">
            YOU DIED
          </div>    
          <a href={"/"} className="backBtn die" onClick={()=>{socket.disconnect(true)}}>Back to main</a>
        </div>
      </div>
      <Canvas className="canvas" camera={{ fov: 60 }} shadows>
        <App socket={socket}/>
      </Canvas>
    </div>
  );
};

export default MainWindow;