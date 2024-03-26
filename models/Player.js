const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const PlayerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, 'Please provide a username'],
        maxlength:30,
        unique:true
    },
    password:{
        type:String,
        required:[true, 'Please provide a Password'],
        maxlength:50
    },
    score:{
        type:Number,
        default:0,
        maxlength:50
    },
    friends: [{
        type: mongoose.Types.ObjectId,
        ref: 'Player',
    }],
    data:{
        type:Buffer,
        default: () => {
            const imagePath = path.join(__dirname, './default-pic.jpg');
            return fs.readFileSync(imagePath);
        }
    },
    contentType:{
        type:String
    }
    ,
    word:{
        type: String
    },
    hint:{
        type: String
    },
});

PlayerSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    if (!this.friends.includes(this._id)) {
        this.friends.push(this._id);
    }
    next();
})
PlayerSchema.methods.createJwt = function(){
    console.log(this._id);
    const token = jwt.sign({playerId : this._id, playerName : this.name}, process.env.JWT_SECRET, {expiresIn:`${process.env.LIFE_TIME}`});
    return token;
}

PlayerSchema.methods.comparePassword = async function(candidatepassword){
    const issame = await bcrypt.compare(candidatepassword,this.password);
    return issame;
}


module.exports = mongoose.model('Player', PlayerSchema);