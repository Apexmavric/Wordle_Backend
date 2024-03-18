
const {BadRequestError, UnauthenticatedError} = require('../errors');
const jwt = require('jsonwebtoken');
const authHandler = async(req, res, next)=>{
    const authheader = req.headers.authorization;
    if(!authheader || !authheader.startsWith('Bearer')){
        throw new BadRequestError('Invalid Request');
    }
    const token = authheader.split(' ')[1];
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {playerId : payload.id, playerName:payload.name};
        next();
    }
    catch(err){
        throw new UnauthenticatedError('Authentication Invalid');
    }
}

module.exports = authHandler;