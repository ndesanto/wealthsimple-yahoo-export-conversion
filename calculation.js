/*
* Taken input from Wealthsimple CSV export and converts to Yahoo Finance compatible CSV
* input format:
* [
  "FHSA",
  "FHSA",
  "Self-Directed",
  "HQ6R1V761CAD",
  "CBIL",
  "TSX",
  "XTSE",
  "Global X 0-3 Month T-Bill ETF",
  "EXCHANGE_TRADED_FUND",
  "23.9886",
  "LONG",
  "50.0850",
  "CAD",
  "1198.49",
  "CAD",
  "1198.49",
  "CAD",
  "1201.469031",
  "CAD",
  "2.979031",
  "CAD"
]
* output format:
* Symbol,Current Price,Trade Date,Purchase Price,Quantity
*/

export function convertWealthsimpleToYahoo(wealthsimpleCSV) {
const outputRows = [];
  // Add header
  outputRows.push(['Symbol', 'Current Price', 'Trade Date', 'Purchase Price', 'Quantity']);

  for (let i = 1; i < wealthsimpleCSV.length; i++) { // skip header
    console.log(wealthsimpleCSV[i]);
    if (wealthsimpleCSV[i][0] == "" || wealthsimpleCSV[i][0].includes("As of"))
        {
console.log("skipping invalid row");
continue; // skip invalid rows
        } 
    const row = wealthsimpleCSV[i];
    const symbol = getSymbol(row[4], row[5]);
    const currentPrice = Number.parseFloat(row[11]).toFixed(4);
    const tradeDate = getTodayDateString();
    const purchasePrice = Number.parseFloat(row[11]) - (Number.parseFloat(row[19]) / Number.parseFloat(row[9])).toFixed(4);
    const quantity = row[9];

    if (symbol === "" || isNaN(currentPrice) || isNaN(purchasePrice) || isNaN(quantity)) {
        console.log("skipping row with invalid data");
        continue; // skip rows with invalid data
    }   
    outputRows.push([symbol, currentPrice, tradeDate, purchasePrice, quantity]);
  }

  return outputRows.map(r => r.join(',')).join('\n');
}

// Get today's date in YYYYMMDD format
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// Some symbols on Yahoo Finance require exchange suffixes
function getSymbol(symbol, exchange) {
    switch (exchange) {
        case 'TSX':
            return symbol + '.TO';
        case 'NASDAQ':
            return symbol;
        case 'NYSE':
            return symbol;
        case 'AMEX':
            return symbol;
        case 'OTC':
            return symbol + '.OB';
        case 'TSXV':
            return symbol + '.V';
        case 'CSE':
            return symbol + '.CN';
        case 'CBOE CANADA':
            return symbol + '.NE';
        default:
            return symbol;
    }
}