const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Lawyer =require ("../models/lawyerModel")
const Message = require("../models/message");
const asyncHandler = require('express-async-handler');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter'); 
// Route to handle GET request to fetch all chats for a specific user
router.get("/chats/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const chats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ lastMessageDate: -1 })
      .populate("sender", "username profileImage")
      .populate("receiver", "username profileImage")
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username profileImage',
        },
      });

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Route to handle GET request to fetch a single chat by its ID with populated sender and receiver
router.get("/chat/:id", async (req, res) => {
  const chatId = req.params.id;

  try {
    const chat = await Chat.findById(chatId)
      .populate("sender", "username profileImage role email")
      .populate("receiver", "username profileImage role email")
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username profileImage',
        },
      });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({
      message: "Chat found",
      data: chat,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Route to handle POST request to create a new message
router.post('/message', async (req, res) => {
  const { chatId, sender, message } = req.body;

  // Check if all required fields are present
  if (!chatId || !sender || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate the chatId and sender ObjectId
  if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(sender)) {
    return res.status(400).json({ error: 'Invalid chatId or senderId' });
  }

  try {
    // Find the chat by ID
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Create a new message
    const newMessage = new Message({
      chat: chatId,
      sender,
      message,
    });

    // Save the new message
    const savedMessage = await newMessage.save();

    // Update the chat with the last message information
    chat.lastMessage = savedMessage._id;
    chat.lastMessageDate = new Date();
    await chat.save();

    // Populate the sender and chat fields in the saved message
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'username profileImage role email')
      .populate('chat', 'sender receiver lastMessage lastMessageDate');

    // Respond with the populated message
    res.status(201).json({
      message: 'Message created successfully',
      data: populatedMessage,
    });
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});






// Route to handle POST request to create a new chat with an initial message
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { sender, receiver, message } = req.body;

    // Validate request body
    if (!sender || !receiver || !message) {
      return res.status(400).json(formatErrorResponse('All fields are required'));
    }

    try {
      // Check if sender and receiver are valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
        return res.status(400).json(formatErrorResponse('Invalid sender or receiver ID'));
      }

      // Check if sender and receiver exist in the User collection
      const [senderUser, receiverUser] = await Promise.all([
        User.findById(sender),
        User.findById(receiver),
      ]);

      if (!senderUser || !receiverUser) {
        return res.status(404).json(formatErrorResponse('Sender or receiver not found'));
      }

      // Create a new chat
      const newChat = new Chat({
        sender,
        receiver,
        lastMessageDate: new Date(), // Initial lastMessageDate
      });

      const savedChat = await newChat.save();

      // Create a new message for the chat
      const newMessage = new Message({
        chat: savedChat._id,
        sender,
        message,
      });

      const savedMessage = await newMessage.save();

      // Update the chat's lastMessage to reference the saved message
      savedChat.lastMessage = savedMessage._id;
      await savedChat.save();

      // Populate sender, receiver, and lastMessage fields in saved chat
      const populatedChat = await Chat.findById(savedChat._id)
        .populate('sender', 'username profileImage role email')
        .populate('receiver', 'username profileImage role email')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'username profileImage',
          },
        });

      // Respond with the populated chat data
      res.status(201).json(
        formatSuccessResponse(populatedChat, 'Chat created successfully')
      );
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json(formatErrorResponse('Server error'));
    }
  })
);
// Route to create a chat where the sender is a lawyer
router.post(
  '/lawyer-chat',
  asyncHandler(async (req, res) => {
    const { sender, receiver, message } = req.body;

    // Validate request body
    if (!sender || !receiver || !message) {
      return res.status(400).json(formatErrorResponse('All fields are required'));
    }

    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
        return res.status(400).json(formatErrorResponse('Invalid sender or receiver ID'));
      }

      // Check if sender is a Lawyer
      const senderLawyer = await Lawyer.findById(sender);
      if (!senderLawyer) {
        return res.status(403).json(formatErrorResponse('Sender must be a lawyer'));
      }

      // Check if receiver exists in User or Lawyer collections
      const receiverData = await User.findById(receiver) || await Lawyer.findById(receiver);
      if (!receiverData) {
        return res.status(404).json(formatErrorResponse('Receiver not found'));
      }

      // Find or create a chat
      let chat = await Chat.findOne({
        $or: [
          { sender: sender, receiver: receiver },
          { sender: receiver, receiver: sender }
        ]
      });

      if (!chat) {
        chat = new Chat({
          sender,
          receiver,
          lastMessageDate: new Date() // Initial lastMessageDate
        });
        await chat.save();
      }

      // Create and save a new message
      const newMessage = new Message({
        chat: chat._id,
        sender,
        senderType: 'Lawyer', // Indicating that sender is a lawyer
        message
      });

      const savedMessage = await newMessage.save();

      // Update chat with new message details
      chat.lastMessage = savedMessage._id;
      chat.lastMessageDate = new Date();
      await chat.save();

      // Populate chat with sender, receiver, and lastMessage details
      const populatedChat = await Chat.findById(chat._id)
        .populate('sender', 'username profileImage role email')
        .populate('receiver', 'username profileImage role email')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'username profileImage'
          }
        });

      // Respond with the updated chat information
      res.status(201).json(
        formatSuccessResponse(populatedChat, 'Chat updated or created successfully with a lawyer as the sender')
      );
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json(formatErrorResponse('Server error'));
    }
  })
);



// Route to handle GET request to fetch all messages for a specific chat ID
router.get('/messages/:chatId', async (req, res) => {
  const { chatId } = req.params;

  console.log(`Fetching messages for chatId: ${chatId}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username profileImage');

    console.log(`Found messages: ${messages.length}`);

    if (!messages || messages.length === 0) {
      return res.status(404).json({ message: 'No messages found in this chat.', data: [] });
    }

    res.status(200).json({
      message: 'Messages fetched successfully',
      data: messages,
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Route to get chat history for a specific user
router.get("/history/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const chats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ lastMessageDate: -1 })
      .populate("sender", "nameLawyer email profileImage")
      .populate("receiver", "username email profileImage")
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'nameLawyer email profileImage',
        },
      });

    // Check if chats exist, if not return an empty array
    if (!chats || chats.length === 0) {
      return res.status(200).json({
        message: "No chat history found.",
        data: [],
      });
    }

    res.status(200).json({
      message: "Chat history fetched successfully",
      data: chats,
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Route to get a specific chat with its messages
router.get("/chat-history/:chatId", async (req, res) => {
  const chatId = req.params.chatId;

  try {
    // Validate chatId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chatId" });
    }

    // Fetch the chat
    const chat = await Chat.findById(chatId)
      .populate("sender", "nameLawyer profileImage role email")
      .populate("receiver", "username profileImage role email")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username profileImage",
        },
      });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Fetch all messages in this chat and populate the sender field
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username profileImage role email");

    res.json({
      message: "Chat and messages fetched successfully",
      data: { chat, messages },
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
