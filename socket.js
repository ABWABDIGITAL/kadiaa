const socketIo = require('socket.io');
const { ObjectId } = require('mongoose').Types;
const Message = require('./models/message');
const Chat = require('./models/chatModel');

let io;

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['my-custom-header'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle user join
    socket.on('join', async (chatId) => {
      if (!ObjectId.isValid(chatId)) {
        socket.emit('error', 'Invalid chatId');
        return;
      }

      socket.join(chatId);
      console.log(`Client ${socket.id} joined room: ${chatId}`);
      // Optionally fetch and send chat history
      const messages = await Message.find({ chat: chatId }).populate('sender', 'username profileImage');
      socket.emit('chatHistory', messages);
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ chatId, senderId, message }) => {
      if (!ObjectId.isValid(chatId) || !ObjectId.isValid(senderId)) {
        socket.emit('error', 'Invalid chatId or senderId');
        return;
      }

      try {
        const newMessage = new Message({ chat: chatId, sender: senderId, message });
        const savedMessage = await newMessage.save();

        // Update chat with the new message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: savedMessage._id,
          lastMessageDate: new Date(),
        });

        io.to(chatId).emit('newMessage', savedMessage);
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle typing indicators
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', socket.id);
    });

    // Handle private messages
    socket.on('sendPrivateMessage', async ({ toUserId, message }) => {
      const fromUserId = socket.id;
      const toSocket = Array.from(io.sockets.sockets.values()).find(s => s.id === toUserId);
      if (toSocket) {
        toSocket.emit('privateMessage', { fromUserId, message });
        socket.emit('privateMessage', { fromUserId, message });
      } else {
        socket.emit('error', 'User not online');
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { init, getIo };
