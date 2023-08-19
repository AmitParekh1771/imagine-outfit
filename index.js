import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { OUTFITS } from './outfits.js';
import { config } from 'dotenv';
import { load } from 'cheerio';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const randomIntFromInterval = (min, max) => { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

app.post('/flipkart', async (req, res) => {
    const { type, filters, productIndex } = req.body;

    // path = `/clothing-and-accessories/topwear/tshirt/men-tshirt/pr`
    // sid = `sid=clo,ash,ank,edy`
    // filters = `p%5B%5D=facets.neck_type%255B%255D%3DRound%2BNeck&p%5B%5D=facets.size%255B%255D%3DL`
    const index = OUTFITS.findIndex(outfit => outfit.type == type);
    const path = OUTFITS[index]?.path;
    const sid = OUTFITS[index]?.sid;
    const queryParams = [];
    for(let filter of filters) queryParams.push(OUTFITS[index]?.filters[`${filter}`] || '');

    const url = `https://www.flipkart.com${path || '/clothing-and-accessories/topwear/tshirt/men-tshirt/pr'}?${sid || 'sid=clo,ash,ank,edy'}&${queryParams.join('&')}`;

    console.log('\n');
    console.log('...Fetching product list...');
    console.log(url);
    
    const collectionReponse = await fetch(url);
    const collection = await collectionReponse.text();
    
    const collection$ = load(collection);
    const productPath = collection$('[data-id]').eq(productIndex || randomIntFromInterval(0,39)).find('a').attr('href');
    const productLink = `https://www.flipkart.com${productPath}`;
    
    console.log('\n');
    console.log('...Fetching product...');
    console.log(productLink);

    const productResponse = await fetch(productLink);
    const product = await productResponse.text();
    const product$ = load(product);
    
    const img = product$('._1YokD2._2GoDe3').find('img').attr('src').replace(/\/128\/128\//g, '/512/512/');
    const title = product$('._1YokD2._2GoDe3').find('.B_NuCI').text();
    const mrp = product$('._1YokD2._2GoDe3').find('._30jeq3._16Jk6d').text();
    const originalMrp = product$('._1YokD2._2GoDe3').find('._3I9_wc._2p6lqe').text();
    const discountPercentage = product$('._1YokD2._2GoDe3').find('._3Ay6Sb._31Dcoz.pZkvcx').text();

    res.send({ type, img, title, mrp, originalMrp, discountPercentage, productLink });
});

app.post('/openai/outfits', async (req, res) => {
    const { preferences } = req.body;

    const prompt = `Given the user persona:\n${JSON.stringify(preferences)}\n\nGiven the fashion outfits collection with possible filters:\n${JSON.stringify(OUTFITS)}\n\nSuggest the best outfit from the given outfit lists that fits given user persona. Also select appropriate combination of filters (keys only and not values) for each selected outfit element based on user persona given\n\nIMPORTANT: Only return javascript sub-array of best combination containing item of type { type: string, filters: string[] } and enclose it with HTML pre tag.`;

    console.log('...Prompt...', prompt);
    console.log('\n');

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo-0613',
        temperature: 0.5
    });

    const content = completion.choices[0].message.content;
    const codeContent = content.includes("<pre>") ? content.replace(/\<pre\>([\s\S]+?)\<\/pre\>/g, '$1') : '[]';
    const productList = JSON.parse(codeContent);

    res.send({ productList });
});

app.post('/openai/outfit-filters', async (req, res) => {
    const { currentOutfits, preferences, prompt } = req.body;
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));