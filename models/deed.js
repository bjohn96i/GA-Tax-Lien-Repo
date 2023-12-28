const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({
    parcelId: {
      type: String
    },
    metadata: {
      parcel_information: {
        status: String,
        alternate_parcel_id: String,
        address: String,
        address_unit: String,
        city: String,
        zip_code: String,
        neighborhood: String,
        superNBHD: String,
        class: String,
        land_code: String,
        livingUnits: String,
        zoning: String,
        appraiser: String,
        owners: [String],
        ownermailingAddress: [String]
      },
      urls: {
        apraisalUrl: String,
        propertyMapUrl: String,
        realViewMap: String
      }
    },
    value: {
      appraisedValues: [{
        'Tax Year': String,
        Class: String,
        Land: String,
        Building: String,
        Total: String
      }],
      assessedValues: [{
        'Tax Year': String,
        Class: String,
        'Taxable Value': String
      }]
    },
    tax: {
      bills: {
        bills: [{
          'Tax Year': String,
          'Bill Type': String,
          Download: String
        }]
      },
      penalties: {
        tax_penalties: [{
          Year: String,
          Cycle: String,
          Billed: String,
          Paid: String,
          Due: String
        }]
      }
    },
    payoff_data: {
      payoff_data: [{
        Year: String,
        Installment: String,
        Base: String,
        'Penalty/Fees': String,
        Interest: String,
        Total: String
      }]
    }
  }, { collection : 'taxDeeds' });
  
PropertySchema.index({
    'metadata.parcel_information.address': 'text',
    parcelId: 'text',
    'metadata.parcel_information.neighborhood': 'text',
    'metadata.parcel_information.class': 'text',
    'metadata.parcel_information.land_code': 'text',
    'metadata.parcel_information.city': 'text'
});
const Property = mongoose.model("Property", PropertySchema);

module.exports = {
    Property
};
