const fs = require('fs');
const pdf = require('pdf-parse');
const _ = require('lodash');

async function extractTextFromPDF(pdfFilePath, pageNumber) {
    const dataBuffer = fs.readFileSync(pdfFilePath);
    const data = await pdf(dataBuffer, {max: pageNumber, normalizeWhitespace: true, disableCombineTextItems: true});
    return data.text;
}

const pdfFilePath = './files/test.pdf';
const pageNumber = 2485; // Change this to the desired page number

extractTextFromPDF(pdfFilePath, pageNumber).then(text => {
    let lines = text.trim().split('\n');
    titles = ['DELINQUENT TAX CROSS REFERENCE LISTING',
    'PENALTY/INTEREST DATE 08/31/23', 'OWNER NAME', 'TAX', 'YEAR', 'BK/', 'PG', 'TAX SALE #/',
    'CYCLE', 'PRINCIPAL', 'AMOUNT DUE', 'INTEREST', 'DUE', '10% TAX ', 'PENALTY',
    'FIFA', 'CHARGE', 'OTHER', 'TOTAL AMT','DUE', 'HS', 'TAX DISTRICT:',
    'GRAND TOTAL DUE', 'Page', 'S', 'A', 'F', 'CODE:', 'DO', 'DUE DATE:']

    tax_districts = {
        '04': 'UNINCORPORATED',
        '61': 'ATLANTA',
        '44': 'DORAVLLE',
        '44A': 'DORAVLLE ANX',
        '50': 'DUNWOODY',
        '80': 'STONECREST',
        '90': 'TUCKER',
        '24': 'CHAMBLEE',
        '24A': 'CHAMBLEE ANX',
        'S11': 'METRO SOUTH CID',
        '20': 'BROOKHAVEN',
        '92': 'DECATUR',
        '14': 'AVONDALE EST',
        '34A': 'CLARKSTN ANX',
        '34': 'CLARKSTN',
        '54': 'LITHONIA',
        '74': 'PINE LAKE',
        '84': 'STONE MTN',
        '84A': 'STN MTN ANX',
        '80': 'STONECREST',



    }

    lines = lines.filter(a => !titles.includes(a))
    // console.log(...lines)

    const dataObjects = [];
    const addressRegex = /^(?!\d+\s+\d+\s+\d+\s+\d+$)\d+\s+[\w\s]+$/;
    const parcelIdRegex = /^\d+\s+\d+\s+\d+\s+\d+$/;
    const taxDistrictRegex =/^\d{2}$|^\d{1,2}[A-Z]$/;
    const nameRegex = /^[A-Z]+(?: [A-Z]+)+$/;
    const yearRegex = /^\d{4}$/;
    const dollarRegex = /^\$?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})$/;
    const dueDateRegex =  /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;

    parcelIds = []
    addresses = []
    taxDistricts = []
    
    amountDue = []

    taxYears = []
    names = []
    dueDate = []

    lines.forEach(function callback(line, index) {
        line = line.trim();
        if (parcelIdRegex.test(line)) {
            console.log(`Valid parcel ID: ${line}`);
            parcelIds.push(line)
            return
        }
        if (nameRegex.test(line)) {
            if (Object.values(tax_districts).indexOf(line) == -1) {
                console.log(`Valid Name: ${line}`);
                names.push(line)
             }
        }
        if (addressRegex.test(line)) {
            console.log(`Valid address: ${line}`);
            addresses.push(line)
        }
        if (taxDistrictRegex.test(line)) {
            if (Object.keys(tax_districts).indexOf(line) > -1) {
                console.log(`Valid Tax District: ${line}`);
                taxDistricts.push(line)
             }
        }
        if (yearRegex.test(line)) {
            console.log(`Valid Year: ${line}`);
            taxYears.push(line)
        }
        if (dollarRegex.test(line)){
            console.log(`Valid Dollar Value: ${line}`)
            amountDue.push(line)
        }
        if (dueDateRegex.test(line)){
            console.log(`Valid Due Date: ${line}`)
            dueDate.push(line)
        }
    });

console.log(parcelIds.length)
console.log(addresses.length)
console.log(taxDistricts.length)

console.log(amountDue.length)

console.log(names.length)
console.log(taxYears.length)
console.log(dueDate.length)

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
// property_info.forEach( property => {
//     console.log(property)
// })
}).catch(error => {
    console.error(error);
});
