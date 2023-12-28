const pdf = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const dataBuilder = require('./modules/dataBuilder.js')
require('dotenv').config()

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_DB;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function extractTextFromPDF(pdfFilePath, pageNumber) {
    const dataBuffer = fs.readFileSync(pdfFilePath);
    const data = await pdf(dataBuffer, {max: pageNumber, normalizeWhitespace: true, disableCombineTextItems: true});
    return data.text;
}
async function run(){
	try {
        await client.connect();
        const database = client.db("deedData");
		const taxDeedDB = database.collection("taxDeeds");

        const pdfFilePath = './files/test2.pdf';
        const pageNumber = 100; // Change this to the desired page number
        extractTextFromPDF(pdfFilePath, pageNumber).then(text => {
            let lines = text.trim().split('\n');

            pages = splitPages(lines);
            console.log('pages ' + pages.length);

            const resultsByParcelId = {}; // Object to store results by parcelId

            const pagePromises = pages.map(async (page, index) => {
                const parcelIdRegex = /^\d{7}$|^\d{2}\s\d{3}\s\d{2}\s\d{3}$/;
                let parcelIds = page.filter(a => parcelIdRegex.test(a.trim()));

                parcelIds = parcelIds.filter(onlyUnique);
                console.log(parcelIds)
                
                const dataUrls = parcelIds.map(parcelId => {
                    const url = "https://propertyappraisal.dekalbcountyga.gov/datalets/datalet.aspx?mode=profileall&UseSearch=no&pin=" + parcelId;
                    return axios.get(url)
                        .then(response => {
                            const $ = cheerio.load(response.data);
                            const metadata =  dataBuilder.buildData(parcelId, url, $);
                            return { parcelId, metadata };
                        })
                        .catch(error => {
                            console.error('Error fetching data: ', error);
                            return { parcelId, metadata: null };
                        });
                });

                const valueUrls = parcelIds.map(parcelId => {
                    const url = "https://publicaccess.dekalbtax.org/datalets/datalet.aspx?mode=value_history&UseSearch=no&pin=" + parcelId;
                    return axios.get(url)
                        .then(response => {
                            const $ = cheerio.load(response.data);
                            const valueData = dataBuilder.buildValueData(parcelId, url, $)
                            return { parcelId, valueData };
                        })
                        .catch(error => {
                            console.error('Error fetching values: ', error);
                            return { parcelId, valueData: null };
                        });
                });

                const taxUrls = parcelIds.map(parcelId => {
                    const url = "https://publicaccess.dekalbtax.org/datalets/datalet.aspx?mode=dek_profile&UseSearch=no&pin=" + parcelId;
                    return axios.get(url)
                        .then(response => {
                            const $ = cheerio.load(response.data);
                            const bills = dataBuilder.buildTaxData(parcelId, url, $);
                            const penalties = dataBuilder.buildTaxPenalties(parcelId, url, $);
                            return { parcelId, bills, penalties };
                        })
                        .catch(error => {
                            console.error('Error fetching taxes: ', error);
                            return { parcelId, bills: null, penalties: null };
                        });
                });

                const payoffUrls = parcelIds.map(parcelId => {
                    const url = "https://publicaccess.dekalbtax.org/datalets/datalet.aspx?mode=dek_prof_c10&UseSearch=no&pin=" + parcelId;
                    return axios.get(url)
                        .then(response => {
                            const $ = cheerio.load(response.data);
                            const payoff = dataBuilder.buildPayoffData(parcelId, url, $);
                            return { parcelId, payoff };
                        })
                        .catch(error => {
                            console.error('Error fetching taxes: ', error);
                            return { parcelId, payoff_data: null };
                        });
                });

                const dataResults = await Promise.all(dataUrls);
                const valueResults = await Promise.all(valueUrls);
                const taxResults = await Promise.all(taxUrls);
                const payoffResults = await Promise.all(payoffUrls);

                dataResults.forEach(result => {
                    const { parcelId, metadata } = result;
                    if (!resultsByParcelId[parcelId]) {
                        resultsByParcelId[parcelId] = { metadata, value: null, tax: null, payoff_data: null };
                    } else {
                        resultsByParcelId[parcelId].metadata = metadata;
                    }
                });

                valueResults.forEach(result => {
                    const { parcelId, valueData } = result;
                    if (!resultsByParcelId[parcelId]) {
                        resultsByParcelId[parcelId] = { metadata: null, value: valueData, tax: null, payoff_data: null };
                    } else {
                        resultsByParcelId[parcelId].value = valueData;
                    }
                });

                taxResults.forEach(result => {
                    const { parcelId, bills, penalties } = result;
                    if (!resultsByParcelId[parcelId]) {
                        resultsByParcelId[parcelId] = { metadata: null, value: null, tax: { bills, penalties }, payoff_data: null };
                    } else {
                        resultsByParcelId[parcelId].tax = { bills, penalties };
                    }
                });

                payoffResults.forEach(result => {
                    const { parcelId, payoff } = result;
                    if (!resultsByParcelId[parcelId]) {
                        resultsByParcelId[parcelId] = { metadata: null, value: null, tax: null, payoff };
                    } else {
                        resultsByParcelId[parcelId].payoff_data = payoff;
                    }
                });
            });

            Promise.all(pagePromises)
                .then(async results => {
                    const options = { ordered: true };
                    // var properties = Object.entries(resultsByParcelId).map(([key, value]) => ({ [key]: value }))
                    // var properties = Object.values(resultsByParcelId).map(obj => ({ ...obj }));
                    var properties = Object.entries(resultsByParcelId).map(([key, value]) => ({
                        parcelId: key,
                        ...value
                      }));
                    console.log(properties)
                    const result = await taxDeedDB.insertMany(properties, options);
                    console.log(`${result.insertedCount} documents were inserted`)
                })
                .catch(err => {
                    console.error('Error processing pages: ', err);
                });
        }).catch(error => {
            console.error('Error extracting text from PDF: ', error);
        });
    }
    finally {
		// await client.close();
	}
}

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

function splitPages(lines){
	const pageRegex = /^Page\s([1-9]\d{0,5}|10000)DQ205GADEK$/;
	let pages = [];
	let tempArray = [];

	lines.forEach(item => {
		if(pageRegex.test(item)){
			if(tempArray.length > 0){
				pages.push(tempArray)
			}
			tempArray = []
		} else {
			tempArray.push(item)
		}
	})
	// Push the remaining items if any
	if (tempArray.length > 0) {
		pages.push(tempArray);
	}
	return pages
}
run().catch(console.dir);