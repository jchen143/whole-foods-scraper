const puppeteer = require("puppeteer");
const cheerio = require("cheerio"); 
const fs = require('fs'); 
const mongoose = require ('mongoose'); 
const groceryItem = require("./model/groceryItem"); 

/* TODO- store on MongoDB
async function connectToMongoDb(){

    console.log('connected to mongodb')
}
*/
function extractItems(){
    const extractItems = Array.from(
        document.querySelectorAll("#app > div > div > div > div.Skeleton__1kTv0.Content__3ds1h > div.ResultsContainer__-sQWm > div.Grid__3P-4x > div[class*=ProductCard]")
        
       
    )


    const items = extractItems.map(element => element.innerHTML); 

    

    return items; 
}

async function scrapeInfiniteScrollItems(page, extractItems, targetItemCount, delay= 1000) {
    let items = []; 

    try{
        
        let previousHeight;
    
        while (true) {

            newItems = await page.evaluate(extractItems);

            if(newItems.length === items.length) break; //no more results

            items = newItems; 

            previousHeight = await page.evaluate('document.body.scrollHeight')

            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);  //see if function was executed            

            await page.waitFor(delay); //
        }
    }catch(error){
        console.log(error)
    }

    return items; 

}
async function main(zip, category){
    //await connectToMongoDb(); 
    const browser = await puppeteer.launch({headless: false}); 
    const page = await browser.newPage(); 
    page.setViewport({width: 1200, height: 926}); 

    await page.goto(`https://products.wholefoodsmarket.com/search?sort=relevance&store=${zip}&category=${category}`); 
    const html = await page.content(); 
    const $ = cheerio.load(html); 

    const targetItemCount = 300; 

    //const result = await page.evaluate(extractItems)
    //let pulledData = []; 

    

    const items = await(scrapeInfiniteScrollItems(page, extractItems, targetItemCount))
    //console.log(items); 
    let productJson = {};

    for(let i = 0; i < items.length; i++){

        let element = items[i]; 

        let title = $(element).find("div[class*=ProductCard-Name]").text(); 

        //removed dashed through prices for sales
        let stringPrice = $(element).find("div[class*=ProductCard-Price--]:not([data-dashed=''])").text(); 

        
        //numerical price
        var price = Number(stringPrice.replace(/[^0-9.-]+/g, ""));

        if (stringPrice.includes('¢')) {
            price = price/100; 
        }

        let unit = 'unit'; 

        if(stringPrice.includes('lb')){
            unit = 'lb'; 
        }

        /*
        const groceryItemModel = new groceryItem({ title, price, category, unit })
        await groceryItemModel.save();
        //pulledData.push();
        */

        productJson[i] = { title, price, category, unit }; 
    }

    fs.writeFile(`${category}.json`, JSON.stringify(productJson), err => {
        if(err) throw err; 
    })
   
}

let zip = '10518';
let category = 'produce';

main(zip, category)


/* TODO: Run Scraper for all the categories 

let zip = '10518'; 
//let category = 'produce'; 
let categories = ['produce', 'dairy-eggs', 'meat', 'prepared-foods', 'pantry-essentials', 'breads-rolls-bakery', 'body-care', 
'supplements', 'frozen-foods',
    'snacks-chips-salsas-dips', 'seafood', 'beverages', 'wine-beer-spirits', 'beauty','floral']
async function runScrape(){
    for (let i = 0; i < categories.length; i++) {
        let category = categories[i];
        await main(zip, category);
    }
}

runScrape(); 

*/