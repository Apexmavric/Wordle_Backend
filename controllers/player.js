const {StatusCodes} = require('http-status-codes');
const Player = require('../models/Player');
const {UnauthenticatedError,BadRequestError} = require('../errors');
const getDetails = async(req, res)=>{
    const {playerId, playerName} = req.player;
    const player = await Player.findOne({name : playerName , _id : playerId});
    if(!player)
    {
        throw new BadRequestError('Player doesnt exist');
    }
    const {name, score, friends} = player;
    const newPlayer = {name, score, friends};
    res.status(StatusCodes.OK).json({playerDetails : newPlayer});
}
const searchRecommendation = async(req, res)=>{
    console.log('search');
    const {name} = req.body;
    console.log(name);
    let player;
    if(name)
    {
        player = await Player.find({name : { $regex : `${name}`, $options : 'i'} });
    }
    if(!player)
    {
        throw new BadRequestError('Player doesnt exist');
    }
    const newPlayer = player.map(e=>{
    const {name, _id} = e;
        return {playerName : name, playerId : _id} ;
     })
     console.log(newPlayer);
    res.status(StatusCodes.OK).json({playerDetails : newPlayer});
}
const getAllPlayerDetails = async(req, res)=>{
    console.log('All Player Details');
    const player = await Player.find().sort({score : -1});
    const newPlayer = player.map(e=>{
       const {name, score} = e;
       return {playerName : name, playerScore : score};
    })
    console.log(newPlayer);
    res.status(StatusCodes.OK).json({playerDetails : newPlayer});
}
const addFriends = async(req, res)=>{
    const {playerId, playerName} = req.player;
    const friendName = req.body.name;
    if(playerName === friendName){
        throw BadRequestError('User and friend are same!!')
    }
    if(!friendName)
    {
        throw BadRequestError(`Friend's name cannot be empty !!`);
    }
    if(!playerName)
    {
        throw BadRequestError(`Players's name cannot be empty !!`);
    }   
    const friend = await Player.findOne({name : friendName});
    if(!friend)
    {
        throw BadRequestError(`Such a friend doesnt exist`);
    }  
    const { _id: friendId } = friend;
    let player = await Player.findOne({ name: playerName });
    if (!player.friends.includes(friendId)) {
        player.friends.push(friendId);
        player = await Player.findByIdAndUpdate(playerId, { friends: player.friends }, { new: true });
    }
    res.status(StatusCodes.CREATED).json({ player });

}

const deleteFriend = async (req, res) => {
    const { playerId, playerName } = req.player;
    const friendId = req.body.id;
    if (!friendId) {
        throw BadRequestError(`Friend's name cannot be empty !!`);
    }
    if (!playerName) {
        throw BadRequestError(`Player's name cannot be empty !!`);
    }
    const friend = await Player.findOne({ _id : friendId });
    if (!friend) {
        throw BadRequestError(`Such a friend doesn't exist`);
    }
    let player = await Player.findOne({ name: playerName });
    if (player.friends.includes(friendId)) {
        player.friends = player.friends.filter(id => id.toString() !== friendId.toString());
        player = await Player.findByIdAndUpdate(playerId, { friends: player.friends }, { new: true });
    }
    res.status(StatusCodes.OK).json({player});
};

const updateScore = async(req, res)=>{  
    const {playerId} = req.player;
    const {score} = req.body;
    const player = await Player.findOne({_id : playerId});
    player.score += Number(score);
    const updatedPlayer = await Player.findByIdAndUpdate(playerId, {score : player.score}, {new : true});
    res.status(StatusCodes.OK).json({updatedPlayer});
}

const getImage = async(req, res)=>{
    console.log(`get-image`);
    const {playerId} = req.player;
    const player = await Player.findById(playerId);
    console.log(player);
    if(!player){
        throw BadRequestError('Such a player doesnt exist');
    }
    res.set('Content-Type', player.contentType);
    res.send(player.data);
}

const uploadImage = async(req, res)=>{
   
    const {playerId} = req.player;
    const player = await Player.findByIdAndUpdate(playerId, {data : req.file.buffer , contentType:req.file.mimetype}, {new: true});
    if(!player){
        throw BadRequestError('Player doesnt exist');
    }
    res.status(200).json({playerId});
}
module.exports = {
    getDetails,
    addFriends,
    updateScore,
    deleteFriend,
    getAllPlayerDetails,
    searchRecommendation,
    getImage,
    uploadImage
}