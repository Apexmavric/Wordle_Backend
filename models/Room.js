const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    admin: {
        type: String,
        required: true
    },
    players: [
        {
            playerName: {
                type: String
            },
            score: {
                type: Number,
                default: 0 // Default score value
            }
        }
    ]
});

module.exports =  mongoose.model('Room', RoomSchema);
