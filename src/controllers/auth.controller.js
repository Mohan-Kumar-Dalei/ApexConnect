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

        const resetPasswordTemplate = (userName, resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 0;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    h2 {
      color: #333333;
    }
    p {
      color: #555555;
    }
    a.button {
      display: inline-block;
      padding: 12px 20px;
      margin-top: 20px;
      color: #fff;
      background-color: #4f46e5;
      border-radius: 5px;
      text-decoration: none;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Hello ${userName},</h2>
    <p>You requested a password reset. Click the button below to reset your password. This link is valid for 15 minutes only.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p class="footer">If you did not request this, ignore this email.</p>
  </div>
</body>
</html>
`;
        const htmlContent = resetPasswordTemplate(user.name, resetUrl);


        await sendEmail(user.email, "Password Reset Request", htmlContent);

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