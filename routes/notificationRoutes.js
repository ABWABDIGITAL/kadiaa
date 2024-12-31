const express = require("express");
const User = require("../models/userModel"); 
const { getIo } = require("../socket"); 

const router = express.Router();

// Notify a user of new notifications
router.post("/:userId/notifications", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const notification = {
      message: req.body.message,
      deeplink: req.body.deeplink, // Add deeplink field
      read: false,
      createdAt: new Date(),
    };

    user.notifications.push(notification);
    await user.save();

    // Emit event to client
    const io = getIo();
    io.to(req.params.userId).emit("new_notification", notification);

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all notifications for a user
router.get("/:id/notifications", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("notifications");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user.notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark a notification as read for a user
router.patch("/:userId/notifications/:notificationId", async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const notification = user.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.read = true;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read for a user
router.patch("/:userId/notifications", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.notifications.forEach((notification) => (notification.read = true));
    await user.save();
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: user.notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all notifications for all users (if needed)
// This endpoint can be used if you want to fetch notifications for all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("notifications");
    if (!users.length) {
      return res.status(404).json({ success: false, message: "No users found" });
    }
    
    // Extract all notifications
    const allNotifications = users.reduce((acc, user) => {
      return acc.concat(user.notifications);
    }, []);

    res.status(200).json({ success: true, data: allNotifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
