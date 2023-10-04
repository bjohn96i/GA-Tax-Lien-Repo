const fs = require('fs');
const pdf = require('pdf-parse');
const _ = require('lodash');
const { titles, tax_districts } = require('./options/meta')
async function extractTextFromPDF(pdfFilePath, pageNumber) {
    const dataBuffer = fs.readFileSync(pdfFilePath);
    const data = await pdf(dataBuffer, {max: pageNumber, normalizeWhitespace: true, disableCombineTextItems: true});
    return data.text;
}

const pdfFilePath = './files/test.pdf';
const pageNumber = 1333; // Change this to the desired page number

extractTextFromPDF(pdfFilePath, pageNumber).then(text => {
    let lines = text.trim().split('\n');
    lines = lines.filter(a => !titles.includes(a))
	lines = lines.filter(a => !Object.values(tax_districts).includes(a.trim()))

	const hsRegex = /^\d{1,8}-\d{1,8}[A-Za-z]?$/
	lines = lines.filter(a => !hsRegex.test(a));

	pages = splitPages(lines)
	console.log('pages '+ pages.length) 
	pages.forEach((page, index) => {
		const addressRegex = /^(?!\d+\s+\d+\s+\d+\s+\d+$)\d+\s+[\w\s]+$/;
		const parcelIdRegex = /^\d{7}$|^\d{2}\s\d{3}\s\d{2}\s\d{3}$/;
		const taxDistrictRegex = /^\d{2}$|^\d{1,2}[A-Z]|\bS\d+\b|\b\d+S\b|\bTAD\d+\b|\bTAD#\d+\b|\bT\d+\b|\bS\d+S\b|\bS\d+T\b|TDRV1|TSM1|TDEC1|S15$/;
		const nameRegex = /^[A-Z]+(?: [A-Z]+)+$/;
		const yearRegex = /^\d{4}$/;
		const dollarRegex = /^\$?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})$/;
		const dueDateRegex =  /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;

		amountDue = page.filter(a => dollarRegex.test(a.trim()));
		page = page.filter(a => !dollarRegex.test(a.trim()))

		taxYears = page.filter(a => yearRegex.test(a.trim()));
		page = page.filter(a => !yearRegex.test(a.trim()))

		dueDate = page.filter(a => dueDateRegex.test(a.trim()));
		page = page.filter(a => !dueDateRegex.test(a.trim()))

		parcelIds = page.filter(a => parcelIdRegex.test(a.trim()));
		page = page.filter(a => !parcelIdRegex.test(a.trim()))

		taxDistricts = page.filter(a => taxDistrictRegex.test(a.trim()));
		page = page.filter(a => !taxDistrictRegex.test(a.trim()))

		addresses = []
		page.shift()
		parcelIds.forEach((parcel, index) => {
			addresses.push(page[0])
			page.shift()
		})
		
		names = []
		dueDate.forEach((date, index) => {
			names.push(page[0])
			page.shift()
		})

		console.log(parcelIds.length)
		console.log(addresses.length)
		console.log(taxDistricts.length)

		console.log(amountDue.length)

		console.log(names.length)
		console.log(taxYears.length)
		console.log(dueDate.length)
		console.log('split')
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