const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
        },
        bio: {
            type: String,
            default: "",
        },
        avatar: {
            type: String,
            default: "U"
        }, // profile picture (ImageKit URL)

        followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        following: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }], // pending requests

        // 🔹 Forgot password fields
        resetPasswordToken: {
            type: String
        },
        resetPasswordExpire: {
            type: Date
        }
    },
    { timestamps: true }
);

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;

