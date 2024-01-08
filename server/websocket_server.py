import asyncio
import websockets
import threading
import json

class WebSocketServer(threading.Thread):
    def __init__(self, host, port, serial_connection, logger):
        super().__init__()
        self.host = host
        self.port = port
        self.serial_connection = serial_connection
        self.logger = logger
        self.loop = None
        
    async def _msg_received(self, websocket, path):
        async for message in websocket:
            res = json.loads(message)
            path = res['path']
            body = res['body']
            
            if path == '/setlight':
                light_index = body['index']
                light_state = 1 if body['state'] == True else 0
                self.logger.log("Setting light " + str(light_index) + " to " + str(light_state), True)
                self._send_serial_msg(str(light_index) + "," + str(light_state))
            elif path == '/reset':
                self.logger.log("Resetting lights", True)
                self._send_serial_msg("reset")
            elif path == '/setall':
                self.logger.log("Setting all lights to " + str(body), True)
                self._send_serial_msg("set" + str(body))
            else:
                print("Unknown path: " + path)
                            
    async def send_msg(self, msg):
        async with websockets.connect('ws://' + self.host + ':' + str(self.port)) as websocket:
            await websocket.send(msg)

    def run(self):
        print("WebSocket server starting on " + self.host + ":" + str(self.port))
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        start_server = websockets.serve(self._msg_received, self.host, self.port)
        self.loop.run_until_complete(start_server)
        self.loop.run_forever()

    def stop(self):
        self.loop.call_soon_threadsafe(self.loop.stop)
        
        # sends a message to the serial connection
    def _send_serial_msg(self, msg):
        print("Sending serial message: " + msg)
        res = str(msg).encode('utf-8')
        self.serial_connection.write(res)