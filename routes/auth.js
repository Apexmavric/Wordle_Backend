const express = require('express');
const Router = express.Router();
const {Register, Login,
    checkUserEmail, checkUserName,
    VerifyLink,
    GenerateOtp,
    PasswordSet,
    verifyOtp,
    RegenerateOtp
} = require('../controllers/auth');

Router.route('/register').post(Register);
Router.route('/login').post(Login);
Router.route('/checkusername').post(checkUserName);
Router.route('/checkuseremail').post(checkUserEmail);
Router.route('/verify-link').post(VerifyLink);
Router.route('/generate-otp').post(GenerateOtp);
Router.route('/change-password').post(PasswordSet);
Router.route('/verify-otp').post(verifyOtp);
Router.route('/regenerate-otp').post(RegenerateOtp);

module.exports = Router;