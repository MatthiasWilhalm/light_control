## Overview
This is most of the code used for my bachelor project.
This repo contains:
- Python server (`/server`): it acts as the main relay and connects to all the other components
- Web-UI frontent (`/web`): controll panel for all the changeable settings and also displays a live-view of the tracking data and the light state
- Arduino code (`/src`): it communicates with the Python-server via serial connection and handels the light-system

### Other repos that are also part of this project
> Note: repos aren't open at the moment.. maybe I will open them at a later point
- Tracking software: Is a Unity project that uses the SteamVR-API to receive and sends it via Websockets to the Python server
- N-Back task for the Hololens

## Requirements
- Python 3.x
- PlatformIO Core
- Some webserver to host the Web-UI (I used a VS-Code plugin)
- Wokwi Simulator (if you want to use it on a simulator)

## Setup
### Server
- make sure all the libraries are installed
- run `python .\server\server.py` to start the server
### Web-UI
- start your web-server and navigate to `/web`, or simply open the `/web/index.html` file. That should also work
### Arduino
#### on native hardware
- plug in your Arduino to your PC
- run `pio run -t upload`
#### on Wokwi simulator
- Change `USE_EMULATOR = False` to `True` in `server/server.py` and restart the server
- I recomment using VS-Code Wokwi plugin. [Guide](https://docs.wokwi.com/vscode/getting-started)
- run `pio run`
- open the command palette on VS-Code and type `Wokwi: Start Simulator`

> Important! The COM-port will likly be a diffrent one as currently selected. You can determine which one you have to use by taking a look in to the `pio run` logs. Change the COM-port in `python .\server\server.py` under `SERIAL_PORT = 'your port here'`


The board editor can be found here: https://wokwi.com/projects/383563558006791169