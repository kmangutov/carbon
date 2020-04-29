
var sqlite3 = require('sqlite3').verbose();
const path = require('path')

import { Trade, Symbol } from "./CCXWSPricefeed";

//const dbPath = path.resolve(/*__dirname*/'d:\/', 'ts.db')

function decoratedDb(dbPath: string): any {
    var db = new sqlite3.Database(dbPath/*'memory:'*/);

    db.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
    };

    db.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, rows) {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    };

    db.runAsync = function (sql) {
        var that = this;
        console.log(sql)
        return new Promise(function (resolve, reject) {
            that.run(sql, function(err) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        })
    };

    return db;
}



const TABLE_SYMBOLS = `CREATE TABLE IF NOT EXISTS Symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base VARCHAR(10),
    quote VARCHAR(10),
    exchange VARCHAR(40),
    marketId VARCHAR(40)
)`

//FOREIGN KEY(symbol) REFERENCES Symbols(id),
const TABLE_TRADES = `CREATE TABLE IF NOT EXISTS Trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol INTEGER,
    timestamp INTEGER,
    amount FLOAT,
    price FLOAT,
    side SMALLINT,
    buyOrderId VARCHAR(15),
    sellOrderId VARCHAR(15)
)`

export class DbAccess {

    symbols = []
    db = null;

    // db: sqlite3 instance
    public constructor(dbPath: string) {
        this.db = decoratedDb(dbPath)

    }

    async insertTradeO(trade: Trade) {
        const symbolId = this.lookupSymbol(trade['base'], trade['quote'], trade['exchange'])
        
        if (symbolId === -1) console.error("SYMBOL NOT FOUND FOR " + JSON.stringify(trade))

        this.insertTrade(
            symbolId, 
            trade.timestamp, 
            trade.amount,
            trade.price, 
            trade.side,  
            "", //buyOrderId
            "") //sellOrderId
    }

    // TODO: These should use % strformating
    async insertTrade(symbolId, timestamp, amount, price, side, buyOrderId, sellOrderId) {
        const sql = "INSERT INTO Trades " +
                    "(symbol, timestamp, amount, price, side, buyOrderId, sellOrderId) VALUES ("
                    +
                    symbolId + ", " + timestamp + ", " + amount + ", " + price + ", " + side + ", '" + buyOrderId + "', '" + sellOrderId
                    +
                    "')"
        await this.db.runAsync(sql);
    }

    async insertSymbol(id, base, quote, exchange, marketId) {
        const sql =   "INSERT INTO Symbols " +  
                    "(id, base, quote, exchange, marketId) VALUES ('" +
                    +
                    id + "', '" + base + "', '" + quote + "', '" + exchange + "', '" + marketId + "'"
                    +
                    ") ON CONFLICT(id) DO UPDATE SET id=id;";
        //console.log(sql)
        await this.db.runAsync(sql);
    }

    //For a reported trade, look up the corresponding index in symbols db
    lookupSymbol(base, quote, exchange) {
        // TODO make sure symbols is initailized
         // CHECK SYMBOL for base,quote,exchange
        for(let symbolIndex in this.symbols) {
            
            const symbol = this.symbols[symbolIndex]
            
            //console.log("check " + JSON.stringify(symbol) + " vs " + base + "," + quote + "," + exchange)

            if(symbol['base'] == base
                && symbol['quote'] == quote
                && (symbol['exchange'] == exchange
                    || (symbol['exchange'] == 'Coinbase' && exchange == 'CoinbasePro'))) {
                
                return symbol['id']
            }
        }
        return -1
    }

    async getSymbols() {
        const LIST_SYMBOLS = "SELECT * FROM Symbols;"
        this.symbols = await this.db.allAsync(LIST_SYMBOLS);
        return this.symbols
    }

    async listSymbols() {
        console.log('symbols: ' + JSON.stringify(await this.getSymbols()));
    }

    async buildSymbolsTable() {
        await this.db.runAsync(TABLE_SYMBOLS);
        this.insertSymbol("0", "BTC", "USDT", "Binance", "BTCUSDT")
        this.insertSymbol("1", "ETH", "BTC", "Binance", "ETHBTC")
        this.insertSymbol("2", "BTC", "USD", "Coinbase",  "BTC-USD")
        this.insertSymbol("3", "ETH", "BTC", "Coinbase", "ETH-BTC")
    }

    async buildTradesTable() {
        await this.db.runAsync(TABLE_TRADES);
    }
}

/*async function main() {
    await new DbAccess().listSymbols(); 
    let trades: string = await db.allAsync("SELECT * FROM Trades ORDER BY id DESC LIMIT 50;");   
    console.log(JSON.stringify(trades))
}*/

//main()

/*async function main() {
    const dbAccess = new DbAccess();
    await dbAccess.dropSymbolsTable();
    await dbAccess.buildSymbolsTable();
    await dbAccess.listSymbols();
}*/