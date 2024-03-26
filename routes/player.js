const express = require('express');
const Router = express.Router();
const {getDetails, updateScore, addFriends, deleteFriend, getAllPlayerDetails, searchRecommendation, getImage, uploadImage, getFriends, getTime} = require('../controllers/player');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


Router.route('/details').get(getDetails);
Router.route('/add').post(addFriends);
Router.route('/friends').get(getFriends);
Router.route('/update').patch(updateScore);
Router.route('/delete').delete(deleteFriend);
Router.route('/').get(getAllPlayerDetails);
Router.route('/search').post(searchRecommendation);
Router.route('/image').post(upload.single('image'), uploadImage).get(getImage);
Router.route('/time').get(getTime);

module.exports = Router;