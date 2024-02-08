import os
import time

class Logger:
    def __init__(self, path, filename, use_unix_timestamp=False):
        self.path = path
        self.filename = filename
        self.use_unix_timestamp = use_unix_timestamp
        self.pauseLogging = False
        os.makedirs(os.path.dirname(path+filename), exist_ok=True)

    def set_filename(self, filename, header):
        self.filename = filename
        # os.makedirs(os.path.dirname(self.path+filename), exist_ok=True)
        if not os.path.isfile(self.path+filename):
            with open(self.path+filename, 'w') as file:
                file.write(header+"\n")

    
    def set_pause_logging(self, pauseLogging):
        self.pauseLogging = pauseLogging

    def log(self, message, usetimestamp=False):
        if self.pauseLogging:
            return
        with open(self.path+self.filename, 'a') as file:
            if(usetimestamp):
                if(self.use_unix_timestamp):
                    message = str(time.time()) + "," + message
                else:
                    message = time.strftime("%Y-%m-%d %H:%M:%S") + ": " + message
            file.write(message + '\n')