const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\+?[0-9]{10,15}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    command: {
        type: String,
        required: true
    }
});

// Экспорт модели
const User = mongoose.model('User', UserSchema);
module.exports = User;

// Получить пользователя по номеру
module.exports.getUserByNumber = async function (number) {
    try {
        return await User.findOne({ number });
    } catch (err) {
        console.error("Ошибка при поиске пользователя:", err);
        return null;
    }
};

// Добавить пользователя
module.exports.addUser = async function (newUserData) {
    try {
        let newUser = new User(newUserData);
        return await newUser.save();
    } catch (err) {
        console.error("Ошибка при добавлении пользователя:", err);
        throw err;
    }
};

module.exports.getAllUsers = async function () {
    try {
        return await User.find({});
    } catch (err) {
        console.error("Ошибка при получении всех пользователей:", err);
        throw err;
    }
};
