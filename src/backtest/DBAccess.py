import sqlite3
import backtrader as bt
import pandas as pd
import datetime

# conn = sqlite3.connect('./data/trades.sqlite')
conn = sqlite3.connect("d:/ts.db")


def sample():
    c = conn.cursor()
    rows = c.execute("SELECT * FROM Trades ORDER BY timestamp DESC LIMIT 1000")
    for row in rows:
        print(row)
    return rows


def sample_df():
    c = conn.cursor()
    rows = c.execute(
        "SELECT * FROM Trades WHERE Symbol=0 ORDER BY timestamp ASC LIMIT 500"
    )
    df = pd.DataFrame()

    for row in rows:
        price = row[4]
        qty = row[3]
        timestamp = row[2]
        timestamp = datetime.datetime.utcfromtimestamp(int(timestamp) / 1000)
        d = {
            "datetime": timestamp,
            "open": price,
            "high": price,
            "low": price,
            "close": price,
            "volume": qty,
        }

        frame = pd.DataFrame(data=d, index=[0])
        df = df.append(frame)
    df.set_index("datetime", inplace=True)
    return df


def sample_cerebro():
    return bt.feeds.PandasData(
        dataname=sample_df(), timeframe=bt.TimeFrame.Ticks
    )

