const express = require("express");
const router = express.Router();
const { accessChat, getMessages, getUserChats, deleteChat } = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/authMiddleware");
router.post("/access", authMiddleware, accessChat);
router.get("/:chatId/messages", authMiddleware, getMessages);
router.get("/myChats", authMiddleware, getUserChats);
router.delete("/:chatId/delete", authMiddleware, deleteChat);
module.exports = router;