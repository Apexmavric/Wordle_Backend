const express = require('express');
const cors = require('cors'); // Import the cors middleware
require('express-async-errors');
require('dotenv').config();
const app = express();
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/player');
const gameRoutes = require('./routes/game');
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
const { joinRoom, createRoom, LeaveRoom, kickOutPerson, Refresh , gameInfo} = require('./controllers/io');

io.on('connection', (socket) => {
    socket.on('join-room', (roomName, playerName)=>{
        joinRoom(io,socket, roomName, playerName);
    });

    socket.on('create-room',(playerName)=>{
        createRoom(io, socket, playerName);
    });
    socket.on('leave-room', (roomName, playerName)=>{
        console.log(" i was here")
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
});

app.use(express.json());
app.use(cors());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/player', authMiddleware, playerRoutes);
app.use('/api/v1/game', authMiddleware, gameRoutes);
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
