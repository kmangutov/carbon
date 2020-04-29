var ccxt = require ('ccxt')
async function a() {
  const exchange = new ccxt.coinbasepro()
  let markets = await exchange.loadMarkets()
  console.log('markets: ' + JSON.stringify(markets))
}
a()