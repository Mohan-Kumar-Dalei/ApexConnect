const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userModel = require("../models/user.model");
const uploadToImageKit = require('../services/imageKitService');
const { v4: uuidv4 } = require('uuid')
const sendEmail = require("../utils/sendEmail");


// Register
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await userModel.findOne({
            email
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            name, email, password: hashedPassword
        });

        const token = jwt.sign({
            _id: user._id
        }, process.env.TOKEN, { expiresIn: '24h' });

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({
            email
        })
        if (!user) {
            return res.status(401).json({
                message: "Invalid Username"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid Password"
            })
        }
        const token = jwt.sign({
            _id: user._id
        }, process.env.TOKEN, { expiresIn: '24h' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        res.status(200).json({
            message: "Login Successful",
            user
        })
    } catch (error) {
        res.status(500).json({
            message: "Server Error", error: error.message
        })
    }
};

// Logout
const logout = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        res.status(200).json({
            message: "User fetched successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// Get user by id

const getUserById = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// get all users after login and register
const getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const users = await userModel.find({ _id: { $ne: currentUserId } }).select("-password");

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



// Update profile
const updateProfile = async (req, res) => {

    try {
        const { name, bio } = req.body;
        if (bio) {
            const wordCount = bio.trim().split(/\s+/).length;
            if (wordCount > 50) {
                return res.status(400).json({ message: "Bio cannot exceed 50 words" });
            }
        }

        const file = req.file
        let avatarUrl;
        if (file) {
            const uploadResponse = await uploadToImageKit(file.buffer, `${uuidv4()}`);
            avatarUrl = uploadResponse.url;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            {
                ...(name && { name }),
                ...(bio && { bio }),
                ...(avatarUrl && { avatar: avatarUrl })
            },
            { new: true, runValidators: true }
        ).select("-password");

        res.json({ message: "Profile updated", user: updatedUser });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }

};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
        await user.save();

        // reset URL (frontend link)
        const resetUrl = `${process.env.FRONTEND_URL}/api/auth/reset-password/${resetToken}`;

        const message = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password (valid for 15 minutes):</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    `;

        await sendEmail(user.email, "Password Reset Request", message);

        res.json({ message: "Reset link sent to your email if you not see then check you spam folder" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Reset password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    getUserById,
    getAllUsers,
    updateProfile,
    forgotPassword,
    resetPassword,
};