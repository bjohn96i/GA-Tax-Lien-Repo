const fs = require('fs');
const pdf = require('pdf-parse');
const _ = require('lodash');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = 'mongodb+srv://<username>:<password>@cluster0.ov11mon.mongodb.net/?retryWrites=true&w=majority';
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const { titles, tax_districts } = require('./options/meta')
async function extractTextFromPDF(pdfFilePath, pageNumber) {
    const dataBuffer = fs.readFileSync(pdfFilePath);
    const data = await pdf(dataBuffer, {max: pageNumber, normalizeWhitespace: true, disableCombineTextItems: true});
    return data.text;
}
async function run(){
	try {
		// Connect to the "insertDB" database and access its "haiku" collection
		const database = client.db("deedData");
		const taxDeedDB = database.collection("taxDeeds");

		const pdfFilePath = './files/test.pdf';
		const pageNumber = 2484; // Change this to the desired page number

		await extractTextFromPDF(pdfFilePath, pageNumber).then(text => {
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
		
				// Build Deeds
				let deed_info = []
				for(let i = 0; i < names.length; i++){
					deed_info.push(
						{
							owner_name: names[i],
							tax_year: taxYears[i],
							due_date: dueDate[i],
							principal_due: amountDue[i],
							interest_due: amountDue[i + names.length],
							tax_penalty_10: amountDue[i + (names.length*2)],
							fifa_charge: amountDue[i + (names.length*3)],
							other_charge: amountDue[i + (names.length*4)],
						}
					)
				}
				deed_info = _.groupBy(deed_info, owner => owner.owner_name);
		
				// Build Property Info
				let property_info = []
				for(let i = 0; i < parcelIds.length; i++){
					property_info.push(
						{
							address: addresses[i],
							tax_district: {
								district_number: taxDistricts[i],
								district_name: tax_districts[taxDistricts[i]]
							},
							parcel_id: parcelIds[i]
						}
					)
				}
				property_info = _(property_info)
				.groupBy('parcel_id')
				.map(_.spread(_.assign))
				.value();
		
				// Combine Property Info and Deeds
				for(let i = 0; i < property_info.length; i++){
					property_info[i].deeds = deed_info[Object.keys(deed_info)[i]]
				}
				// // Print Objects
				property_info.forEach( property => {
					console.log(property)
					// Insert the defined document into the "haiku" collection
					const result = taxDeedDB.insertOne(property);
					// Print the ID of the inserted document
					console.log(`A document was inserted with the _id: ${result.insertedId}`)
				})
			})
		
		}).catch(error => {
			console.error(error);
		});
	  } finally {
		await client.close();
	  }
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