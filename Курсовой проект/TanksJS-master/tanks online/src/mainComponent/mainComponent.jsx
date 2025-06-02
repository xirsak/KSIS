import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import EnteryPage from "../enteryPage/enteryPage.jsx";
import MainWindow from "../mainWindow.jsx";
import socketIO from 'socket.io-client';

const socket = socketIO.connect('http://localhost:5000');

export const MainComponent = () => {
  return (
    <Routes>
        <Route path="/" element={<EnteryPage socket={socket} />}></Route>
        <Route path="/tanks" element={<MainWindow socket={socket} />}></Route>
    </Routes>
  );
};

export default MainComponent;