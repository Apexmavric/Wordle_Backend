const express = require('express');
const Router = express.Router();
const {Register, Login} = require('../controllers/auth');

Router.route('/register').post(Register);
Router.route('/login').post(Login);

module.exports = Router;