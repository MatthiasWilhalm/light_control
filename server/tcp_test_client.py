import socket

def start_client():
    # Create a TCP/IP socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Connect the socket to the server's address and port
    server_address = ('localhost', 12345)
    client_socket.connect(server_address)

    try:
        # Send data
        message = 'This is the message.'
        client_socket.sendall(message.encode())

        # Look for the response
        amount_received = 0
        amount_expected = len(message)

        while amount_received < amount_expected:
            data = client_socket.recv(1024)
            amount_received += len(data)
            print('Received {!r}'.format(data))

    finally:
        print('Closing socket')
        client_socket.close()

if __name__ == '__main__':
    start_client()