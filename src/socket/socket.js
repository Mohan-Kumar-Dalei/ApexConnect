const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");

const initSocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://apex-connect.netlify.app"
            ],
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        }
    });

    io.use(async (socket, next) => {
        // socket middleware for authentication
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
        if (!cookies.token) return next(new Error("Authentication error: No token provided"));

        try {
            const decoded = jwt.verify(cookies.token, process.env.TOKEN);
            const user = await userModel.findById(decoded._id);
            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on('connection', (socket) => {

        // make io globally available
        global.io = io;
        if (!socket.user) return socket.disconnect(true);
        console.log('New user connected', socket.user.name, socket.user._id);

        socket.join(socket.user._id.toString());

        socket.on("follow_user", ({ to }) => {
            io.to(to).emit("new_follower", {
                from: socket.user._id,
                name: socket.user.name
            });
        });



        socket.on("post_liked", async ({ postId, action, likesCount, postOwnerId, likerId }) => {
            // Update liker ko
            io.to(likerId).emit("post_liked_update", { postId, likesCount });
        });



        // Join specific chat room
        socket.on("joinUserChats", (chatIds) => {
            chatIds.forEach((chatId) => socket.join(chatId.toString()));
        });


        socket.on("sendMessage", (data) => {
            const { chatId, message } = data;
            io.to(chatId).emit("newMessage", message);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected', socket.user.name);
        });
    });

    return io;
}

module.exports = initSocketServer;
