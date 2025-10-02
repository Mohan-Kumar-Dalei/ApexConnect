const postModel = require("../models/post.model.js");
const uploadToImageKit = require("../services/imageKitService.js");
const { v4: uuidv4 } = require('uuid')
const mongoose = require("mongoose");
const userModel = require("../models/user.model.js");

const createPost = async (req, res) => {
    try {
        const { description, link, hashtags } = req.body;
        const files = req.files || [];

        let imageUrls = [];

        // 1️⃣ Upload media if any
        if (files.length > 0) {
            const uploadedResults = await Promise.all(
                files.map(file => uploadToImageKit(file.buffer, `${uuidv4()}`))
            );
            imageUrls = uploadedResults.map(result => result.url);
        }

        // 2️⃣ Create post with media URLs
        const newPost = await postModel.create({
            userId: req.user.id,
            description,
            images: imageUrls,
            link,
            hashtags,
        });
        await newPost.populate("userId", "name avatar bio");

        // 3️⃣ Respond to frontend with complete post
        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: newPost,
        });

    } catch (error) {
        console.error("Create Post Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



const getAllPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const posts = await postModel.find()
            .populate("userId", "name avatar bio").lean();;

        const updatedPosts = posts.map(post => ({
            ...post,
            likedByCurrentUser: post.likes.some(id => id.toString() === userId)
        }));
        res.status(200).json({
            posts: updatedPosts,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(postId))
            return res.status(400).json({ message: "Invalid Post ID" });

        const post = await postModel.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        let action;
        if (post.likes.some((id) => id.toString() === userId)) {
            // Unlike
            post.likes = post.likes.filter((id) => id.toString() !== userId);
            action = "unlike";
        } else {
            // Like
            post.likes.push(userId);
            action = "like";
        }

        await post.save();

        // Emit via socket (global.io should be your socket.io instance)
        if (global.io) {
            // Emit to everyone connected
            global.io.emit("post_liked", {
                postId,
                userId,
                likesCount: post.likes.length,
                action
            });
        }
        const likedByCurrentUser = post.likes.some(id => id.toString() === userId);

        res.status(200).json({
            message: `Post ${action}d successfully`,
            likesCount: post.likes.length,
            action,
            likedByCurrentUser
        });
    } catch (error) {
        console.error("LikePost Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment || comment.trim() === "")
            return res.status(400).json({ message: "Comment cannot be empty" });

        if (!mongoose.Types.ObjectId.isValid(postId))
            return res.status(400).json({ message: "Invalid Post ID" });

        const post = await postModel.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const newComment = { userId, comment, createdAt: new Date() };
        post.comments.push(newComment);
        await post.save();

        res.status(201).json({
            message: "Comment added",
            comments: post.comments,
        });
    } catch (error) {
        console.error("AddComment Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


const getComments = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(postId))
            return res.status(400).json({ message: "Invalid Post ID" });

        const post = await postModel.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const formattedComments = await Promise.all(
            post.comments.map(async (item) => {
                let user = null;
                if (mongoose.Types.ObjectId.isValid(item.userId)) {
                    user = await userModel.findById(item.userId).select("name avatar");
                }

                return {
                    id: item._id,
                    comment: item.comment,
                    createdAt: item.createdAt,
                    userName: user?.name || "User",
                    userAvatar: user?.avatar || "",
                };
            })
        );

        res.status(200).json({
            postId: post._id,
            comments: formattedComments,
        });
    } catch (error) {
        console.error("GetComments Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await postModel.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await post.deleteOne();

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPost,
    getAllPosts,
    likePost,
    addComment,
    getComments,
    deletePost,
}