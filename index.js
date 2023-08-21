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
    try {
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
        
        const pid = new URL(productLink).searchParams.get('pid');
        const img = product$('._1YokD2._2GoDe3').find('img').attr('src')?.replace(/\/128\/128\//g, '/512/512/');
        const title = product$('._1YokD2._2GoDe3').find('.B_NuCI').text();
        const mrp = product$('._1YokD2._2GoDe3').find('._30jeq3._16Jk6d').text();
        const originalMrp = product$('._1YokD2._2GoDe3').find('._3I9_wc._2p6lqe').text();
        const discountPercentage = product$('._1YokD2._2GoDe3').find('._3Ay6Sb._31Dcoz.pZkvcx').text();
    
        res.send({ pid, img, title, mrp, originalMrp, discountPercentage, productLink });
    } catch(err) {
        res.status(404).send({ err, pid: '404', img: '', title: `Not Found - 404`, mrp:'', originalMrp: '', discountPercentage: '', productLink: '' });
    }
});

app.post('/openai/outfits', async (req, res) => {
    try {
        const { preferences } = req.body;
    
        const prompt = `Consider a person with age ${preferences.age} and gender ${preferences.gender} living in ${preferences.location}. This person mostly likes ${preferences.color} color and ${preferences.pattern} pattern outfit for ${preferences.occasion} occasion.\n\nCreate a complete outfit set for the given preferences. For each item in the recommended set provide long, detailed and very precise searchable query that can be used to web search that item and category which that item belongs to.\n\nIMPORTANT: Only return javascript array containing item of type { search: string, category: string } and enclose it with HTML pre tag.\n\nIMPORTANT: Output must be JSON parseabe.`;
    
        console.log('\n...Prompt...\n', prompt);
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
    } catch(err) {
        res.status(404).send({ err, items: [] })
    }
});

app.post('/openai/outfit-prompt', async (req, res) => {
    try {
        const { preferences, currentOutfits, prompt } = req.body;
        
        const wrapperPrompt = `Consider a person with age ${preferences.age} and gender ${preferences.gender} living in ${preferences.location}. This person mostly likes ${preferences.color} color and ${preferences.pattern} pattern outfit for ${preferences.occasion} occasion. The current outfit of the user includes:\n${currentOutfits.map(item => `${item.title} - ${item.mrp}`).join('\n')}.\n\nUser has provided a prompt to apply some changes to the above list. \n\nThe prompt is \"${prompt}\"\n\n. Suggest appropriate outfit items that satisfies user prompt (at highest priority) and matches the current outfit of the user. For each item recommended should contain long, detailed and very precise searchable query that can be used to web search that item and category which that item belongs to.\n\nIMPORTANT: Only return javascript array containing item of type { search: string, category: string } and enclose it with HTML pre tag.\n\nIMPORTANT: Output must be JSON parseabe.`;
    
        console.log('\n...Prompt...\n', wrapperPrompt);
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
    } catch(err) {
        res.status(404).send({ err, items: [] });
    }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));