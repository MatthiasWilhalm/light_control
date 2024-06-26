import time
import serial
import atexit
import threading
from tcp_server import TCPServer
from websocket_server import WebSocketServer
from logger import Logger
from storage import Storage

USE_EMULATOR = False

TCP_ADDRESS = 'localhost'
TCP_PORT = 12345
SERIAL_PORT = 'COM9'
WEBSOCKET_ADDRESS = '0.0.0.0'
WEBSOCKET_PORT = 8765
LOG_FILEPATH = '../logs/'
NBACK_LOG_FILEPATH = '../logs/nback/'
LIGHT_LOG_FILEPATH = '../logs/light/'


global serial_connection
global tcp_server_thread
global flask_server_thread
global websocket_server_thread
global stop_event    

serial_connection = None
tcp_server_thread = None
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
    if websocket_server_thread and websocket_server_thread.is_alive():
        websocket_server_thread.stop()
        websocket_server_thread.join()
        print("Websocket server thread closed")

atexit.register(cleanup)

### helper functions ###

# sends a message to the serial connection
def send_serial_msg(msg):
    res = str(msg).encode('utf-8')
    print("sending data via serial: " + res.decode('utf-8'))
    serial_connection.write(res)

if __name__ == '__main__':
    
    operation_logger = Logger(LOG_FILEPATH, 'operation_log.txt')
    nback_logger = Logger(NBACK_LOG_FILEPATH, 'nback_log.csv', True)
    light_logger = Logger(LIGHT_LOG_FILEPATH, 'light_log.csv', True)
    storage = Storage()

    try:
        # use this for the emulator
        if(USE_EMULATOR):
            serial_connection = serial.serial_for_url('rfc2217://localhost:4000', baudrate=9600)
        else:
            serial_connection = serial.Serial(port=SERIAL_PORT, baudrate=9600)
        print("connected to serial connection: " + serial_connection.name)
    except:
        if(USE_EMULATOR):
            print("failed to connect to serial connection at localhost:4000")
        else:
            print("failed to connect to serial connection " + SERIAL_PORT)

    # tcp_server_thread = TCPServer(stop_event, TCP_ADDRESS, TCP_PORT, logger)
    # tcp_server_thread.start()
    
    websocket_server_thread = WebSocketServer(WEBSOCKET_ADDRESS, WEBSOCKET_PORT, serial_connection, operation_logger, nback_logger, light_logger, storage)
    websocket_server_thread.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("exiting...")
        cleanup()
        exit()