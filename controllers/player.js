const {StatusCodes} = require('http-status-codes');
const getDetails = async(req, res)=>{
    res.status(StatusCodes.OK).send('Get details has been called');
}

module.exports = {
    getDetails
}