const express = require("express");
const router = express.Router();
const {
    followUser,
    unfollowUser
} = require("../controllers/friend.controller");
const authMiddleware = require("../middleware/authMiddleware");

// Friend Request Routes
router.post("/follow", authMiddleware, followUser);
router.post("/unfollow", authMiddleware, unfollowUser);

module.exports = router;
