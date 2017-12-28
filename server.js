const express = require('express');
const app = express();

const port = process.env.PORT || 1234;

app.use(express.static('static'));

const server = app.listen(port, () => {
  console.log(`technode is on port ${port} |`);
});

const io = require('socket.io').listen(server);

var rooms = {}

io.sockets.on('connection', (socket) => {
  var roomId = ''
  socket.on('join room', (info) => {
    roomId = info.roomId
    if (rooms[roomId] && rooms[roomId].length === 2) {
      socket.emit('error message', '房间人满了，换个房间吧');
      return
    }
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = []

    socket.emit('getHeroType', rooms[roomId].length);

    rooms[roomId].push(info.userName)

    socket.to(roomId).broadcast.emit('add user', info.userName);
  });

  socket.on('moveCard', (list) => {
    socket.to(roomId).broadcast.emit('getList', list);
  });
});
