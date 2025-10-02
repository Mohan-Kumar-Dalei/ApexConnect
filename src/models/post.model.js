const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        images: [
            {
                type: String,
            },
        ],

        link: {
            type: String,
        },

        hashtags: [
            {
                type: String,
                lowercase: true,
                trim: true,
            },
        ],

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        comments: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                comment: {
                    type: String,
                    required: true,
                    trim: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

const postModel = mongoose.model('post', postSchema);
module.exports = postModel;
