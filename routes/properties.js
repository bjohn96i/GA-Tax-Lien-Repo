const express = require('express')
const { Property } = require('../models/deed')
const format = require('../modules/format')
const calculate = require('../modules/calculate')

const router = express.Router();

router.get('/', async (req, res) => {
    const { page = 1, limit = 5 } = req.query;
    try {
        const allProperties = await Property.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('metadata.parcel_information.address');

        const count = await Property.countDocuments();

        res.json({
            metadata: {
                count: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
            },
            data: allProperties
        });
    } catch (err) {
        console.error(err.message);
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    property = await Property.findById(id).then(result => res.status(200).send(result))
    .catch(err => {
        console.log(err)
        res.status(400).json({
            message: "Property ID Not Found."
        })
    });
});

router.get('/potential/:id', async (req, res) => {
    const { id } = req.params;
    property_data = await Property.findById(id)
    .catch(err => {
        console.log(err)
        res.status(400).json({
            message: "Property ID Not Found."
        })
    });
    
    if(!property_data){
        res.status(404).json({
            message:"Property ID Not Found."
        })
    } else {
        const priceData = property_data.value.appraisedValues; // Replace this with your price data array
        const stabilityThreshold = 1.2; // Set your stability threshold here
        
        const valuation = calculate.calculatePriceData(priceData, stabilityThreshold)
        const outstanding = calculate.calculateOutstanding(property_data.payoff_data.payoff_data)
        const penalties = calculate.calculateTotalTaxPenalties(property_data.tax.penalties.tax_penalties)
        valuation.net_sale_profit = (parseFloat(property_data.value.appraisedValues[0].Total.replace(/,/g, '')) - parseFloat(outstanding.total_due)).toFixed(2)
        valuation.tax_deed_profit = (parseFloat(outstanding.total_due) * .3).toFixed(2)
        
        // Get Address
        res.status(200).json(({
            propertyAddress: format.formatAddress(property_data.metadata.parcel_information),
            zone: property_data.metadata.parcel_information.class,
            class: property_data.metadata.parcel_information.zoning,
            landUse: property_data.metadata.parcel_information.land_code,
            ownerInfo: format.formatOwnerInformation(property_data.metadata.parcel_information),
            dueDilligence: property_data.metadata.urls,
            valuation: {
                last_appraised_value: property_data.value.appraisedValues[0].Total.replace(/,/g, ''),
                last_assessment_estimated: (parseFloat(property_data.value.appraisedValues[0].Total.replace(/,/g, '')) * .4),
                last_assessed_actual: property_data.value.assessedValues[0]["Taxable Value"].replace(/,/g, ''),
                potential: valuation,
            },
            deliquent_taxes: outstanding,
            tax_liability: penalties
        }))
    }
});

router.get('/search/:term', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const foundProperties = await Property.aggregate([
            {
              $search: {
                index: "default",
                text: {
                  query: `${req.params.term}`,
                  path: [ "address", "parcel_id", "tax_district.district_name" ]
                }
              }
            },
            {
                $project: {
                    "_id": 1,
                    "address": 1,
                    "parcel_id": 1,
                    "tax_district.district_name": 1,
                    "deeds.owner_name": 1,
                    "deeds.tax_year": 1,
                    "deeds.due_date": 1,

                }
            },
            {
                $facet: {
                  metadata: [ 
                    {$count: 'count'},
                    { $addFields: { totalPages: { $ceil: {$divide: [ "$total", parseInt(limit) ] }} }},
                    { $addFields: { currentPage: parseInt(page) } }
                ],
                  data: [ { $skip: (parseInt(page)-1)* parseInt(limit)}, { $limit: parseInt(limit) } ]
              }
            },
            {
                "$set" : 
                {
                  "metadata" : { "$arrayElemAt" : [ "$metadata" , 0 ] },
                }
            } 
          ])
        res.json(foundProperties[0]);
    } catch (err) {
        console.error(err.message);
    }
})

module.exports = router