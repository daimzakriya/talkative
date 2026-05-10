const express = require("express");
const {
  allMessages,
  sendMessage,
  deleteMessage,
  toggleStarMessage,
  reactToMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/:messageId").delete(protect, deleteMessage);
router.route("/:messageId/star").put(protect, toggleStarMessage);
router.route("/:messageId/react").put(protect, reactToMessage);

module.exports = router;
