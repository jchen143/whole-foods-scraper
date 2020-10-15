const puppeteer = require("puppeteer");
const cheerio = require("cheerio"); 

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
async function main(){
    const browser = await puppeteer.launch({headless: false}); 
    const page = await browser.newPage(); 
    page.setViewport({width: 1200, height: 926}); 

    await page.goto("https://products.wholefoodsmarket.com/search?sort=relevance&store=10518&category=produce"); 
    const html = await page.content(); 
    const $ = cheerio.load(html); 

    const targetItemCount = 300; 

    //const result = await page.evaluate(extractItems)
    let pulledData = []; 

    

    const items = await(scrapeInfiniteScrollItems(page, extractItems, targetItemCount))
    //console.log(items); 

    for(let i = 0; i < items.length; i++){

        let element = items[i]; 

        let title = $(element).find("div[class*=ProductCard-Name]").text(); 

        //removed dashed through prices

        let price = $(element).find("div[class*=ProductCard-Price--]:not([data-dashed=''])").text(); 


        pulledData.push({title, price});

    }

    console.log(pulledData); 
   
}



main(); 