const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Идентификатор счетчика
    seq: { type: Number, default: 0 }, // Текущее значение счетчика
});

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;