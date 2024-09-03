const express = require("express");
const { Property } = require("../models/deed");
const format = require("../modules/format");
const calculate = require("../modules/calculate");

const router = express.Router();

router.get("/", async (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  try {
    const allProperties = await Property.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort("metadata.parcel_information.address");

    const count = await Property.countDocuments();

    res.json({
      metadata: {
        count: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
      data: allProperties,
    });
  } catch (err) {
    console.error(err.message);
  }
});

router.get("/:id(\\w{24})", async (req, res) => {
  const { id } = req.params;

  property = await Property.findById(id)
    .then((result) => res.status(200).send(result))
    .catch((err) => {
      console.log(err);
      res.status(400).json({
        message: "Property ID Not Found.",
      });
    });
});

router.get("/potential/:id", async (req, res) => {
  const { id } = req.params;
  property_data = await Property.findById(id).catch((err) => {
    console.log(err);
    res.status(400).json({
      message: "Property ID Not Found.",
    });
  });

  if (!property_data) {
    res.status(404).json({
      message: "Property ID Not Found.",
    });
  } else {
    const priceData = property_data.value.appraisedValues; // Replace this with your price data array
    const stabilityThreshold = 1.2; // Set your stability threshold here

    const valuation = calculate.calculatePriceData(
      priceData,
      stabilityThreshold
    );
    const outstanding = calculate.calculateOutstanding(
      property_data.payoff_data.payoff_data
    );
    const penalties = calculate.calculateTotalTaxPenalties(
      property_data.tax.penalties.tax_penalties
    );
    valuation.net_sale_profit = (
      parseFloat(
        property_data.value.appraisedValues[0].Total.replace(/,/g, "")
      ) - parseFloat(outstanding.total_due)
    ).toFixed(2);
    valuation.tax_deed_profit = (
      parseFloat(outstanding.total_due) * 0.3
    ).toFixed(2);

    // Get Address
    res.status(200).json({
      propertyAddress: format.formatAddress(
        property_data.metadata.parcel_information
      ),
      zone: property_data.metadata.parcel_information.class,
      class: property_data.metadata.parcel_information.zoning,
      landUse: property_data.metadata.parcel_information.land_code,
      ownerInfo: format.formatOwnerInformation(
        property_data.metadata.parcel_information
      ),
      dueDilligence: property_data.metadata.urls,
      valuation: {
        last_appraised_value:
          property_data.value.appraisedValues[0].Total.replace(/,/g, ""),
        last_assessment_estimated:
          parseFloat(
            property_data.value.appraisedValues[0].Total.replace(/,/g, "")
          ) * 0.4,
        last_assessed_actual: property_data.value.assessedValues[0][
          "Taxable Value"
        ].replace(/,/g, ""),
        potential: valuation,
      },
      deliquent_taxes: outstanding,
      tax_liability: penalties,
    });
  }
});

router.get("/search", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const {
      status,
      address,
      city,
      zip,
      propertyClass,
      code,
      appraiser,
      owners,
    } = req.query;

    let query = {};

    if (status) {
      query["metadata.parcel_information.status"] = {
        $regex: status,
        $options: "i",
      };
    }
    if (address) {
      query["metadata.parcel_information.address"] = {
        $regex: address,
        $options: "i",
      };
    }
    if (city) {
      query["metadata.parcel_information.city"] = {
        $regex: city,
        $options: "i",
      };
    }
    if (zip) {
      query["metadata.parcel_information.zip_code"] = {
        $regex: zip,
        $options: "i",
      };
    }
    if (propertyClass) {
      query["metadata.parcel_information.class"] = {
        $regex: propertyClass,
        $options: "i",
      };
    }
    if (code) {
      query["metadata.parcel_information.land_code"] = {
        $regex: code,
        $options: "i",
      };
    }
    if (appraiser) {
      query["metadata.parcel_information.appraiser"] = {
        $regex: appraiser,
        $options: "i",
      };
    }
    if (owners) {
      query["metadata.parcel_information.owners"] = {
        $regex: owners,
        $options: "i",
      };
    }

    const properties = await Property.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort("metadata.parcel_information.address");

    const count = await Property.countDocuments();

    res.json({
      metadata: {
        count: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
      data: properties,
    });
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
