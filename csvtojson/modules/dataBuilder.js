function buildJSON(data){
    const headers = data[0];
    const result = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      const obj = {};
      const values = data[i];
    
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        obj[key] = values[j];
      }
    
      result.push(obj);
    }
    return result
}
module.exports = {
    buildData: function buildData(parcelId, url, $){
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
            },
            urls: {
                apraisalUrl: url,
                propertyMapUrl: 'https://publicaccess.dekalbtax.org/maps/map.aspx?UseSearch=no&pin='+parcelId,
                realViewMap: 'https://publicaccess.dekalbtax.org/pictometry/pictometryipa.aspx?UseSearch=no&pin='+parcelId
            }
        })
    },
    
    buildValueData: function buildValueData(parcelId, url, $){
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
            appraisedValues: buildJSON(appraisedValues),
            assessedValues: buildJSON(assessedValues),
        })
    },
    
    buildTaxPenalties: function buildTaxPenalties(parcelId, url, $){
        $('#datalet_div_5 > table > tbody:nth-child(1)').last().each((index, element) => {
            taxPenalties = []
            $(element).contents().each((index, element) => {
                values = []
                $(element).contents().each((index, element) => {
                    if ($(element).text() != ""){
                        values.push($(element).text())
                    }
                    else {
                        values.push("N/A")
                    }
                })
                taxPenalties.push(values)
                // console.log(values)
            })
        })
    
        return({
            tax_penalties: buildJSON(taxPenalties),
        })
    },
    
    buildTaxData: function buildTaxData(parcelId, url, $){
        $('#datalet_div_7 > table > tbody:nth-child(1)').last().each((index, element) => {
            taxBills = []
            $(element).contents().each((index, element) => {
                values = []
                $(element).contents().each((index, element) => {
                    if ($(element).text() != ""){
                        if($(element).text() == "Click Here"){
                            values.push($(element).find('a').attr('href'))
                        }
                        else{
                            values.push($(element).text())
                        }
                    }
                    else {
                        values.push("N/A")
                    }
                })
                taxBills.push(values)
                // console.log(values)
            })
        })
    
        return({
            bills: buildJSON(taxBills),
        })
    },

    buildPayoffData: function buildPayoffData(parcel_id, url, $){
        $('#datalet_div_0 > table > tbody:nth-child(1)').last().each((index, element) => {
            payoffData = []
            $(element).contents().each((index, element) => {
                values = []
                $(element).contents().each((index, element) => {
                    // console.log($(element).text())
                    values.push(($(element).text()).trim())
                })
                payoffData.push(values)
                // console.log(values)
            })
        })
        return({
            payoff_data: buildJSON(payoffData),
        })
    }
}
