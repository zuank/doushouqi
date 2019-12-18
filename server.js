const express = require('express');
const app = express();

const port = process.env.PORT || 8000;

app.use(express.static('static'));

const server = app.listen(port, () => {
  console.log(`technode is on port ${port}`);
});

const io = require('socket.io').listen(server);

var rooms = {}

io.sockets.on('connection', (socket) => {
  var roomId = ''
  socket.on('join room', (info) => {
    roomId = info.roomId
    // 房间初始化
    if (!rooms[roomId]) {
      rooms[roomId] = {
        player1: '',
        player2: '',
        list:[],
        nowRound: 'player2'
      }
    }
    if (rooms[roomId].player1 == info.userName || rooms[roomId].player2 == info.userName) {
      socket.emit('getList', rooms[roomId].list);
      socket.emit('nowRound', rooms[roomId].nowRound);
    }
    // 如果房间达到两人
    if (!!rooms[roomId].player1&&!!rooms[roomId].player2){
      if (rooms[roomId].player1!== info.userName && rooms[roomId].player2!== info.userName) {
        socket.emit('error message', '房间人满了，换个房间吧');
        return
      }
    }

    if (rooms[roomId].player1 == ''){
      rooms[roomId].player1 = info.userName
      socket.emit('getHeroType', 'player1');
    } else if (rooms[roomId].player2 == ''){
      rooms[roomId].player2 =  info.userName
      socket.emit('getHeroType', 'player2');
    } else {
      socket.emit('getHeroType', info.userName == rooms[roomId].player1 ? 'player1' : 'player2');
    }

    socket.join(roomId);
    socket.to(roomId).broadcast.emit('add user', info.userName);
  });

  socket.on('moveCard', (list) => {
    rooms[roomId].list = list
    rooms[roomId].nowRound = (rooms[roomId].nowRound == 'player1' ? 'player2' : 'player1')
    socket.in(roomId).emit('getList', list);
    socket.in(roomId).emit('nowRound', rooms[roomId].nowRound);
    console.log(rooms[roomId])
  });

  setInterval(() => {
    socket.emit('alive');
  },10000)

  socket.on('alive', (msg) => {
    console.log(msg)
  });
});
