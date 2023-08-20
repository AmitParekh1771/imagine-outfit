import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';
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

app.get('/flipkart', async (req, res) => {
    const { search, productIndex } = req.query;
    console.log(search);

    const url = `https://www.flipkart.com/search?q=${search}`;

    console.log('\n');
    console.log('...Fetching product list...');
    console.log(url);
    
    const collectionReponse = await fetch(url);
    const collection = await collectionReponse.text();
    
    const collection$ = load(collection);
    const productPath = collection$('[data-id]').eq(productIndex || randomIntFromInterval(0,3)).find('a').attr('href');
    const productLink = `https://www.flipkart.com${productPath}`;
    
    console.log('\n');
    console.log('...Fetching product...');
    console.log(productLink);

    const productResponse = await fetch(productLink);
    const product = await productResponse.text();
    const product$ = load(product);
    
    const img = product$('._1YokD2._2GoDe3').find('img').attr('src')?.replace(/\/128\/128\//g, '/512/512/');
    const title = product$('._1YokD2._2GoDe3').find('.B_NuCI').text();
    const mrp = product$('._1YokD2._2GoDe3').find('._30jeq3._16Jk6d').text();
    const originalMrp = product$('._1YokD2._2GoDe3').find('._3I9_wc._2p6lqe').text();
    const discountPercentage = product$('._1YokD2._2GoDe3').find('._3Ay6Sb._31Dcoz.pZkvcx').text();

    res.send({ img, title, mrp, originalMrp, discountPercentage, productLink });
});

app.post('/openai/outfits', async (req, res) => {
    const { preferences } = req.body;

    const prompt = `Consider a person with age ${preferences.age} and gender ${preferences.gender} living in ${preferences.location}. This person mostly likes ${preferences.color} color and ${preferences.pattern} pattern outfit for ${preferences.occasion} occasion.\n\nCreate a complete outfit set for the given preferences. Set should contain detailed search query of each item (considering all preferences strictly) and distinct category (append sub-category) that differentiate items from each other (no two item should have same category in the output list).\n\nIMPORTANT: Only return javascript array containing item of type { search: string, category: string } and enclose it with HTML pre tag.\n\nIMPORTANT: Output must be JSON parseabe.`;

    console.log('...Prompt...', prompt);
    console.log('\n');

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo-0613',
        temperature: 0.9
    });

    const content = completion.choices[0].message.content;
    const codeContent = content.includes("<pre>") ? content.replace(/\<pre\>([\s\S]+?)\<\/pre\>/g, '$1') : '[]';
    const items = JSON.parse(codeContent);

    res.send({ items });
});

app.post('/openai/outfit-prompt', async (req, res) => {
    const { preferences, currentOutfits, prompt } = req.body;
    
    const wrapperPrompt = `Consider a person with age ${preferences.age} and gender ${preferences.gender} living in ${preferences.location}. Given the user's current outfits:\n${JSON.stringify(currentOutfits)}\n\nAbove outfit list contain detailed search query for each items and category that differentiate items from each other. User has provided a prompt to apply some changes to the above list. \n\nThe prompt is \"${prompt}\". Modify outfit list based on user prompt such that set should contain detailed search query of each item (considering user persona strictly), distinct category (append sub-category) that differentiate items from each other (no two item should have same category in the output list) and status denoting if item is added(value 2), removed(value -1), modified(value 1) or unmodified(value 0). If item removal is needed, don't hard delete from the list, instead set status to -1 indicating soft delete.\n\nIMPORTANT: Only return javascript array containing item of type { search: string, category: string, status: number } and enclose it with HTML pre tag.\n\nIMPORTANT: Output must be JSON parseabe.`;

    console.log('...Prompt...', wrapperPrompt);
    console.log('\n');

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: wrapperPrompt }],
        model: 'gpt-3.5-turbo-0613',
        temperature: 0.9
    });

    const content = completion.choices[0].message.content;
    const codeContent = content.includes("<pre>") ? content.replace(/\<pre\>([\s\S]+?)\<\/pre\>/g, '$1') : '[]';
    const items = JSON.parse(codeContent);

    res.send({ items });
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));