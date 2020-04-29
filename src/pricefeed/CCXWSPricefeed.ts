import { DbAccess } from "./DBAccess";
const ccxws = require("ccxws");

// Represents database schema.
export class Symbol {
  // id refers to database column
  public id?: string;
  public base: string;
  public quote: string;
  public exchange: string; 
  public marketId: string;

  public constructor(init?:Partial<Symbol>) {
    Object.assign(this, init);
  }

  public toCCXWS(): any
  {
    // When connecting to CCXWS, disambiguate 'id' field 
    return { 
      id: this.marketId,
      base: this.base,
      quote: this.quote
    }
  }
}

export class Trade {
  public timestamp: number;
  public amount: number;
  public price: number;
  public side: number;
  
  public constructor(init?:Partial<Trade>) {
    Object.assign(this, init);
  }
}

export interface TradeListener {
  onTrade(trade: Trade): void;
}

export class CCXWSPricefeed {
  private tradeListener: TradeListener

  public setTradeListener(listener: TradeListener): void {
    this.tradeListener = listener;
  }

  private onTrade(trade, market) {
    let side: number = "buy".localeCompare(trade.side) == 0? 0 : 1;//buy = 0
    
    let parsedTrade: Trade = new Trade({
      timestamp: trade.unix, 
      amount: trade.amount, 
      price: trade.price, 
      side: side
    })

    let parsedSymbol: Symbol = new Symbol({
      marketId: market.id,
      base: market.base,
      quote: market.quote
    })
    
    console.log('trade:\n' + JSON.stringify(trade))
    console.log('market:\n' + JSON.stringify(market))


    if (this.tradeListener != null) {
      this.tradeListener.onTrade(parsedTrade);
    }
  }

  public connect(symbol: Symbol): void {
    let exchange: any;

    // TODO: These are class members -- symbol is not a dict anymore
    if(symbol['exchange'] == 'Binance') {
      exchange = new ccxws.binance();
    } else if(symbol['exchange'] == 'Coinbase') {
      exchange = new ccxws.coinbasepro();
    }

    // TODO: Keep track of exchange subscriptions & unsubscribe onShutdown
    exchange.subscribeTrades(symbol.toCCXWS());
    exchange.on("trade", this.onTrade);
  }
}
