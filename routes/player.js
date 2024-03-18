const express = require('express');
const Router = express.Router();
const {getDetails} = require('../controllers/player');

Router.route('/details').get(getDetails);
module.exports = Router;