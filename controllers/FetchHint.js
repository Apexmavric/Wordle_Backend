

async function fetchHint(word)
{
        const apiKey = process.env.HINT_FETCH_KEY;
        let endpoint = process.env.HINT_FETCH + word;
        const headers = new Headers();
        headers.append('X-Api-Key', apiKey);
        const resp = await fetch(endpoint, {
            method: 'GET', 
            headers: headers
            })
        const hint  = await resp.json();
        if(hint.definition)
        {
            return hint.definition.substring(0, process.env.MAX_HINT_LENGTH);
        }
        else
        {
            return process.env.DEFAULT_HINT;
        }
}
fetchHint();
module.exports = fetchHint;