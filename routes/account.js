const express = require('express')
const router = express.Router()
const User = require('../models/User')
const DailyUser = require('../models/dailyUser')
const XLSX = require('xlsx');
const path = require('path')
const Counter = require('../models/Counter'); // Импортируем модель Counter



router.get('/reg', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/reg.html'))
})

router.get('/users', async (req, res) => {
    try {
        const users = await User.getAllUsers();
        res.json({ success: true, users: users });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ success: false, msg: "Could not retrieve users", error: err.message });
    }
});




router.post('/reg', async (req, res) => {
    try {
        const { name, number, command } = req.body;

        // Проверяем, зарегистрирован ли пользователь сегодня
        const existingDailyUser = await DailyUser.findOne({ number, date: { $gte: new Date().setHours(0, 0, 0, 0) } });
        if (existingDailyUser) {
            return res.json({ success: false, msg: "Сіз бүгін номер алып қойдыңыз", number: existingDailyUser.number });
        }

        // Атомарно увеличиваем счетчик
        const counter = await Counter.findOneAndUpdate(
            { _id: 'userId' }, // Идентификатор счетчика
            { $inc: { seq: 1 } }, // Увеличиваем значение на 1
            { new: true, upsert: true } // Возвращаем обновленный документ и создаем, если не существует
        );

        const usersNumber = counter.seq; // Получаем новое значение счетчика

        // Создаем нового пользователя для сегодняшнего дня
        const newUserData = { name, number, command };
        const newDailyUser = await DailyUser.create(newUserData);

        // Проверяем, есть ли пользователь в основной коллекции (User)
        const existingMainUser = await User.findOne({ number });
        if (!existingMainUser) {
            // Если пользователя нет в основной коллекции, добавляем его
            await User.create(newUserData);
        }

        res.json({ success: true, msg: "User registered", number: usersNumber });
        // alert("Сіздің саныңыз: ", usersNumber)
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, msg: "User not registered", error: err.message });
    }
});

router.post('/reset', async (req, res) => {
    try {
        // Очищаем коллекцию DailyUser
        await DailyUser.deleteMany({});

        // Сбрасываем счетчик в коллекции Counter
        await Counter.findOneAndUpdate(
            { _id: 'userId' }, // Идентификатор счетчика
            { $set: { seq: 0 } }, // Устанавливаем значение счетчика в 0
            { upsert: true } // Создаем документ, если он не существует
        );

        res.json({ success: true, msg: "Деректер сәтті өшірілді!" });
    } catch (err) {
        console.error('Reset error:', err);
        res.status(500).json({ success: false, msg: "Data reset failed", error: err.message });
    }
});

// Роут для сброса данных
router.post('/resetMain', async (req, res) => {
    try {
        // Очищаем обе коллекции
        await User.deleteMany({});

        // Сбрасываем счетчик
        count = 0;

        res.json({ success: true, msg: "Деректер сәтті өшірілді!" });
    } catch (err) {
        console.error('Reset error:', err);
        res.status(500).json({ success: false, msg: "Data reset failed", error: err.message });
    }
});


router.get('/dashboard', async (req, res) => {
    try {
        // Получаем всех пользователей
        const allUsers = await User.find({}).lean();
        const counter = await Counter.findOne({ _id: 'userId' });


        // Отправляем данные на фронтенд
        res.render('dashboard', {
            allUsers: allUsers,
            count: counter.seq // Общее количество пользователей
        });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ success: false, msg: "Could not retrieve users", error: err.message });
    }
});


router.get('/download/daily', async (req, res) => {
    try {
        const dailyUsers = await DailyUser.find({ date: { $gte: new Date().setHours(0, 0, 0, 0) } }).lean();
        if (dailyUsers.length === 0) {
            return res.status(404).json({ success: false, msg: "No daily users found" });
        }

        // Оставляем только name и number
        const filteredDailyUsers = dailyUsers.map(user => ({
            name: user.name,
            number: user.number
        }));

        const worksheet = XLSX.utils.json_to_sheet(filteredDailyUsers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DailyUsers");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="daily_users.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error('Error downloading daily users:', err);
        res.status(500).json({ success: false, msg: "Failed to download daily users", error: err.message });
    }
});


router.get('/download/all', async (req, res) => {
    try {
        const allUsers = await User.find({}).lean();
        if (allUsers.length === 0) {
            return res.status(404).json({ success: false, msg: "No users found" });
        }

        // Оставляем только name и number
        const filteredAllUsers = allUsers.map(user => ({
            name: user.name,
            number: user.number
        }));

        const worksheet = XLSX.utils.json_to_sheet(filteredAllUsers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AllUsers");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="all_users.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error('Error downloading all users:', err);
        res.status(500).json({ success: false, msg: "Failed to download all users", error: err.message });
    }
});


module.exports = router