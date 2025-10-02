const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
            .then(() => {
                console.log('Connected to MongoDB');
            })
            .catch((err) => {
                console.log('connection error', err);
            })
    } catch (error) {
        console.log('failed to connect MongoDB', error);
    }
}

module.exports = connectDB;