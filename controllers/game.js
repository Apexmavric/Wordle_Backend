const { BadRequestError } = require('../errors');
const Player = require('../models/Player');
const Games = require('../models/Games');
require('dotenv').config();
const reset = async(req, res)=>{
    const resp = await fetch(process.env.WORD_FETCH);
    const data = await resp.json();
    let word = await data[0];
    word = word.toUpperCase();
    console.log(word);
    const endpoint = `https://api.api-ninjas.com/v1/dictionary?word=${word}`;
    const headers = new Headers();
    headers.append('X-Api-Key', process.env.API_KEY);
    const hintresp = await fetch(endpoint, {
    method: 'GET', 
    headers: headers
    })
    const {playerId} = req.player;
    let player = await Player.findByIdAndUpdate(playerId, {word : word}, {new: true});
    if(!player)
    {
        throw new BadRequestError('Such a player doesnt exist');
    }
    if(hintresp.ok)
    {   
        const hint = await hintresp.json();
        // console.log(hint.definition);
        player = await Player.findByIdAndUpdate(playerId, {hint : hint.definition}, {new: true});
    }
    res.status(200).send('Reset successfull !!');
}

const verify = async(req, res)=>{
    const {playerId} = req.player;
    let {word, time , row} = req.body;
    let player = await Player.findById(playerId);
    if(!player)
    {
        throw new BadRequestError('Such a player doesnt exist');
    }
    const actualword = player.word;
    const arr = Array(5).fill(1);
    let newScore,newMax,currStreak,maxStreak,newGames,wins=0;
    if(actualword === word)
    {   
        newScore = player.stats.score + Number(time);
        newGames = player.stats.gamesPlayed + 1;
        newMax = Math.max(time, player.stats.maxScore);
        currStreak = player.stats.currentStreak + 1;
        maxStreak = Math.max(player.stats.maxStreak, currStreak);
        wins = player.stats.wins + 1;
        await Player.findByIdAndUpdate(playerId, {word : "", hint : "", stats:{score :newScore, maxScore : newMax,  maxStreak : maxStreak, gamesPlayed : newGames, currentStreak : currStreak,wins:wins}});
        let date = new Date(Date.now());
        let options = {
        timeZone: 'Asia/Kolkata',
        hour12: true 
        }
        date = date.toLocaleString('en-IN', options).split('p')[0];
        date = date.split(',').join(" ");
        await Games.create({date : date, playedBy : playerId, score : time, mode : 'SinglePlayer'});
        return res.status(200).json({status : 'right', arr : arr});
    }
    for(let i = 0; i<actualword.length; i++)
        {
            if(word[i] === actualword[i])
            {
                arr[i]=1;
            }
            else if(actualword.indexOf(word[i])!==-1)
            {
                arr[i] = 3;
            }
            else 
            {
                arr[i] = 2; 
            }
    }
    if(row === 4 || time <=0)
    {       
        time=0;
        newScore = player.stats.score + Number(time);
        newGames = player.stats.gamesPlayed + 1;
        newMax = Math.max(time, player.stats.maxScore);
        currStreak = player.stats.currentStreak;
        maxStreak = Math.max(player.stats.maxStreak, currStreak);
        await Player.findByIdAndUpdate(playerId, {word : "", hint : "", stats:{score :newScore, maxScore : newMax,  maxStreak : maxStreak, gamesPlayed : newGames, currentStreak : 0} }); 
        let date = new Date(Date.now());
        let options = {
        timeZone: 'Asia/Kolkata',
        hour12: true 
        }
        date = date.toLocaleString('en-IN', options).split('p')[0];
        date = date.split(',').join(" ");
        await Games.create({date :  date, playedBy : playerId, score : time, mode : 'SinglePlayer'});
        return res.status(200).json({status : 'wrong', arr : arr, word: actualword});
    }
    res.status(200).json({status : 'wrong', arr : arr});
}

const getGameDetails = async(req, res)=>{
    const {playerId} = req.player;
    const games = await Games.find({playedBy : playerId});
    console.log('games');
    res.status(200).json({gameDetails : games});
}
module.exports ={
    reset,
    verify,
    getGameDetails
}