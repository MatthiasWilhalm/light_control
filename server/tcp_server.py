import socket
import threading

class TCPServer(threading.Thread):

    def __init__(self, stop_event, tcp_address, tcp_port):
        self.stop_event = stop_event
        self.tcp_address = tcp_address
        self.tcp_port = tcp_port
        threading.Thread.__init__(self)

    def run(self):
        self.start_tcp_server()

    def start_tcp_server(self):
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.settimeout(1)
        server_address = (self.tcp_address, self.tcp_port)
        server_socket.bind(server_address)
        server_socket.listen(1)
        print("TCP server started on " + self.tcp_address + ":" + str(self.tcp_port))

        try:
            while not self.stop_event.is_set():
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


    def send_tcp_msg(self, msg):
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client_socket.connect((self.tcp_address, self.tcp_port))
        client_socket.sendall(msg.encode())
        client_socket.close()