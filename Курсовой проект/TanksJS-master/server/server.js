const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const http = require('http').Server(app);
const cors = require('cors');
const socketIO = require('socket.io')(http,{
  cors:{
    origin:'http://localhost:5173'
  }
});

// Создание GET маршрута
app.get('/express_backend', (req, res) => { //Строка 9
  console.log("Отправлено")
  res.json({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }); //Строка 10

});

//массив состояний игроков
const playersState = {};

//массив имен
const playersNames = {};

//function for checking winner
const checkForWinner = () => {
  const alivePlayers = Object.values(playersState).filter(player => !player.isDie);

  if (alivePlayers.length === 1) {
    const winner = alivePlayers[0];
    socketIO.to(winner.socketID).emit('win', { message: 'You are the winner!' });
  }
};

socketIO.on('connection',(socket,data)=>{
  console.log(`${socket.id} user connected`);
  socket.on('sendName',(data)=> {
    playersNames[socket.id] = data.name;
  })
  socket.on('stateNow',(data)=>{
    playersState[socket.id] = data;
    socketIO.emit('responseState', Object.values(playersState));
  })
  socket.on('hit',(data)=>{
    socketIO.emit('responseHit', data);

    if(data.hitted && !playersState[data.hitted].isDie){
      const responseDiedData = {
        killed: playersNames[data.hitted],
        killer: playersNames[data.whoIsShooted]
      };
      console.log(responseDiedData)
      socketIO.emit('responseDied', responseDiedData);
    }
  })
  socket.on('died',(data)=>{
    playersState[socket.id] = data;
    socketIO.emit('responseState', Object.values(playersState));
    checkForWinner();
  })
  socket.on('disconnect',(reason)=>{
    let id = socket.id;
    delete playersState[id];
    delete playersNames[id];
    console.log(`${socket.id} user disconnected`);
    socketIO.emit('responseState', Object.values(playersState));
  })
})

http.listen(port, () => console.log(`Listening on port ${port}`));

