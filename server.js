require('dotenv').config();
const app = require('./src/app');
const PORT = 3000;
const initSocketServer = require('./src/socket/socket');
const httpServer = require('http').createServer(app);
initSocketServer(httpServer)
const connectDB = require('./src/db/db');
connectDB();





httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})