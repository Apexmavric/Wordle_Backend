const express = require('express');
const Router = express.Router();
const {reset, verify, getGameDetails} = require('../controllers/game');

Router.route('/reset').get(reset);
Router.route('/verify').post(verify);
Router.route('/details').get(getGameDetails);
module.exports = Router;