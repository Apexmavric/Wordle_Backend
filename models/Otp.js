const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
    otp: { type: String, required: true },
    issuedFor: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now, expires: '1m' },
});

otpSchema.pre('save', async function(next) {
    if (this.isModified('otp')) {
        const salt = await bcrypt.genSalt(10);
        this.otp = await bcrypt.hash(this.otp, salt);
    }
    next();
});

otpSchema.methods.isValidOtp = async function(enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otp);
};

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
