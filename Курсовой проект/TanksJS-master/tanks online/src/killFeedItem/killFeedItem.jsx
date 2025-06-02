import React, { useEffect, useRef } from 'react';
import "./killFeedItem.css"
const KillFeedItem = ({killer,killed,index,removeCB}) => {
    const killfeedRef=useRef();

    useEffect(()=>{
        setTimeout(() => {
            killfeedRef.current.classList.add('hide');
            setTimeout(() => {
                removeCB(index);
            }, 1000);
        }, 3000);
    },[])
    return (
        <div ref={killfeedRef} className='killItem'>
            <span className='killer'>{killer}</span>
            <img src="./tankShoot.png" alt="killfeed image" />
            <span className='killed'>{killed}</span>
        </div>
    );
}

export default KillFeedItem;
