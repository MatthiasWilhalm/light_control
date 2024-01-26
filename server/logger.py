import os
import time

class Logger:
    def __init__(self, path, filename, use_unix_timestamp=False):
        self.path = path
        self.filename = filename
        self.use_unix_timestamp = use_unix_timestamp
        os.makedirs(os.path.dirname(path+filename), exist_ok=True)

    def set_filename(self, filename):
        self.filename = filename
        os.makedirs(os.path.dirname(self.path+filename), exist_ok=True)

    def log(self, message, usetimestamp=False):
        with open(self.path+self.filename, 'a') as file:
            if(usetimestamp):
                if(self.use_unix_timestamp):
                    message = str(time.time()) + "," + message
                else:
                    message = time.strftime("%Y-%m-%d %H:%M:%S") + ": " + message
            file.write(message + '\n')