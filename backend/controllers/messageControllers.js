const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("replyTo")
      .populate({ path: "replyTo", populate: { path: "sender", select: "name" } });
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, replyTo } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    ...(replyTo && { replyTo }),
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate([
      { path: "sender", select: "name pic" },
      { path: "chat", populate: { path: "users", select: "name pic email" } },
      { path: "replyTo", populate: { path: "sender", select: "name" } }
    ]);

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete a Message (Soft Delete)
//@route           DELETE /api/Message/:messageId
//@access          Protected
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  try {
    let message = await Message.findById(messageId);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to delete this message");
    }

    message.isDeleted = true;
    await message.save();

    message = await message.populate([
      { path: "sender", select: "name pic" },
      { path: "chat", populate: { path: "users", select: "name pic email" } },
      { path: "replyTo", populate: { path: "sender", select: "name" } }
    ]);

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Toggle Star on a Message
//@route           PUT /api/Message/:messageId/star
//@access          Protected
const toggleStarMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  try {
    let message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    const isStarred = message.starredBy.includes(req.user._id);

    if (isStarred) {
      message.starredBy = message.starredBy.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
    } else {
      message.starredBy.push(req.user._id);
    }

    await message.save();

    message = await message.populate([
      { path: "sender", select: "name pic" },
      { path: "chat", populate: { path: "users", select: "name pic email" } },
      { path: "replyTo", populate: { path: "sender", select: "name" } }
    ]);

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     React to a Message
//@route           PUT /api/Message/:messageId/react
//@access          Protected
const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  try {
    let message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Remove reaction if clicking same emoji
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    message = await message.populate([
      { path: "sender", select: "name pic" },
      { path: "chat", populate: { path: "users", select: "name pic email" } },
      { path: "replyTo", populate: { path: "sender", select: "name" } }
    ]);

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage, deleteMessage, toggleStarMessage, reactToMessage };
