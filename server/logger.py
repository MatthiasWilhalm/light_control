import os
import time

class Logger:
    def __init__(self, filename):
        self.filename = filename
        os.makedirs(os.path.dirname(filename), exist_ok=True)

    def log(self, message, usetimestamp=False):
        with open(self.filename, 'a') as file:
            if(usetimestamp):
                message = time.strftime("%Y-%m-%d %H:%M:%S") + ": " + message
            file.write(message + '\n')