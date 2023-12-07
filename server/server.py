import serial
import atexit
from flask import Flask, jsonify, request
from flask_cors import CORS

# start REST API server
app = Flask(__name__)
CORS(app)

# start serial connection
ser = None

def cleanup():
    if ser:
        ser.close()
        print("Serial connection closed")

atexit.register(cleanup)

try:
    # use this for the emulator
    # ser = serial.serial_for_url('rfc2217://localhost:4000', baudrate=9600)
    ser = serial.Serial(port='COM3', baudrate=9600)
    print("connected to serial connection: " + ser.name)
except:
    print("failed to connect to serial connection... exiting")
    exit()

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

### helper functions ###

# sends a message to the serial connection
def send_serial_msg(msg):
    res = str(msg).encode('utf-8')
    print("sending data via serial: " + res.decode('utf-8'))
    ser.write(res)

if __name__ == '__main__':
    app.run()