const Chat = require("../models/chat.model");
const Message = require("../models/message.model");

const accessChat = async (req, res) => {
    try {
        const { userId } = req.body;
        const currentUser = req.user.id;

        if (!userId) return res.status(400).json({ message: "UserId not provided" });

        let chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [currentUser, userId] },
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [currentUser, userId],
                isGroup: true,
            });
        }
        chat = await Chat.findById(chat._id).populate("participants", "name avatar bio");

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const sendMessage = async (req, res) => {
    try {
        const { chatId, content, messageType, mediaUrl } = req.body;
        const sender = req.user.id;

        if (global.io) {
            global.io.to(chatId).emit("newMessage", newMessage);
        }

        const newMessage = await Message.create({
            chatId,
            sender,
            content,
            messageType,
            mediaUrl,
        });

        await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });




        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserChats = async (req, res) => {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const chats = await Chat.find({ participants: req.user._id })
            .populate("participants", "name avatar bio") // "User" model ka naam
            .populate("lastMessage");
        res.status(200).json(chats);
    } catch (error) {
        console.error("MyChats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

const deleteChat = async (req, res) => {
    try {
        const chatId = req.params.chatId; // string _id

        const deletedChat = await Chat.findByIdAndDelete(chatId);
        if (!deletedChat) return res.status(404).json({ message: "Chat not found" });

        // Delete all messages in this chat
        await Message.deleteMany({ chatId });

        res.status(200).json({ message: "Chat deleted successfully", chatId });
    } catch (error) {
        console.error("Delete Chat Error:", error);
        res.status(500).json({ message: error.message });
    }
};




module.exports = {
    accessChat,
    sendMessage,
    getMessages,
    getUserChats,
    deleteChat
}