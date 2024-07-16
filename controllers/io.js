
const Rooms = require('../models/Room');
const Players=require('../models/Player');
const {BadRequestError, UnauthenticatedError} = require('../errors');
const fetchWord = require('./FetchWord');
const fetchHint = require('./FetchHint');
const socketIds = {};
const Room = {};
const GuessedPeople = {};
const Player = {};
const jwt = require('jsonwebtoken');
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; 
  }


const PlayerProfilePic = async(io, playerName, roomName)=>{
    const player = await Players.findOne({name : playerName});
    if(player)
       {
           const newPlayer = [{
               contentType : player.contentType,
               data : player.data,
               player:playerName
           }]
           io.to(roomName).emit('new-player', newPlayer); 
       }
}
const joinRoom = async(io, socket, roomName, playerName) => {
    try{
         let room;
         room  = await Rooms.findById(roomName);
        //  console.log(`${playerName} wants to join a room ${roomName} !`);
         socket.join(roomName);
         Player[playerName] = roomName;
         let data = {
            admin : room.admin,
            players : room.players,
        }
         const playerExists = room.players.some(player => player.playerName === playerName);
        
         if (playerExists) {
            io.to(roomName).emit('users' , data);
            return;
         }
         room.players.push({playerName : playerName, score : 0, hint : 0});
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
    socketIds[playerName] = socket;
}

const createRoom = async(io, socket, playerName) => {
    // console.log(`${playerName} wants to create a room !`);
    const adminPlayer = {playerName : playerName, score : 0, hint : 0};
    const room  = await Rooms.create({ players : [adminPlayer],admin : playerName});
    socket.join(room._id);
    socket.emit('room-created', room._id);
    const data = {
        admin : playerName,
        players : room.players
    }
    Player[playerName] = room._id;
    io.to(room._id).emit('users' , data);
    PlayerProfilePic(io, playerName, room._id);
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
        let playerIndex = room.players.findIndex(player => player.playerName === playerName);
        room.players.splice(playerIndex , 1);
        let newAdmin = room.admin;
        const admin = room.admin;
        if(admin === playerName)
        {       
            const randomIndex = getRandomInt(1,10) % (room.players.length);
            newAdmin = room.players[randomIndex].playerName;
        }
        const data = {
            admin : newAdmin,
            players : room.players
        }
        socket.leave(roomName);
        io.to(room._id).emit('users-updated' , data);
        // console.log(room.players);
        await Rooms.findByIdAndUpdate(roomName, {admin : newAdmin , players : room.players}, {new:true});
    }
    catch(err)
    {
        console.log(err);
    }
}


const kickOutPerson = async(io, socket, roomName, playerName, adminName)=>{
    try{
        console.log(`${adminName} wants to kick a player ${playerName} !`);    
        const room = await Rooms.findById(roomName);
        if(room.admin === adminName && room.admin !== playerName)
        {   
            const playerIndex = room.players.findIndex(player => player.playerName === playerName);
            room.players.splice(playerIndex , 1);
            await Rooms.findByIdAndUpdate(roomName, {admin : room.admin, players : room.players}, {new:true});
            const data = {
                admin : room.admin,
                players : room.players
            }
            io.to(roomName).emit('users' , data);
            io.to(socketIds[playerName].id).emit('user-left');
            delete Player[playerName];
        }
    }
    catch(err)
    {
        console.log(err);
    }
}


const gameInfo = (io, socket, roomName,rounds, time)=>{
    // console.log(`time : ${time}`)
    io.to(roomName).emit('get-game-info', {Rounds : rounds, Time : time});
}

const startGame = async (io, socket, roomName, adminName, rounds, time) => {
    const room  = await Rooms.findById(roomName);
    Room[roomName] = {
        time: time,
        rounds: rounds,
        timer: time,
        word: await fetchWord(),
        hint : "",
        players: room.players,
        isActive : room.players.length
    };
    io.to(roomName).emit('users-live', Room[roomName].players);
    io.to(roomName).emit('start-game-signal');
    if(!GuessedPeople[roomName])
    {
        GuessedPeople[roomName] = [];
    }
    async function runRounds(rounds, roomName, time) {
        for (let i = 0; i < rounds; i++) {
            Room[roomName].hint = await fetchHint(Room[roomName].word);
            for(let i = 0; i<Room[roomName].players.length - 1 ;i++)
            {
                Room[roomName].players[i].hint = 0;   
            }
            console.log(`Hint : ${Room[roomName].hint}`);
            console.log(`Round ${i + 1}`);
            console.log(Room[roomName].word);
            io.to(roomName).emit('start-next-round', time);
            Room[roomName].timer = time;
            await runTimer(roomName, time); 
            io.to(roomName).emit('Round-completed');
            GuessedPeople[roomName] = [];
            io.to(roomName).emit('players-live-info', GuessedPeople[roomName]);
            await Promise.race([fetchWord(), delay(5000)]);
            if(i === rounds-1)
            {
                io.to(roomName).emit('game-ended');
            }
            else Room[roomName].word = await fetchWord(); 
        }
    }
    function runTimer(roomName, time) {
        return new Promise(resolve => {
            const timerInterval = setInterval(() => {
                Room[roomName].timer--;
                if (Room[roomName].timer <= 0) {
                    clearInterval(timerInterval);
                    resolve(); 
                }
            }, 1000);
        });
    }
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    runRounds(rounds, roomName, time)
        .then(() => {
            console.log('All rounds completed.');
        })
        .catch(error => {
            console.error('Error:', error);
        });
    
};


