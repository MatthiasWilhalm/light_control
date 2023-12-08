## Requirements
- Python 3.x
- PlatformIO Core
- Wokwi Simulator

## Setup
- run `pio run`
- or `pio run -t upload` if you want to directly upload it to an Arduino
- otherwise if you are in VS-Code and have the Wokwi Plugin installed press F1 and type `Wokwi: Start Simulator`
- run `python .\server\server.py` to start the api server
- open the `web/index.html` file in your browser or use a small local webhost service to open the web frontend to control the Arduino


board editor: https://wokwi.com/projects/383563558006791169