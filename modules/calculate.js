module.exports = {
    calculateTotalTaxPenalties: function calculateTotalTaxPenalties(taxPenalties){
        due = taxPenalties
        .slice(0, taxPenalties.length - 1)
        .map(obj => parseFloat(obj["Due"]
        .replace(/,/g, '')))
        .reduce((acc, val) => acc + val, 0)
        .toFixed(2)
    
        total_paid = taxPenalties
        .slice(0, taxPenalties.length - 1)
        .map(obj => parseFloat(obj["Paid"]
        .replace(/,/g, '')))
        .reduce((acc, val) => acc + val, 0)
        .toFixed(2)
    
        total_billed = taxPenalties
        .slice(0, taxPenalties.length - 1)
        .map(obj => parseFloat(obj["Billed"]
        .replace(/,/g, '')))
        .reduce((acc, val) => acc + val, 0)
        .toFixed(2)
    
        return { due, total_paid, total_billed }
    },
    calculateOutstanding: function calculateOutstanding(payoffData){
        const total_due = payoffData
        .filter(obj => obj.Installment === "Grand Total")
        .map(obj => obj)
        .map(obj => parseFloat(obj["Total"].replace(/,/g, '')))
        .reduce((acc, val) => acc + val, 0)
        .toFixed(2)
        
        const base = payoffData
        .filter(obj => obj.Installment === "Grand Total")
        .map(obj => obj)
        .map(obj => parseFloat(obj["Base"].replace(/,/g, '')))
        .reduce((acc, val) => acc + val, 0)
        .toFixed(2)
        
        const fees = payoffData
        .filter(obj => obj.Installment === "Grand Total")
        .map(obj => obj)
        .map(obj => parseFloat(obj["Penalty/Fees"].replace(/,/g, '')))
        .reduce((acc, val) => acc + val, 0)
        .toFixed(2)
    
        const intrest = payoffData
        .filter(obj => obj.Installment === "Grand Total")
        .map(obj => obj)
        .map(obj => parseFloat(obj["Interest"].replace(/,/g, '')))
        .reduce((acc, val) => acc + val, 0)
        .toFixed(2)
        
    
        return { total_due, base, fees, intrest }
    },
    calculatePriceData: function calculatePriceData(priceData, stabilityThreshold) {
        prices = priceData.map(obj => parseFloat(obj["Total"].replace(/,/g, '')))
        // Calculate Growth Factor: If the Returned Value is Above 1, the property has appreciated in value
        growthFactor = (prices[0]/prices[prices.length - 1]).toFixed(2)
    
        const n = prices.length;
        if (n <= 1) {
          return { last_appraised_value, growthFactor, standardDeviation: 0, stability: 'N/A'}; // If there's only one price, the deviation is zero
        }
      
        // Calculate Standard Deviation
        // Calculate the mean (average) of prices
        const mean = prices.reduce((sum, price) => sum + price, 0) / n;
        // Calculate the sum of squared differences from the mean
        const sumSquaredDiff = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0);
        // Calculate the variance and then the standard deviation
        const variance = sumSquaredDiff / n;
        const standardDeviation = Math.sqrt(variance).toFixed(4);
    
        // Determine if prices are stable
        const isStable = standardDeviation * stabilityThreshold;
        
        // Output result
        if (isStable >= Math.abs(prices[prices.length - 1] - prices[0])) {
            stability = 'Property Value is stable';
        } else {
            stability = 'Property Value is not stable';
        }
        return { growthFactor, standardDeviation, stability };
    }
}