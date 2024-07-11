const express = require('express');
const cors = require('cors'); // Import the cors middleware
require('express-async-errors');
require('dotenv').config();
const app = express();
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/player');
const gameRoutes = require('./routes/game');
const VerifyToken = require('./routes/verifyToken');
const connectdB = require('./db/connect');
const errorHandlerMiddleware = require('./middleware/errorhandler'); 
const notfoundMiddleware = require('./middleware/not-found');
const authMiddleware = require('./middleware/auth');
const ioauth = require('./middleware/io-auth');
const { createServer } = require('http');
const { Server } = require('socket.io');
const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"] 
    }
  });
const { joinRoom, createRoom, LeaveRoom, kickOutPerson, Refresh , gameInfo, 
    startGame, fetchTime,verifyWord, fetchLiveUserInfo,
    inviteFriends, joinrequestAccept, getHint, disconnect, 
    verifyGame, BacktoRoom, LeaveGame, joinrequestAcceptAdmin,RoomJoinRequest } = require('./controllers/io');
io.use(ioauth);
io.on('connection', (socket) => {
    socket.on('join-room', (roomName, playerName)=>{
        joinRoom(io,socket, roomName, playerName);
    });

    socket.on('create-room',(playerName)=>{
        createRoom(io, socket, playerName);
    });
    socket.on('leave-room', (roomName, playerName)=>{
        LeaveRoom(io, socket, roomName, playerName);
    });

    socket.on('kick-out' ,(roomName, playerName, adminName)=>{
        kickOutPerson(io, socket, roomName, playerName, adminName);
    } )
    socket.on('refresh-ids',(playerName)=>{
        Refresh(socket, playerName);
    } )

    socket.on('game-infos',(roomName, rounds, time)=>{
        gameInfo(io, socket, roomName, rounds, time);
    } )

    socket.on('start-game', (roomName,adminName, rounds,time)=>{
        console.log(`${adminName} wants to start a game!`);
        startGame(io, socket, roomName, adminName,rounds, time)
    })
    socket.on('fetch-time', (roomName)=>{
        fetchTime(io, socket, roomName);
    })
    socket.on('verify-word', (roomName, playerName, word)=>{
        verifyWord(io, socket, roomName, playerName, word);  
    })
    socket.on('fetch-live-players-info', (roomName)=>{
        fetchLiveUserInfo(io, socket, roomName);
    })
    socket.on('invite', (name)=>{
        inviteFriends(io, socket, name);
    })
    socket.on('join-request-accept' ,(token)=>{
        joinrequestAccept(io, socket, token);
    })
    socket.on('get-hint-request', (roomName)=>{
        getHint(io, socket, roomName)
    } )
    socket.on('disconnect', ()=>{
        disconnect(io, socket);
    })  
    socket.on('verifyGame', (roomName)=>{
        verifyGame(io, socket, roomName);
    })
    socket.on('backtoroom', (roomName)=>{
        BacktoRoom(io, socket, roomName);
    })
    socket.on('leave-game', (roomName)=>{
        LeaveGame(io, socket, roomName);
    })

    socket.on('join-request', (roomName)=>{
        RoomJoinRequest(io, socket, roomName);
    })

    socket.on('admin-request-accept', (token)=>{
        joinrequestAcceptAdmin(io, socket, admin);
    })
});

app.use(express.json());
app.use(cors());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/player', authMiddleware, playerRoutes);
app.use('/api/v1/game', authMiddleware, gameRoutes);
app.use('/api/v1/verify', authMiddleware, VerifyToken);
app.use(errorHandlerMiddleware);
app.use(notfoundMiddleware);


const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectdB(process.env.MONGO_URI);
        console.log('Connected to DB...');
        server.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();
