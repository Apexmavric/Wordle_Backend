const { Route } = require('@mui/icons-material');
const  {VerifyToken} = require('../controllers/auth');
const express = require('express');
const Router = express.Router();


Router.route('/verify_token').get(VerifyToken);


module.exports = Router; 