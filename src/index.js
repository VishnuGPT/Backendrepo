require('dotenv').config({path: require('path').resolve(__dirname, '../.env')});//.env not in /src
const express = require('express');
const {connectRedis} = require('./config/redis');
const sequelize = require('./config/database');

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ['http://localhost:3000', 'https://logixjunction.com', 'http://localhost:5174','https://logix-frontend-sigma.vercel.app','https://www.logixjunction.com'];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not an allowed origin'));
    }
  },
  credentials: true,
})); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.get('/', (req, res) => {
  res.status(200).send('Ultron backend works fine 💥');
});


// Database connection and server start
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Ultron server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};


startServer();
