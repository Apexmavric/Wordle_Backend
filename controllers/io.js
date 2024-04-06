
const Rooms = require('../models/Room');
const {BadRequestError, UnauthenticatedError} = require('../errors');
const socketIds = {};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
  }
const joinRoom = async(io, socket, roomName, playerName) => {
    // console.log(`this is player ${playerName}'s socket.id ${socket.id}`);
    try{
         let room;
         room  = await Rooms.findById(roomName);
         console.log(`${playerName} wants to join a room ${roomName} !`);
         socket.join(roomName);
         let data = {
            admin : room.admin,
            players : room.players,
        }
         const playerExists = room.players.some(player => player.playerName === playerName);
         if (playerExists) {
             io.to(roomName).emit('users' , data);
             return;
         }
         room.players.push({playerName : playerName, score : 0});
         data = {
            admin : room.admin,
            players : room.players,
         }
         await Rooms.findByIdAndUpdate(roomName , {players : room.players} ,{ new : true});
         io.to(roomName).emit('users' , data);
    }
    catch(err)
    {
        console.log(err);
    }
   
};

const Refresh = (socket,playerName)=>{
    socketIds[playerName] = socket.id;
    console.log(socketIds);
}

const createRoom = async(io, socket, playerName) => {
    // console.log(socket.id);
    console.log(`${playerName} wants to create a room !`);
    const adminPlayer = {playerName : playerName, score : 0};
    const room  = await Rooms.create({ players : [adminPlayer],admin : playerName});
    socket.join(room._id);
    socket.emit('room-created', room._id);
    const data = {
        admin : playerName,
        players : room.players
    }
    io.to(room._id).emit('users' , data);
}   
const LeaveRoom = async(io, socket, roomName, playerName) => {
    try{
        console.log(`${playerName} wants to leave a room ${roomName} !`);    
        const room = await Rooms.findById(roomName);
        if(room.players.length === 1)   
        {   
            console.log(`Room ${roomName} is getting deleted`);
            await Rooms.findByIdAndDelete(roomName);
            return;
        }
        const playerIndex = room.players.findIndex(player => player.playerName === playerName);
        room.players.splice(playerIndex , 1);
        let newAdmin = room.admin;
        const admin = room.admin;
        if(admin === playerName)
        {       
            console.log(admin);
            const randomIndex = getRandomInt(1,10) % (room.players.length);
            console.log(room);
            newAdmin = room.players[randomIndex].playerName;
        }
        await Rooms.findByIdAndUpdate(roomName, {admin : newAdmin , players : room.players}, {new:true});
        socket.leave(roomName);
        const data = {
            admin : newAdmin,
            players : room.players
        }
        io.to(room._id).emit('users' , data);
    }
    catch(err)
    {
        console.log(err);
    }
}


const kickOutPerson = async(io, socket, roomName, playerName, adminName)=>{
    // console.log(p);
    try{
        console.log(`${adminName} wants to kick a player ${playerName} !`);    
        const room = await Rooms.findById(roomName);
        if(room.admin === adminName && room.admin !== playerName)
        {   
            console.log('nikal diya');
            const playerIndex = room.players.findIndex(player => player.playerName === playerName);
            room.players.splice(playerIndex , 1);
            await Rooms.findByIdAndUpdate(roomName, {admin : room.admin, players : room.players}, {new:true});
            const data = {
                admin : room.admin,
                players : room.players
            }
            console.log(socketIds[playerName]);
            // io.sockets.sockets[socketIds[playerName]].leave(roomName);
            io.to(roomName).emit('users' , data);
            console.log(socketIds[playerName]);
            io.to(socketIds[playerName]).emit('user-left');
        }
    }
    catch(err)
    {
        console.log(err);
    }
}


const gameInfo = (io, socket, roomName, rounds, time)=>{
    io.to(roomName).emit('get-game-info', {Rounds : rounds, Time : time});
}

module.exports = {
    joinRoom,
    createRoom,
    LeaveRoom,
    kickOutPerson,
    Refresh,
    gameInfo
}