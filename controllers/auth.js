
const {StatusCodes} = require('http-status-codes');
const Player = require('../models/Player');
const {BadRequestError, UnauthenticatedError} = require('../errors');

const Register = async(req, res)=>{
    const {name, password} = req.body;
    const user = await Player.create({name : name , password : password});
    const token = user.createJwt();
    res.status(StatusCodes.CREATED).json({player : {playerId : user._id, playerName : user.name}, token});
} 

const Login = async(req, res)=>{
    const {name, password} = req.body;
    const user = await Player.findOne({name});
    if(!user)
    {
        throw new BadRequestError('User does not exist');
    }
    const isSame = await user.comparePassword(password);
    if(!isSame){
        throw new UnauthenticatedError('Invalid Password !!');
    }
    const token = user.createJwt();
    res.status(StatusCodes.CREATED).json({player : {playerId : user._id, playerName : user.name}, token});
}   


module.exports = {Register, Login};