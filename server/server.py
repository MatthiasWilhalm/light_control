import time
import serial
import atexit
import threading
import socket
from flask import Flask, jsonify, request
from flask_cors import CORS

TCP_ADDRESS = 'localhost'
TCP_PORT = 12345
SERIAL_PORT = 'COM3'
REST_PORT = 5000

# REST API server
app = Flask(__name__)
CORS(app)

global serial_connection
global tcp_server_thread
global flask_server_thread
global stop_event    

serial_connection = None
tcp_server_thread = None
flask_server_thread = None

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

atexit.register(cleanup)

### api endpoints ###

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


### TCP server function ###
def start_tcp_server(stop_event):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.settimeout(1)
    server_address = (TCP_ADDRESS, TCP_PORT)
    server_socket.bind(server_address)
    server_socket.listen(1)
    print("TCP server started on " + TCP_ADDRESS + ":" + str(TCP_PORT))

    try:
        while not stop_event.is_set():
            try:
                client_socket, client_address = server_socket.accept()
                print("accepted connection from " + str(client_address))
            except socket.timeout:
                continue
            try:
                while True:
                    data = client_socket.recv(1024)
                    if data:
                        print("received data via TCP: " + data.decode('utf-8'))
                        # client_socket.sendall(data)
                    else:
                        break
            except:
                print("lost connection to client")
            finally:
                print("closing TCP connection")
                client_socket.close()
    
    except: 
        print("error accepting connection")
    finally:
        print("closing TCP server")
        server_socket.close()

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

    tcp_server_thread = threading.Thread(target=start_tcp_server, args=(stop_event,))
    tcp_server_thread.start()

    flask_server_thread = threading.Thread(target=app.run, args=(str(REST_PORT),))
    flask_server_thread.start()
    print("REST API server started on port " + str(REST_PORT))

    try:
        while True:  # Keep the main thread running to allow keyboard interrupt
            time.sleep(1)
    except KeyboardInterrupt:
        print("exiting...")
        cleanup()
        exit()