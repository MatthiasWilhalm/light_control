import random
import time
import serial
import atexit
import threading
import socket
from tcp_server import TCPServer
from websocket_server import WebSocketServer

from flask import Flask, jsonify, request
from flask_cors import CORS

TCP_ADDRESS = 'localhost'
TCP_PORT = 12345
SERIAL_PORT = 'COM3'
REST_PORT = 5000
WEBSOCKET_ADDRESS = 'localhost'
WEBSOCKET_PORT = 8765

# REST API server
app = Flask(__name__)
CORS(app)

global serial_connection
global tcp_server_thread
global flask_server_thread
global websocket_server_thread
global stop_event    

serial_connection = None
tcp_server_thread = None
flask_server_thread = None
websocket_server_thread = None

stop_event = threading.Event()

def cleanup():
    stop_event.set()
    if serial_connection is not None:
        serial_connection.close()
        print("Serial connection closed")
    if tcp_server_thread and tcp_server_thread.is_alive():
        tcp_server_thread.join()
        print("TCP server thread closed")
    if flask_server_thread and flask_server_thread.is_alive():
        flask_server_thread.join()
        print("REST API server thread closed")
    if websocket_server_thread and websocket_server_thread.is_alive():
        websocket_server_thread.stop()
        websocket_server_thread.join()
        print("Websocket server thread closed")

atexit.register(cleanup)

# accepts a JSON object with a light_index number property
@app.route('/setlight', methods=['POST'])
def post_endpoint():
    data = request.get_json()
    j_data = jsonify(message="Data received", received_data=data).json
    print("received data: " + str(j_data['received_data']))
    
    light_index = j_data['received_data']['index']
    light_state = 1 if j_data['received_data']['state'] == True else 0
    send_serial_msg(str(light_index) + "," + str(light_state))
        
    return jsonify(message="Data received", received_data=data)

# resets all lights to off
@app.route('/reset', methods=['GET'])
def reset_endpoint():
    send_serial_msg("reset")
    return jsonify(message="Resetting all lights")

# sets all lights at once
@app.route('/setall', methods=['POST'])
def setall_endpoint():
    data = request.get_json()
    j_data = jsonify(message="Data received", received_data=data).json
    print("received data: " + str(j_data['received_data']))
    
    path = j_data['received_data']['path']    
    send_serial_msg("set" + str(path))
    
    return jsonify(message="Data received", received_data=data)

### helper functions ###

# sends a message to the serial connection
def send_serial_msg(msg):
    res = str(msg).encode('utf-8')
    print("sending data via serial: " + res.decode('utf-8'))
    serial_connection.write(res)

if __name__ == '__main__':

    try:
        # use this for the emulator
        # serial_connection = serial.serial_for_url('rfc2217://localhost:4000', baudrate=9600)
        serial_connection = serial.Serial(port=SERIAL_PORT, baudrate=9600)
        print("connected to serial connection: " + serial_connection.name)
    except:
        print("failed to connect to serial connection")

    tcp_server_thread = TCPServer(stop_event, TCP_ADDRESS, TCP_PORT)
    tcp_server_thread.start()

    flask_server_thread = threading.Thread(target=app.run, args=(str(REST_PORT),))
    flask_server_thread.start()
    print("REST API server started on port " + str(REST_PORT))

    websocket_server_thread = WebSocketServer(WEBSOCKET_ADDRESS, WEBSOCKET_PORT)
    websocket_server_thread.start()

    try:
        while True:  # Keep the main thread running to allow keyboard interrupt
            time.sleep(1)
    except KeyboardInterrupt:
        print("exiting...")
        cleanup()
        exit()