const fetchTime = (io, socket, roomName) => {
    if (Room[roomName] && Room[roomName].timer != null) {
        socket.emit('get-time', { Time: Room[roomName].timer });
    }
}

const fetchLiveUserInfo = (io, socket, roomName)=>{
    io.to(roomName).emit('players-live-info', GuessedPeople[roomName]);
    if(Room[roomName])
    {   
        io.to(roomName).emit('users-live', Room[roomName].players);
    }
}

const verifyWord = async(io, socket, roomName, playerName, word)=>{
    // console.log(roomName);
    if(roomName === null)
    {

    }
    const actualword = Room[roomName].word;
    const arr = Array(5).fill(1);
    if(actualword === word)
    {   
        console.log("Word Matched !!");
        socket.emit('verify-response', {arr : arr, status : "right"});
        if(!GuessedPeople[roomName])
        {
            GuessedPeople[roomName] = [];
        }
        GuessedPeople[roomName].push(playerName);
        const arrn = Room[roomName].players;
        arrn.map(e=>{
            if(e.playerName === playerName)
            {   
                if(e.hint === 1)
                {   
                    const num = parseFloat(process.env.PENALTY);
                    e.score += Math.round(Room[roomName].timer * num);
                    console.log(e.score);
                }
                else
                {
                    e.score+=Room[roomName].timer;
                }
            }
            return e;
        })
        arrn.sort((a, b) => b.score - a.score);
        Room[roomName].players = arrn;
        io.to(roomName).emit('players-live-info', GuessedPeople[roomName]);
        io.to(roomName).emit('users-live', Room[roomName].players);
        return;
    }
    for(let i = 0; i<actualword.length; i++)
    {
        if(word[i] === actualword[i]) arr[i]=1;
        else if(actualword.indexOf(word[i])!==-1)  arr[i] = 3;
        else  arr[i] = 2;
    }
    socket.emit('verify-response', {arr : arr, status : "wrong"});
}
const inviteFriends = (io, socket, name)=>{
    const adminname = socket.player.playerName;
    console.log(`Admin ${adminname} is sending request to ${name} for joining room ${Player[adminname]}`);
    const tokenWithRoomname = jwt.sign({playerName:name, roomName : Player[adminname]},process.env.JWT_SECRET, {expiresIn:'10s'});
    io.to(socketIds[name].id).emit('invite-request', tokenWithRoomname, adminname);
}

const RoomJoinRequest = async(io, socket, roomName)=>{
    const room = await Rooms.findById(roomName);
    if(!room) return;
    const playerName = socket.player.playerName;
    const {admin} = room;
    console.log(playerName, roomName, admin);
    if(!Room[roomName])
    {   
        console.log(`Player ${playerName} is sending request for joining room ${Player[admin]}`);
        const tokenWithRoomname = jwt.sign({playerName:playerName, adminName:admin},process.env.JWT_SECRET, {expiresIn:'10s'});
        io.to(socketIds[admin].id).emit('join-request-player', tokenWithRoomname,playerName);
    }
}


