import serial
from flask import Flask, jsonify, request

app = Flask(__name__)
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
    light_index = jsonify(message="Data received", received_data=data).json['received_data']['light_index']
    res = str(light_index).encode('utf-8')
    print("sending data: " + res.decode('utf-8'))
    ser.write(res)
    return jsonify(message="Data received", received_data=data)

if __name__ == '__main__':
    app.run(debug=True)