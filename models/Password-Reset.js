const mongoose = require('mongoose');
const PasswordResetSchema = new mongoose.Schema({
    token: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now, expires: process.env.PASSWORD_SET_VALIDITY },
});

                                
module.exports =  mongoose.model('Password-Reset', PasswordResetSchema);