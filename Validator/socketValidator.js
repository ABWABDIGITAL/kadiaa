const socketIo = require('socket.io');

let io;

module.exports.initIo = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['my-custom-header'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user login
    socket.on('loginName', (username) => {
      if (bannedUsers.includes(username)) {
        socket.emit('banned');
        return;
      }
      if (users.find((user) => user.username === username)) {
        socket.emit('usernameTaken');
        return;
      }
      const user = { username, id: socket.id };
      users.push(user);
      io.emit('showUsers', users);
    });

    // Handle public messages
    socket.on('sendMessage', (msg) => {
      const currentUser = users.find((user) => user.id === socket.id);
      if (currentUser) {
        const message = { user: currentUser.username, message: msg };
        chatMsg.push(message);
        io.emit('displayMsg', chatMsg);
      }
    });

    // Handle private messages
    socket.on('chatWith', (id) => {
      const fromUser = users.find((user) => user.id === socket.id);
      const toUser = users.find((user) => user.id === id);
      if (fromUser && toUser) {
        socket.emit('showUser', toUser.username);
        socket.on('sendMessagePrivate', (msg) => {
          const privateMessage = { user: fromUser.username, message: msg };
          chatMsgPrivate.push(privateMessage);
          io.to(toUser.id).emit('displayMsgPrivate', chatMsgPrivate);
        });
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      users = users.filter((user) => user.id !== socket.id);
      io.emit('showUsers', users);
      if (users.length === 0) {
        chatMsg = [];
        chatMsgPrivate = [];
      }
    });

    // Admin functionalities
    socket.on('kickUser', (username) => {
      const user = users.find((u) => u.username === username);
      if (user) {
        io.to(user.id).emit('kicked');
        users = users.filter((u) => u.username !== username);
        io.emit('showUsers', users);
      }
    });

    socket.on('banUser', (username) => {
      const user = users.find((u) => u.username === username);
      if (user) {
        bannedUsers.push(username);
        io.to(user.id).emit('banned');
        users = users.filter((u) => u.username !== username);
        io.emit('showUsers', users);
      }
    });

    socket.on('deleteMessage', (message) => {
      chatMsg = chatMsg.filter((msg) => msg.message !== message);
      chatMsgPrivate = chatMsgPrivate.filter((msg) => msg.message !== message);
      io.emit('displayMsg', chatMsg);
      io.emit('displayMsgPrivate', chatMsgPrivate);
    });

    // Emit stats for Chart.js
    const updateStats = () => {
      const stats = {
        labels: users.map((u) => u.username),
        data: users.map(
          (u) => chatMsg.filter((msg) => msg.user === u.username).length
        ),
      };
      io.emit('updateStats', stats);
    };
    setInterval(updateStats, 5000);
  });
};

module.exports.getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
