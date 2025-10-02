const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "chat",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
        },
        messageType: {
            type: String,
            enum: ["text", "image", "video", "file"],
            default: "text",
        },
        mediaUrl: {
            type: String,
        },
    },
    { timestamps: true }
);

const messageModel = mongoose.model("message", messageSchema);
module.exports = messageModel;

