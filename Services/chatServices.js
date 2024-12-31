const socketIo = require('socket.io');

let io;

exports.initIo = (server) => {
  io = socketIo(server);
  io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
};

/*exports.getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};*/
