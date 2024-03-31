const mongoose = require('mongoose');

const GamesSchema = new mongoose.Schema({
   date: {
       type: String
   },
   score: {
       type: Number,
       default: 0
   },
   mode: {
       type: String,
       enum: ['SinglePlayer', 'Multiplayer']
   },
   playedBy:{
       type: mongoose.Types.ObjectId,
       ref:'Player'
   }
});

module.exports = mongoose.model('Games', GamesSchema);
