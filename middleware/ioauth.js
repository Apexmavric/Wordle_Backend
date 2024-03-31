
const {BadRequestError, UnauthenticatedError} = require('../errors');
const jwt = require('jsonwebtoken');
const authHandler = async(socket, next)=>{
    const token = socket.handshake.auth.token;
    if(!token)
    {
        throw new BadRequestError('Token is missing!');
    }
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.player = 
    }
    catch{
        throw new UnauthenticatedError('Authentication Invalid');   
    }
}

module.exports = authHandler;