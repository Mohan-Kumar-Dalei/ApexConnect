const userModel = require("../models/user.model");

// Follow
const followUser = async (req, res) => {
    try {
        const { userIdToFollow } = req.body;
        const userId = req.user.id;

        if (userId === userIdToFollow) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const user = await userModel.findById(userId);
        const targetUser = await userModel.findById(userIdToFollow);

        if (!targetUser) return res.status(404).json({ message: "User not found" });

        if (user.following.includes(userIdToFollow)) {
            return res.status(400).json({ message: "Already following" });
        }

        user.following.push(userIdToFollow);
        targetUser.followers.push(userId);

        // socket notification
        if (global.io) {
            global.io.to(userIdToFollow).emit("new_follower", {
                followerId: userId,
                name: user.name
            });
        }
        await user.save();
        await targetUser.save();

        res.status(200).json({ message: "Followed successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Unfollow
const unfollowUser = async (req, res) => {
    try {
        const { userIdToUnfollow } = req.body;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        const targetUser = await userModel.findById(userIdToUnfollow);

        if (!targetUser) return res.status(404).json({ message: "User not found" });

        user.following = user.following.filter(
            (id) => id.toString() !== userIdToUnfollow
        );
        targetUser.followers = targetUser.followers.filter(
            (id) => id.toString() !== userId
        );

        await user.save();
        await targetUser.save(); 

        res.status(200).json({ message: "Unfollowed successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { followUser, unfollowUser };