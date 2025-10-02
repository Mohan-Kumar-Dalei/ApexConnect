const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");


const authMiddleware = async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({
            message: "unauthorized"
        })
    }
    try {
        const deCoded = jwt.verify(token, process.env.TOKEN);
        const user = await userModel.findById(deCoded._id);
        req.user = user
        next();
    } catch (error) {
        return res.status(401).json({
            message: "unauthorized"
        })
    }
}

module.exports = authMiddleware;