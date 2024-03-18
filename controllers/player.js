const {StatusCodes} = require('http-status-codes');
const getDetails = async(req, res)=>{
    res.status(StatusCodes.OK).send('Get details has been called');
}
const addFriends = async(req, res)=>{
    res.status(StatusCodes.OK).send('Get AddFriends has been called');
}
const updateScore = async(req, res)=>{
    res.status(StatusCodes.OK).send('Get UpdateScore has been called');
}
module.exports = {
    getDetails,
    addFriends,
    updateScore
}