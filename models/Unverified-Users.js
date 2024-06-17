const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const unverifiedUsersSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now }
});

unverifiedUsersSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

unverifiedUsersSchema.methods.createJwt = function () {
    const token = jwt.sign({ playerId: this._id, playerName: this.name , playerEmail: this.email}, process.env.JWT_SECRET, { expiresIn: `${process.env.LINK_LIFE_TIME}`});
    return token;
};
module.exports =  mongoose.model('Unverified-Users', unverifiedUsersSchema);
