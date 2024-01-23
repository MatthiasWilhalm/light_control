import socket

def start_echo_server(host, port):
    # Create a TCP/IP socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Bind the socket to the port
    server_address = (host, port)
    server_socket.bind(server_address)

    # Listen for incoming connections
    server_socket.listen(1)
    print(f"Server started on {host}:{port}")

    while True:
        # Wait for a connection
        print('Waiting for a connection...')
        client_socket, client_address = server_socket.accept()

        try:
            print(f"Connection from {client_address}")

            # Receive the data in small chunks and retransmit it
            while True:
                data = client_socket.recv(1024)
                if data:
                    print(f"Received {data} from {client_address}")
                    print("Sending data back to the client")
                    client_socket.sendall(data)
                else:
                    print(f"No more data from {client_address}")
                    break
                
        finally:
            # Clean up the connection
            client_socket.close()

# Start the server
start_echo_server('0.0.0.0', 12345)