const joinrequestAcceptAdmin = async(io, socket, token)=>
    {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const playerName = payload.playerName;
        const adminName = payload.adminName;
        if(adminName === socket.player.playerName){
            const roomName = Player[adminName];
            try{
                const playerSocket = socketIds[playerName];
                io.to(playerSocket.id).emit('join-room-authenticated', roomName);
                let room;
                room  = await Rooms.findById(roomName);
                console.log(`${playerName} wants to join a room ${roomName} !`);
                playerSocket.join(roomName);
                Player[playerName] = roomName;
                let data = {
                   admin : room.admin,
                   players : room.players,
               }
                const playerExists = room.players.some(player => player.playerName === playerName);
                if (playerExists) {
                    io.to(roomName).emit('users' , data);
                    return;
                }
                room.players.push({playerName : playerName, score : 0, hint : 0});
                data = {
                   admin : room.admin,
                   players : room.players,
                }
                await Rooms.findByIdAndUpdate(roomName , {players : room.players} ,{ new : true});
                io.to(roomName).emit('users' , data);
                PlayerProfilePic(io, playerName, roomName);
           }
           catch(err)
           {
               console.log(err);
           }
        }
    }

const joinrequestAccept = async(io, socket, token)=>
{
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const playerName = payload.playerName;
    if(playerName === socket.player.playerName){
        const roomName = payload.roomName;
        try{
            io.to(socket.id).emit('join-room-authenticated', roomName);
            let room;
            room  = await Rooms.findById(roomName);
            console.log(`${playerName} wants to join a room ${roomName} !`);
            socket.join(roomName);
            Player[playerName] = roomName;
            let data = {
               admin : room.admin,
               players : room.players,
           }
            const playerExists = room.players.some(player => player.playerName === playerName);
            if (playerExists) {
                io.to(roomName).emit('users' , data);
                return;
            }
            room.players.push({playerName : playerName, score : 0, hint : 0});
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
    }
}

const getHint = (io, socket, roomName)=>{
    if(Room[roomName] && Room[roomName].hint != process.env.DEFAULT_HINT)
    {   
        const player = socket.player.playerName;
        let arr = Room[roomName].players;
        arr = arr.map((e)=>{
            const new_e = e;
            if(e.playerName === player)
            {
                new_e.hint = 1;
            }
            return new_e;
        })
        Room[roomName].players = arr;
        io.to(socket.id).emit('fetch-hint', Room[roomName].hint);
    }
} 


const disconnect = async(io, socket)=>{
    const playerName = socket.player.playerName;
    // console.log(`Player ${playerName} wants to disconnect`);
//    if (Player[playerName])
//     {   
//         const roomName = Player[playerName];
//         try{   
//             const room = await Rooms.findById(roomName);
//             const playerIndex = room.players.findIndex(player => player.playerName === playerName);
//             room.players.splice(playerIndex , 1);
//             await Rooms.findByIdAndUpdate(roomName, {admin : room.admin, players : room.players}, {new:true});
//             const data = {
//                 admin : room.admin,
//                 players : room.players
//             }
//             io.to(roomName).emit('users' , data);
//             delete(Player[playerName]);
//         }
//         catch(err)
//         {
//             console.log(err);
//         }

//     }
}


const verifyGame = async(io, socket, roomName)=>
{   
    const playerName = socket.player.playerName;
    console.log(`${playerName} wants to verify`);
    if(Room[roomName] && Room[roomName].isActive>=0)
    {
        console.log(Room[roomName]);
        if (Player[playerName] === roomName && Room[roomName].isActive!=0){
            io.to(socketIds[playerName].id).emit('good');
            console.log(`good, ${playerName}`)
        }    
        else
        {   
            console.log(`bad, ${playerName}`)
            if(Player[playerName]!=roomName) io.to(socketIds[playerName].id).emit('bad', "You are not allowed to enter this game!"); 
            else if(Room[roomName].isActive === 0) io.to(socketIds[playerName].id).emit('bad', "Looks like the game has already ended!"); 
        }
    }
}
const BacktoRoom = (io, socket, roomName)=>{
    const playerName = socket.player.playerName;
    if(Player[playerName] === roomName)
    {
        console.log(`${playerName} is trying to leave the game`);
        Room[roomName].isActive--;
        console.log( Room[roomName].isActive);
    }
}  

const LeaveGame = (io, socket, roomName)=>{
    const playerName = socket.player.playerName;
    if(Player[playerName] === roomName)
    {
        console.log(`${playerName} is trying to leave the game`);
        Room[roomName].isActive--;
        console.log( Room[roomName].isActive);
        delete Player[playerName];
    }
}
module.exports = {
    joinRoom,
    createRoom,
    LeaveRoom,
    kickOutPerson,
    Refresh,
    gameInfo,
    startGame,
    fetchTime,
    verifyWord,
    fetchLiveUserInfo,
    inviteFriends,
    joinrequestAccept,
    getHint,
    disconnect,
    verifyGame,
    BacktoRoom,
    LeaveGame,
    joinrequestAccept,
    RoomJoinRequest,
    joinrequestAcceptAdmin,
}