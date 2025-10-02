const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");
const Message = require("../models/message.model");
const Chat = require("../models/chat.model");

const initSocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://apexconnect.onrender.com"
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


        // Handle sending a chat message
        socket.on("sendMessage", async (data) => {
            const { chatId, content, messageType, mediaUrl } = data;
            const sender = socket.user._id;

            // 1️⃣ Create a temporary message (for client instant display)
            const tempMessage = {
                _id: "temp-" + Date.now(),
                chatId,
                sender,
                content,
                messageType,
                mediaUrl,
                createdAt: new Date(),
            };

            // 2️⃣ Emit immediately to all participants
            io.to(chatId).emit("newMessage", tempMessage);

            try {
                // 3️⃣ Save in DB asynchronously
                const savedMessage = await Message.create({
                    chatId,
                    sender,
                    content,
                    messageType,
                    mediaUrl,
                });

                await Chat.findByIdAndUpdate(chatId, { lastMessage: savedMessage._id });

                // 4️⃣ Emit to replace temp message with saved message
                io.to(chatId).emit("updateMessage", {
                    tempId: tempMessage._id,
                    savedMessage,
                });
            } catch (error) {
                console.error("Message save error:", error);
                io.to(chatId).emit("messageError", {
                    tempId: tempMessage._id,
                    error: error.message,
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected', socket.user.name);
        });
    });

    return io;
}

module.exports = initSocketServer;
