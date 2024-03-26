const { BadRequestError } = require('../errors');
const Player = require('../models/Player');
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
    const {word, time , row} = req.body;
    let player = await Player.findById(playerId);
    if(!player)
    {
        throw new BadRequestError('Such a player doesnt exist');
    }
    const actualword = player.word;
    const arr = Array(5).fill(1);
    if(actualword === word)
    {   
        const newScore = player.score + Number(time);
        await Player.findByIdAndUpdate(playerId, {word : "", hint : "", score :newScore });
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
    if(row === 4)
    {
        res.status(200).json({status : 'wrong', arr : arr, word: actualword});
        await Player.findByIdAndUpdate(playerId, {word : "", hint : ""}) ;
        return;
    }
    res.status(200).json({status : 'wrong', arr : arr});
}
module.exports ={
    reset,
    verify
}