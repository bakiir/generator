const mongoose = require('mongoose');

const dailyUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    number: { type: String, required: true },
    command: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const DailyUser = mongoose.model('DailyUser', dailyUserSchema);
module.exports = DailyUser;