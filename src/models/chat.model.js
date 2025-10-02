const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isGroup: {
            type: Boolean,
            default: false,
        },
        chatName: {
            type: String,
            trim: true,
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "message",
        },
    },
    { timestamps: true }
);
const chatModel = mongoose.model("chat", chatSchema);
module.exports = chatModel;
