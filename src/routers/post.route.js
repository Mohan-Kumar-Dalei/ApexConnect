const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() })
const {
    createPost,
    getAllPosts,
    likePost,
    addComment,
    getComments,
    deletePost,
} = require("../controllers/post.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, upload.array("images", 5), createPost); 
router.get("/getAll", authMiddleware, getAllPosts);
router.post("/:postId/like", authMiddleware, likePost);
router.post("/:postId/comment", authMiddleware, addComment);
router.get("/:postId/all-comments", authMiddleware, getComments);
router.delete("/:postId/delete", authMiddleware, deletePost);

module.exports = router;