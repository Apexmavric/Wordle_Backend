const express = require('express');
const Router = express.Router();
const {reset, verify} = require('../controllers/game');

Router.route('/reset').get(reset);
Router.route('/verify').post(verify);
module.exports = Router;