module.exports = {
    formatAddress: function formatAddress(property_metadata){
        property_metadata.address = property_metadata.address
        .replace(/(^\s*)|(\s*$)/gi,"")
        .replace(/[ ]{2,}/gi," ")
        .replace(/\n /,"\n"); 
    
        property_metadata.zip_code = property_metadata.zip_code
        .replace('-', '')
    
        return `${property_metadata.address}, ${property_metadata.city}, GA ${property_metadata.zip_code}`
    },
    formatOwnerInformation: function formatOwnerInformation(property_metadata){
        return {
            name: property_metadata.ownermailingAddress[0],
            address: `${property_metadata.ownermailingAddress[1]}, ${property_metadata.ownermailingAddress[2]}`
        }
    }
}