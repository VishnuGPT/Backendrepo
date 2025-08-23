const adminController = require('../controllers/adminController.js');

const express = require('express');
const router = express.Router();


//Sign In Route
router.post('/signin', adminController.SignIn);
module.exports = router;
