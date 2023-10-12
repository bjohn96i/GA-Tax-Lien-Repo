const express = require('express')
const { Property } = require('../models/deed')

const router = express.Router();

router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const allProperties = await Property.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('address');

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