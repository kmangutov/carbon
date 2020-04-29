import * as ws from 'ws'

type MessageCallback = (message: string) => void

// WebSocket server
export class Interface {
    private wss = new ws.Server({port: 8080})
    private state = {}
    private open: boolean = false

    private frequencyMs: number = 1000
    private callback: MessageCallback

    public constructor(callback: MessageCallback) {
        this.callback = callback
    }

    public setState(state: any) {
        this.state = state
    }

    public start() {
        this.wss.on('connection', (ws) => {
            this.open = true
            let intervalFunction: NodeJS.Timeout

            ws.on('error', (e) => {
                console.log('websocket error: ' + e)
                this.open = false
                clearInterval(intervalFunction)
            })

            ws.on('close', () => {
                this.open = false
                clearInterval(intervalFunction)
            })

            if (this.callback != null) {
                ws.on('message', this.callback)
            }

            intervalFunction = setInterval(() => {
                if (this.open) {
                    ws.send(JSON.stringify(this.state))
                }
            }, this.frequencyMs)
        })
    }
}
