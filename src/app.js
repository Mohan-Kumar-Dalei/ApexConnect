const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoute = require('./routers/auth.route');
const postRoute = require('./routers/post.route');
const chatRoute = require('./routers/chat.route');
const friendRoute = require('./routers/friend.route');
const path = require("path");

// Middlewares
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://apex-connect.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));


// Routes
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/chats', chatRoute);
app.use('/api/friends', friendRoute);

app.use(express.static(path.join(__dirname, "client/dist")));
app.get("/*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client/dist", "index.html"));
});

module.exports = app;