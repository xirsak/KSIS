import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import MainWindow from "./mainWindow.jsx";
import MainComponent from "./mainComponent/mainComponent.jsx";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <MainComponent />
    </Router>
  </React.StrictMode>
);
