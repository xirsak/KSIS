import React, { createContext, useContext, useRef } from "react";

// Создаем контекст для камеры
const CameraContext = createContext();

export const useCamera = () => {
    return useContext(CameraContext);
};

// Компонент для предоставления контекста камеры
export const CameraProvider = ({ children }) => {
    const camera = useRef();
    return (
        <CameraContext.Provider value={camera}>
            {children}
        </CameraContext.Provider>
    );
};
