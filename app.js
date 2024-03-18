const express = require('express');
require('express-async-errors')
require('dotenv').config();
const app = express();
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/player');
const connectdB = require('./db/connect');
const erroHandlerMiddleware = require('./middleware/errorhandler');
const notfoundMiddleware = require('./middleware/not-found');
const authMiddleware = require('./middleware/auth');

app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/player',authMiddleware,playerRoutes);
app.use(erroHandlerMiddleware);
app.use(notfoundMiddleware);


const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectdB(process.env.MONGO_URI);
    console.log('Connected to DB...');
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
