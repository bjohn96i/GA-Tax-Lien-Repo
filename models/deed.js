const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({
        "address": {
            type: String,
            required: true
        },
        "tax_district": {
            "district_number": {
                type: String,
                required: true,
            },
            "district_name": {
                type: String,
                required: true
            }
        },
        "parcel_id": {
            type: String,
            required: true
        },
        "deeds": [{
            "owner_name":{
                type: String,
                required: true
            },
            "tax_year": {
                type: String,
                required: true,
            },
            "due_date": {
                type: String,
                required: true,
            },
            "principal_due": {
                type: String,
                required: true,
            },
            "interest_due": {
                type: String,
                required: true,
            },
            "tax_penalty_10": {
                type: String,
                required: true,
            },
            "fifa_charge": {
                type: String,
                required: true,
            },
            "other_charge": {
                type: String,
                required: true,
            }
        }]
}, { collection : 'taxDeeds' });
PropertySchema.index({ address: 'text', parcel_id: 'text', "tax_district.district_name": 'text', "deeds.owner_name": 'text' });
const Property = mongoose.model("Property", PropertySchema);

module.exports = {
    Property
};
