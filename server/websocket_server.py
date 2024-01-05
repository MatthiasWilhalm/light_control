import asyncio
import websockets
import threading

class WebSocketServer(threading.Thread):
    def __init__(self, host, port):
        super().__init__()
        self.host = host
        self.port = port
        self.loop = None

    async def echo(self, websocket, path):
        async for message in websocket:
            await websocket.send(message)
            print("received data via websocket: " + message)

    def run(self):
        print("WebSocket server starting on " + self.host + ":" + str(self.port))
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        start_server = websockets.serve(self.echo, self.host, self.port)
        self.loop.run_until_complete(start_server)
        self.loop.run_forever()

    def stop(self):
        self.loop.call_soon_threadsafe(self.loop.stop)