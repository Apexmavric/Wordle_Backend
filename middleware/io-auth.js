
const {BadRequestError, UnauthenticatedError} = require('../errors');
const jwt = require('jsonwebtoken');
const ioauth = async(socket, next)=>{
    const token = socket.handshake.auth.token;
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.player = {playerId : payload.playerId, playerName:payload.playerName};
        next();
    }
    catch(err){
    }
}

module.exports = ioauth;