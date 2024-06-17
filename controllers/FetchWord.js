// const fetch = require('node-fetch');
require('dotenv').config();

async function fetchWord(apiKey, wordFetchUrl) {
    const resp = await fetch(process.env.WORD_FETCH);
    const data = await resp.json();
    let word = data[0].toUpperCase();
    return word;
}

module.exports = fetchWord