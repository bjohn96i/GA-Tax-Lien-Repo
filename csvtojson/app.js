const pdf = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

async function extractTextFromPDF(pdfFilePath, pageNumber) {
    const dataBuffer = fs.readFileSync(pdfFilePath);
    const data = await pdf(dataBuffer, {max: pageNumber, normalizeWhitespace: true, disableCombineTextItems: true});
    return data.text;
}

const pdfFilePath = './files/test.pdf';
const pageNumber = 1; // Change this to the desired page number
extractTextFromPDF(pdfFilePath, pageNumber).then(text => {
    let lines = text.trim().split('\n');

    pages = splitPages(lines)
    console.log('pages '+ pages.length) 
    pages.forEach((page, index) => {
        const parcelIdRegex = /^\d{7}$|^\d{2}\s\d{3}\s\d{2}\s\d{3}$/;

        parcelIds = page.filter(a => parcelIdRegex.test(a.trim()));
        page = page.filter(a => !parcelIdRegex.test(a.trim()))

        console.log(parcelIds.length)
        console.log(parcelIds)

        const parcelInfo = parcelIds.map((parcelId, index) => {
            const url = "https://propertyappraisal.dekalbcountyga.gov/datalets/datalet.aspx?mode=profileall&UseSearch=no&pin="+parcelId
            console.log(`Processing Parcel ID ${parcelId} at index ${index}. URL: ${url}`);
            console.log(`Request started for Parcel ID ${parcelId} at ${new Date().toISOString()}`);
            return axios.get(url)
                .then(response => {
                    console.log(`Request ended for Parcel ID ${parcelId} at ${new Date().toISOString()}`);
                    const $ = cheerio.load(response.data);
                    return buildData(parcelId, url, $)
                })
                .catch(error => {
                    console.error('Error: ', error)
                    return null
                })
        })
        const parcelValues = parcelIds.map((parcelId, index) => {
            const url = "https://publicaccess.dekalbtax.org/datalets/datalet.aspx?mode=value_history&UseSearch=no&pin="+parcelId
            console.log(`Processing Parcel Values at ID ${parcelId} at index ${index}. URL: ${url}`);
            console.log(`Request started for Parcel Values at ID ${parcelId} at ${new Date().toISOString()}`);
            return axios.get(url)
                .then(response => {
                    console.log(`Request ended for  Parcel Values ID ${parcelId} at ${new Date().toISOString()}`);
                    const $ = cheerio.load(response.data);
                    isareturn buildValueData(parcelId, url, $)
                })
                .catch(error => {
                    console.error('Error: ', error)
                    return null
                })
        })
        async function foo() {
            return Promise.resolved('hello');
        }
        async
    })
}).catch(error => {
    console.error(error);
});

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

function buildData(parcelId, url, $){
    const status = $('#Parcel > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2)').text().trim()
    const altPID = $('#Parcel > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2)').text().trim()
    const address = $('#Parcel > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(2)').text().trim()
    const unit = $('#Parcel > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(2)').text().trim()
    const city = $('#Parcel > tbody:nth-child(1) > tr:nth-child(6) > td:nth-child(2)').text().trim()
    const zipCode = $('#Parcel > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(2)').text().trim()
    const neighborhood = $('#Parcel > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2)').text().trim()
    const superNBHD = $('#Parcel > tbody:nth-child(1) > tr:nth-child(9) > td:nth-child(2)').text().trim()
    const classZone = $('#Parcel > tbody:nth-child(1) > tr:nth-child(10) > td:nth-child(2)').text().trim()
    const landuse = $('#Parcel > tbody:nth-child(1) > tr:nth-child(11) > td:nth-child(2)').text().trim()
    const livingUnits = $('#Parcel > tbody:nth-child(1) > tr:nth-child(12) > td:nth-child(2)').text().trim()
    const zoning = $('#Parcel > tbody:nth-child(1) > tr:nth-child(13) > td:nth-child(2)').text().trim()
    const apraiser = $('#Parcel > tbody:nth-child(1) > tr:nth-child(14) > td:nth-child(2)').text().trim()

    // Mailing Address
    $('#datalet_div_2 > table > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1)').last().each((index, element) => {
        mailingAddress = []
        $(element).contents().each((index, element) => {
            if($(element).text() != ""){
                mailingAddress.push($(element).text())
            }
        })
    });
    
    // Owners
    $('#datalet_div_3 > table > tbody:nth-child(1) > tr:nth-child(2)').last().each((index, element) => {
        owner = []
        $(element).contents().each((index, element) => {
            if ($(element).text() != ""){
                owner.push($(element).text())
            }
        })
    })

    return({
        parcel_information: {
            status: status,
            parcel_id: parcelId,
            alternate_parcel_id: altPID,
            address: address, 
            address_unit: unit,
            city: city,
            zip_code: zipCode,
            neighborhood: neighborhood,
            superNBHD: superNBHD,
            class: classZone,
            land_code: landuse,
            livingUnits: livingUnits,
            zoning: zoning,
            appraiser: apraiser,
            owners: owner,
            ownermailingAddress: mailingAddress,
            apraisalUrl: url,
            propertyMapUrl: 'https://publicaccess.dekalbtax.org/maps/map.aspx?UseSearch=no&pin='+parcelId
        }
    })
}

function buildValueData(parcelId, url, $){
    $('#datalet_div_0 > table > tbody:nth-child(1)').last().each((index, element) => {
        appraisedValues = []
        $(element).contents().each((index, element) => {
            values = []
            $(element).contents().each((index, element) => {
                if ($(element).text() != ""){
                    values.push(($(element).text()))
                }
            })
            appraisedValues.push(values)
        })
    })
    $('#datalet_div_1 > table > tbody:nth-child(1)').last().each((index, element) => {
        assessedValues = []
        $(element).contents().each((index, element) => {
            values = []
            $(element).contents().each((index, element) => {
                if ($(element).text() != ""){
                    values.push(($(element).text()))
                }
            })
            assessedValues.push(values)
        })
    })
    return({
        parcel_id: parcelId,
        parcel_information: {
            appraisedValues: appraisedValues,
            assessedValues: assessedValues,
        }
    })
}
