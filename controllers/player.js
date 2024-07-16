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
    const {name, score, friends, stats} = player;
    const newPlayer = {name, score, friends, stats};
    res.status(StatusCodes.OK).json({playerDetails : newPlayer});
}
const searchRecommendation = async(req, res)=>{
    const {name} = req.body;
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
    res.status(StatusCodes.OK).json({playerDetails : newPlayer});
}
const getAllPlayerDetails = async(req, res)=>{
    // console.log('All Player Details');
    const player = await Player.find().sort({"stats.score" : -1});
    const newPlayer = player.map(e=>{
       return {playerName : e.name, playerScore : e.stats.score};
    })
    res.status(StatusCodes.OK).json({playerDetails : newPlayer});
}
const addFriends = async (req, res) => {
    const { playerId, playerName } = req.player;
    const friendName = req.body.name;

    if (!friendName) {
        throw new BadRequestError(`Friend's name cannot be empty !!`);
    }
    if (!playerName) {
        throw new BadRequestError(`Player's name cannot be empty !!`);
    }

    const friend = await Player.findOne({ name: friendName });
    if (!friend) {
        throw new BadRequestError(`Such a friend doesn't exist`);
    }

    const friendId = friend._id;
    let player = await Player.findById(playerId);
    if (!player) {
        throw new BadRequestError(`Player not found`);
    }

    const existingFriend = player.friends.find(f => f.playerId.toString() === friendId.toString());
    if (!existingFriend) {
        player.friends.push({ playerId: friendId });
        player = await Player.findByIdAndUpdate(playerId, { friends: player.friends }, { new: true });
    }
    else{
        throw new BadRequestError(`${friendName} is already your friend!`);
    }
    res.status(StatusCodes.OK).json({msg : `Friend added successfully`});
};
const getFriends = async (req, res) => {
    const { playerId, playerName } = req.player;
    if (!playerName) {
        throw new BadRequestError(`Player's name cannot be empty !!`);
    }
    const player = await Player.findById(playerId).populate('friends.playerId', 'name');
    if (!player) {
        throw new BadRequestError(`Such a player doesn't exist`);
    }
    const friendNames = player.friends.map(friend => friend.playerId.name);
    res.status(StatusCodes.CREATED).json({ playerFriends: friendNames });
};
const deleteFriend = async (req, res) => {
    const { playerId, playerName } = req.player;
    const friendId = req.body.id;

    if (!friendId) {
        throw new BadRequestError(`Friend's ID cannot be empty !!`);
    }
    if (!playerName) {
        throw new BadRequestError(`Player's name cannot be empty !!`);
    }

    const friend = await Player.findById(friendId);
    if (!friend) {
        throw new BadRequestError(`Such a friend doesn't exist`);
    }

    let player = await Player.findById(playerId);
    if (!player) {
        throw new BadRequestError(`Player not found`);
    }

    const existingFriendIndex = player.friends.findIndex(f => f.playerId.toString() === friendId.toString());
    if (existingFriendIndex !== -1) {
        player.friends.splice(existingFriendIndex, 1);
        player = await Player.findByIdAndUpdate(playerId, { friends: player.friends }, { new: true });
    }
    else{
        throw new BadRequestError(`${friend.name} is not a friend!`);
    }
    res.status(StatusCodes.OK).json({msg : `Removed ${friend.name} from friends`});
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
    const {playerId} = req.player;
    const player = await Player.findById(playerId);
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

const getTime = async(req, res)=>{
    res.status(StatusCodes.OK).json({time : 120});
}



module.exports = {
    getDetails,
    addFriends,
    updateScore,
    deleteFriend,
    getAllPlayerDetails,
    searchRecommendation,
    getImage,
    uploadImage,
    getFriends,
    getTime,
}