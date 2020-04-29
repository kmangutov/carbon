
import { Trade, Symbol, TradeListener, CCXWSPricefeed } from "./CCXWSPricefeed";
import { DbAccess } from "./DBAccess";
import { Interface } from "./Interface";
import yargs = require('yargs');

const dbPathDefault = './trades.sqlite'
const argv = yargs.options({
    dbpath: { type: 'string', default: dbPathDefault }
}).argv;

async function main() {
    let d: DbAccess = new DbAccess(argv.dbpath);
    await d.buildSymbolsTable();
    await d.buildTradesTable();

    let symbols = await d.getSymbols();
    console.log(JSON.stringify(symbols))

    let s: Symbol = new Symbol({
            exchange: "Binance",
            marketId: "BTCUSDT",
            base: "BTC",
            quote: "USDT"
        });
    
    class Feed implements TradeListener {

        public onTrade(t: Trade): void {
            console.log('feed receive ' + JSON.stringify(t))
            d.insertTradeO(t)
        }
    }

    let p: CCXWSPricefeed = new CCXWSPricefeed();
    p.connect(s)
    p.setTradeListener(new Feed());
}

main();