import React, { useState } from "react";
import "./enteryPage.css"
import {Link} from "react-router-dom"

export const EnteryPage = ({socket}) => {
  const [tempInp, setTempInp] = useState('');

  const enterClickHandler=()=>{
    socket.emit('sendName',{name: tempInp})
  }
  const inputTypeHandler=()=>{
    const input = document.getElementById("inputNick");
    setTempInp(input.value);
  }
  return (
    <div className="backGroundEnter">
        <div className="enterBlock">
            <label className="inputLabel">Choose your Nickname</label>
            <div className="inputBlock">
              <input id="inputNick" onChange={inputTypeHandler} placeholder="Typing..." type="text" className="inputNick"/>
              <Link to={"tanks"} onClick={enterClickHandler} className="linkToGame">
                Enter
              </Link>
            </div>
        </div>
    </div>
  );
};

export default EnteryPage;