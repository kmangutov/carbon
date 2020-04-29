import { DbAccess } from "./pricefeed/DBAccess";
const ccxws = require("ccxws");
const path = require('path')

const dbPath = path.resolve(/*__dirname*/'d:\/', 'ts.db')
const dbAccess = new DbAccess(dbPath);


function onTrade(trade, market) {
  const symbolId = dbAccess.lookupSymbol(trade['base'], trade['quote'], trade['exchange'])
  let side: number = "buy".localeCompare(trade.side) == 0? 0 : 1;//buy = 0

  if (symbolId === -1) console.error("SYMBOL NOT FOUND FOR " + JSON.stringify(trade))

  console.log('corresponding trade symbolId: ' + symbolId)

  dbAccess.insertTrade(
    parseInt(symbolId), 
    parseInt(trade.unix), 
    parseFloat(trade.amount),
    parseFloat(trade.price), 
    side,  
    "", //buyOrderId
    "") //sellOrderId
}


let exchanges = []
let symbols = []


async function main() {
  await dbAccess.buildSymbolsTable();
  await dbAccess.buildTradesTable();

  symbols = await dbAccess.getSymbols();
  for(let symbolId in symbols) {
    const symbol = symbols[symbolId]

    var exchange;

    if(symbol['exchange'] == 'Binance') {
      exchange = new ccxws.binance();
    } else if(symbol['exchange'] == 'Coinbase') {
      exchange = new ccxws.coinbasepro();
    }

    const market = { 
      id: symbol['marketId'],
      base: symbol['base'],
      quote: symbol['quote']
    }

    exchange.subscribeTrades(market);
    exchange.on("trade", onTrade);
    exchanges.push(exchange)
  }
}

main();