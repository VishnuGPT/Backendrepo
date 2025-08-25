// const { Sequelize } = require('sequelize');
// require('../models/index.js')
// require('dotenv').config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: 'mysql',
//     logging: false,
//     retry: {
//       match: [/ECONNREFUSED/, /ETIMEDOUT/],
//       max: 3 // Maximum retry attempts
//     },
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
//   }
// );

// // Test connection and sync schema
// sequelize.authenticate()
//   .then(() => {
//     console.log('Database connected!');
//     // Sync all models with database
//     // In development, you might want to use { alter: true }
//     // In production, you should use { alter: false } or handle migrations properly
//     const syncOptions = process.env.NODE_ENV === 'production' 
//       ? { alter: false } 
//       : { alter: true };
    
//     return sequelize.sync({ force: true });
//   })
//   .then(() => {
//     console.log('Database schema synchronized!');
//   })
//   .catch(err => console.error('Connection error:', err));

// module.exports = sequelize;



const { Sequelize } = require('sequelize');
require('dotenv').config();
require('../models/index.js'); // load models + associations

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV !== 'production', // log queries in dev only
    retry: {
      match: [/ECONNREFUSED/, /ETIMEDOUT/],
      max: 3,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected!');

    // ✅ Only create tables if they don’t exist (no deletes, no alters)
    await sequelize.sync();
    console.log('✅ Tables are synced (no tables dropped)');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
})();

module.exports = sequelize;
