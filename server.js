const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const passport = require('passport')
const path = require('path')
const config = require('./config/db')
const account = require('./routes/account')
const router = require('./routes/account')
const Counter = require('./models/Counter');


const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(router) 

// Set up middleware BEFORE routes
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // Add this for form submissions

// Serve static files
app.use(express.static(path.join(__dirname, 'views')))

// Routes
app.get('/', (req, res) => {
    res.send("Main page")
})

app.use('/account', account)

// Инициализация счетчика (выполняется один раз при запуске сервера)
async function initializeCounter() {
    try {
        await Counter.findOneAndUpdate(
            { _id: 'userId' }, // Идентификатор счетчика
            { $setOnInsert: { seq: 0 } }, // Устанавливаем начальное значение, если документ не существует
            { upsert: true, new: true } // Создаем документ, если он не существует
        );
        console.log("Counter initialized.");
    } catch (err) {
        console.error("Error initializing counter:", err);
    }
}

// Вызов функции инициализации
initializeCounter();

// MongoDB connection
mongoose.connect(config.db)
mongoose.connection.on('connected', () => {
    console.log('Successfully connected to MongoDB')
})
mongoose.connection.on('error', (err) => {
    console.log('Error connecting to MongoDB:', err)
})

app.listen(port, () => {
    console.log("Server is running on port " + port)
})