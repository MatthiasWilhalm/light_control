import asyncio
import websockets
import threading
import json

class WebSocketServer(threading.Thread):
    def __init__(self, host, port, serial_connection, operation_logger, nback_logger, light_logger, storage):
        super().__init__()
        self.host = host
        self.port = port
        self.serial_connection = serial_connection
        self.operation_logger = operation_logger
        self.nback_logger = nback_logger
        self.light_logger = light_logger
        self.storage = storage
        self.loop = None
        self.active_connections = {}
        self.packageTracker = 0 # only evety 6th package is send to the nback client
        self.disableLogging = True
        
    # handles incoming messages from the websockets
    async def _msg_received(self, websocket, ws_path):
        
        connection_id = id(websocket)
        
        self.active_connections[connection_id] = websocket
        
        try:
            async for message in websocket:
                res = json.loads(message)
                path = res['path']
                body = res['body']
                
                # lights
                if path == '/setlight':
                    light_index = body['index']
                    light_state = 1 if body['state'] == True else 0
                    await self.log("Setting light " + str(light_index) + " to " + str(light_state), True)
                    self._send_serial_msg(str(light_index) + "," + str(light_state))
                    self.light_logger.log("set light "+str(light_index)+" to "+str(light_state), True)

                elif path == '/reset':
                    await self.log("Resetting lights", True)
                    self._send_serial_msg("reset")
                    self.light_logger.log("reset", True)

                elif path == '/setall':
                    await self.log("Setting all lights to " + str(body), True)
                    self._send_serial_msg("set" + str(body))
                    self.light_logger.log(str(body), True)

                # client sends a "/identify" message when it connects
                # this is used to identify what the client is
                elif path == '/identify':
                    del self.active_connections[connection_id]
                    connection_id = body
                    self.active_connections[connection_id] = websocket
                    await self.send_active_connections()

                # echo for testing
                elif path == '/echo':
                    print("Echo path: " + ws_path)
                    print("Echoing message: " + message)
                    await self.broadcast(message)

                # for nback controll commands
                # mostly from web-client to nback-client
                elif path == '/nback':
                    await self.log("Setting nback to " + str(body), True)
                    await self.broadcast(message)

                # sets the participant ID on this server and sends it to all clients
                # except the web-client
                elif path == '/participantId':
                    await self.log("Setting participant ID to " + str(body), True)
                    self.storage.set_participant_id(body)
                    self.nback_logger.set_filename(body + '.csv', "timestamp,lastColor,nbackColor,trashColor,isCorrect,nbackCount")
                    self.light_logger.set_filename(body + '.csv', "timestamp,lightState")
                    await self.broadcast_except_web_client(message)

                # sends the participant ID to the the client that requested it
                elif path == '/participantIdRequest':
                    await websocket.send(json.dumps({'path': '/disableLogging', 'body': self.disableLogging}))
                    await websocket.send(json.dumps({'path': '/participantId', 'body': self.storage.get_participant_id()}))
                    await self.log("Sending participant ID ("+self.storage.get_participant_id()+") to " + str(connection_id), True)

                # forces all loggers to save their logs
                # (in case the logger uses a buffer.. which right now only the tracker logger does)
                elif path == '/saveLogs':
                    await self.log("Saving logs", True)
                    await self.broadcast_except_web_client(message)

                # disables logging on all loggers
                elif path == '/disableLogging':
                    if(body):
                        await self.log("disable Logging", body)
                    else:
                        await self.log("enable Logging", body)
                    self.disableLogging = body
                    self.nback_logger.set_pause_logging(body)
                    self.light_logger.set_pause_logging(body)
                    await self.broadcast_except_web_client(message)

                # sends all the messages with the path '/log' or '/trackerdata' to the web-client
                elif path == '/log':
                    await self.send('web-client', json.dumps({'path': path, 'body': body}))

                elif path == '/trackerdata':
                    await self.send('web-client', json.dumps({'path': path, 'body': body}))
                    
                    # if we want that the nback client also gets the tracker data
                    if(self.packageTracker == 3):
                        await self.send('nback', json.dumps({'path': path, 'body': body}))
                        self.packageTracker = 0
                    else:
                        self.packageTracker += 1

                # all messages with the path '/nbackLog' are sent to the nback logger
                elif path == '/nbackLog':
                    print(body)
                    self.nback_logger.log(body)
                    
                elif path == '/calibratetorso':
                    print("Calibrating torso")
                    await self.send('nback', json.dumps({'path': path, 'body': body}))

                else:
                    print("Unknown path: " + path)
        finally:
            del self.active_connections[connection_id]
            await self.send_active_connections()
                            
    async def broadcast(self, message):
        if self.active_connections:
            await asyncio.gather(*(ws.send(message) for ws in self.active_connections.values()))

    async def broadcast_except_web_client(self, message):
        if self.active_connections:
            await asyncio.gather(*(ws.send(message) for ws in self.active_connections.values() if id(ws) != 'web-client'))
    
    async def broadcast_except_tracker(self, message):
        if self.active_connections:
            await asyncio.gather(*(ws.send(message) for ws in self.active_connections.values() if id(ws) != 'tracker'))
            
    async def send(self, connection_id, message):
        try:
            if connection_id in self.active_connections:
                await self.active_connections[connection_id].send(message)
            else:
                print("Connection " + str(connection_id) + " not found")
        except Exception as e:
            print("Failed to send message to " + str(connection_id) + ": " + str(e))
            
    async def log(self, message, use_timestamp = False):
        self.operation_logger.log(message, use_timestamp)
        await self.send('web-client', json.dumps({'path': '/log', 'body': message}))
    
    async def send_active_connections(self):
        print("Active connections:")
        for key in self.active_connections:
            print(key)
        await self.broadcast(json.dumps({'path': '/connections', 'body': list(self.active_connections.keys())}))

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
        try:
            print("Sending serial message: " + msg)
            res = str(msg).encode('utf-8')
            self.serial_connection.write(res)
        except Exception as e:
            print("Failed to send serial message")
