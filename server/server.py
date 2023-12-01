import serial
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
ser = serial.serial_for_url('rfc2217://localhost:4000', baudrate=9600)

print("connected to serial connection: " + ser.name)

# api endpoints

@app.route('/hello', methods=['GET'])
def api_endpoint():
    return jsonify(message="Hello, World!")

# accepts a JSON object with a light_index number property
@app.route('/setlight', methods=['POST'])
def post_endpoint():
    data = request.get_json()
    j_data = jsonify(message="Data received", received_data=data).json
    print("received data: " + str(j_data['received_data']))
    
    light_index = j_data['received_data']['index']
    light_state = 1 if j_data['received_data']['state'] == True else 0
    serial_msg = str(light_index) + "," + str(light_state)
    
    res = str(serial_msg).encode('utf-8')
    print("sending data via serial: " + res.decode('utf-8'))
    ser.write(res)
    return jsonify(message="Data received", received_data=data)

@app.route('/reset', methods=['GET'])
def reset_endpoint():
    ser.write(b"reset")
    return jsonify(message="Resetting all lights")

if __name__ == '__main__':
    app.run(debug=True)