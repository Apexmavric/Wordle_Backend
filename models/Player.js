const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const PlayerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a username'],
        maxlength: 30,
        minlength: 4,
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a Password'],
    },
    friends: [{
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player'
        },
    }],
    data: {
        type: Buffer,
        default: () => {
            const imagePath = path.join(__dirname, './default-pic.jpg');
            return fs.readFileSync(imagePath);
        }
    },
    contentType: {
        type: String
    },
    word: {
        type: String
    },
    hint: {
        type: String
    },
    stats: {
        score: {
            type: Number,
            default: 0
        },
        maxScore: {
            type: Number,
            default: 0
        },
        maxStreak: {
            type: Number,
            default: 0
        },
        gamesPlayed: {
            type: Number,
            default: 0
        },
        currentStreak: {
            type: Number,
            default: 0
        },
        wins: {
            type: Number,
            default: 0
        },
        gameHistory: [{
            type: mongoose.Types.ObjectId,
            ref: 'Games',
        }]
    }
});


PlayerSchema.methods.createJwt = function () {
    const token = jwt.sign({ playerId: this._id, playerName: this.name }, process.env.JWT_SECRET, { expiresIn: `${process.env.LIFE_TIME}` });
    return token;
};

PlayerSchema.methods.comparePassword = async function (candidatepassword) {
    const issame = await bcrypt.compare(candidatepassword, this.password);
    return issame;
};

module.exports = mongoose.model('Player', PlayerSchema);
