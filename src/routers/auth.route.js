const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() })
const {
    register,
    login,
    logout,
    getCurrentUser,
    getUserById,
    getAllUsers,
    updateProfile,
    forgotPassword,
    resetPassword,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/authMiddleware");


// auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/user", authMiddleware, getCurrentUser);
router.get("/user/:id", authMiddleware, getUserById);
router.get("/users", authMiddleware, getAllUsers);
router.put("/update", authMiddleware, upload.single('avatar'), updateProfile);



// forgot password 
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);




module.exports = router;
