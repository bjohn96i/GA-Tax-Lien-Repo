const axios = require('axios');
const cheerio = require('cheerio');

const baseUrl = 'https://propertyappraisal.dekalbcountyga.gov/search/commonsearch.aspx?mode=realprop';

async function scrapeData() {
    try {
        const response = await axios.get(baseUrl);
        const $ = cheerio.load(response.data);

        // Here, you can use jQuery-like selectors to extract data from the HTML
        const propertyData = [];

        // Example: extracting property names and values
        $('.searchResults tbody tr').each((index, element) => {
            const propertyName = $(element).find('.searchResultsLabel').text().trim();
            const propertyValue = $(element).find('.searchResultsContent').text().trim();

            propertyData.push({
                name: propertyName,
                value: propertyValue
            });
        });

        // Output the scraped data
        console.log(propertyData);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to initiate the scraping process
scrapeData();