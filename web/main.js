import { convertTrackerDataToCanvasCoordinates, getCalibrationData, getCurrentNodeInRange, getNodeOnCanvas, saveCalibrationData } from "./CalibrationManager.js";
import { calcRandomNodes, calcRandomPath, getNextPath, getRandomNodeNeighbour } from "./PathGenerator.js";
import { INIT_CONFIG, INIT_PRESET, NBACK_TYPES, PRESETS, PRESET_TYPES, getPresetConfigByName } from "./PresetManager.js";

const URL = 'ws://localhost:8765';

const socket = new WebSocket(URL);

const CANVAS_SIZE = 930;
const CANVAS_MARGIN = 30;

// const TASK_DURATION = 60 * 2; // 2 minutes in seconds
const TASK_DURATION = 30;

const isOutputReversed = () => document.getElementById('reverseOutput').classList.contains('button-selected');

var logCounter = 0;


// Connection opened
socket.addEventListener('open', (event) => {
    console.log('connected to WebSocket-Server');
    setConnectionStatusDisplay(true);
    socket.send(JSON.stringify({
        path: '/identify',
        body: 'web-client'
    }));
    socket.send(JSON.stringify({
        path: '/participantIdRequest',
        body: ''
    }));
});

// Connection closed
socket.addEventListener('close', (event) => {
    console.log('disconnected from WebSocket-Server');
    setConnectionStatusDisplay(false);
});

// Listen for messages
socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if(!["/log", "/trackerdata"].includes(message.path))
        console.log('Message from server: ', event.data);
    switch(message.path) {
        case '/connections':
            setNBackStatusDisplay(!!message.body?.includes('nback'));
            setTrackerStatusDisplay(!!message.body?.includes('tracker'));
            break;
        case '/log':
            printLog(message.body);
            break;
        case '/trackerdata':
            if(State.isTrackingEmulationActive) break;
            handleTrackerData(message.body);
            break;
        case '/participantId':
            const partId = message.body;
            if(partId.includes('_')) {
                document.getElementById("filnameDisplay").innerText = message.body+'.csv';
                const [id, type, nback, nbackType] = partId.split('_');
                document.getElementById("participantIdInput").value = id;
                break;
            }
            document.getElementById("participantIdInput").value = message.body;
            document.getElementById("filnameDisplay").value = message.body+'.csv';
            break;
        case '/disableLogging':
            document.getElementById("disableLogging").classList.toggle('button-selected', message.body);
            break;
    }    
});

const sendMsg = (data) => {
    try {
        socket.send(data);
    } catch (error) {
        console.error('error sending message');
    }
}

const InitState = {
    pathMode: 24,
    useTrackingForLights: false,
    isTrackingEmulationActive: false,
    currentNode: -1,
    previousNode: -1,
    currentPath: null,
    newCalibrationData: null,
    taskTimer: null,
    mainTrackerName: '',
    currentTrackerValues: {},
    allowTracking: true,
    reverseOutput: false,
    calibrationEditVew: false,
}

const State = { ...InitState };

const StateUpdateFunctions = {};

/**
 * Updates a value in the state and calls the update function if it exists
 * @param {string} key 
 * @param {*} value 
 */
const updateState = (key, value) => {
    State[key] = value;
    if(StateUpdateFunctions[key])
        StateUpdateFunctions[key](value);
};

const resetState = (key) => {
    updateState(key, InitState[key]);
};

const setStateUpdateListener = (key, fun) => {
    StateUpdateFunctions[key] = fun;
};

const InputElements = {
    toggleStudyView: {
        eventType: 'click',
        event: (e) => {
            document.getElementById('toggleStudyView').classList.toggle('button-selected');
            const hide = document.getElementById('toggleStudyView').classList.contains('button-selected');
        
            Array.from(document.getElementsByClassName('non-essential')).forEach((elem) =>
                hide ? elem.classList.add('hidden') : elem.classList.remove('hidden')
            );
        }
    },
    participantIdInput: {
        eventType: 'change',
        event: (e) => {}
    },
    presetSelect: {
        eventType: 'change',
        event: (e) => {
            console.log('presetSelect change');
            updateParticipantIdAndConfig();
        }
    },
    updateId: {
        eventType: 'click',
        event: (e) => {
            updateParticipantIdAndConfig();
        }
    },
    forceSaveLogs: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/saveLogs',
                body: ''
            }));
        }
    },
    disableLogging: {
        eventType: 'click',
        event: (e) => {
            toggleLogging();
        }
    },
    presetSelect: {
        eventType: 'change',
        event: (e) => {
            updateParticipantIdAndConfig();
        }
    },
    startTaskRound: {
        eventType: 'click',
        event: (e) => {
            const button = document.getElementById("startTaskRound");
            if(State.taskTimer) { // timer is running
                stopTaskTimer();
                toggleLogging(false);
                button.innerText = "Start Task";
                sendMsg(JSON.stringify({
                    path: '/nback',
                    body: 'stopTask'
                }));
                updateState('useTrackingForLights', false);
                return;
            }
            updateParticipantIdAndConfig();
            toggleLogging(true);
            sendMsg(JSON.stringify({
                path: '/nback',
                body: 'startTask'
            }));
            updateState('useTrackingForLights', true);
            
            button.innerText = "Stop Task";
            startTaskTimer(() => {
                button.innerText = "Start Task";
                toggleLogging(false);
                sendMsg(JSON.stringify({
                    path: '/nback',
                    body: 'stopTask'
                }));
                updateState('useTrackingForLights', false);
            });
        }
    },
    reset: {
        eventType: 'click',
        event: (e) => {
            updateDisplayByPath([]);
            sendPath([]);
        }
    },
    random: {
        eventType: 'click',
        event: (e) => {
            sendRandomPath();
        }
    },
    all_on: {
        eventType: 'click',
        event: (e) => {
            const path = new Array(24).fill(0).map((_, i) => i);
            updateDisplayByPath(path);
            sendPath(path);
        }
    },
    pathType: {
        eventType: 'click',
        event: (e) => {
            updateState('pathMode', State.pathMode === 24 ? 8 : 24);
            // pathMode = pathMode === 24 ? 8 : 24;
            // updatePathMode();
        }
    },
    reverseOutput: {
        eventType: 'click',
        event: (e) => {
            updateState('reverseOutput', !State.reverseOutput);
        }
    },
    useTrackingForLights: {
        eventType: 'click',
        event: (e) => {
            updateState('useTrackingForLights', !State.useTrackingForLights);
        }
    },
    startTask: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/nback',
                body: 'startTask'
            }));
        }
    },
    startBaseline: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/nback',
                body: 'startBaseline'
            }));
        }
    },
    stopTask: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/nback',
                body: 'stopTask'
            }));
        }
    },
    triggerLeft: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/nback',
                body: 'triggerLeft'
            }));
        }
    },
    triggerRight: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/nback',
                body: 'triggerRight'
            }));
        }
    },
    updateSteps: {
        eventType: 'click',
        event: (e) => {
            updateNBackSteps(document.getElementById('nbackSteps').value);
        }
    },
    nbackTypeSelect: {
        eventType: 'change',
        event: (e) => {
            updateNBackType(document.getElementById('nbackTypeSelect').value);
        }
    },
    calibrateTorso: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/calibratetorso',
                body: ''
            }));
        }
    },
    toggleTracking: {
        eventType: 'click',
        event: (e) => {
            updateState('allowTracking', !State.allowTracking);
        }
    },
    startCalibration: {
        eventType: 'click',
        event: async () => {
            if(!State.mainTrackerName || !State.currentTrackerValues) {
                alert('no tracker data available');
                return;
            }
        
            if(getCalibrationData()) {
                alert('calibration data already exists, please reset it first');
                return;
            }
        
            await startTimer("calibrating");
            const val1 = parseFloat(State.currentTrackerValues[State.mainTrackerName].x);
            await startTimer("calibrating");
            const val2 = parseFloat(State.currentTrackerValues[State.mainTrackerName].x);
            await startTimer("calibrating");
            const val3 = parseFloat(State.currentTrackerValues[State.mainTrackerName].z);
            await startTimer("calibrating");
            const val4 = parseFloat(State.currentTrackerValues[State.mainTrackerName].z);
        
            const maxX = Math.max(val1, val2);
            const minX = Math.min(val1, val2);
            const maxY = Math.max(val3, val4);
            const minY = Math.min(val3, val4);
            saveCalibrationData({maxX, minY, maxY, minX, rotation: 0, flipX: false, flipY: false});
            syncCalibrationDataDisplay();
        }
    },
    calibrationDataEdit: {
        eventType: 'change',
        event: (e) => {
            try {
                const data = JSON.parse(e.target.value);
                updateState('newCalibrationData', data);
                updateCanvasWithCalibrationData(data);
            } catch (error) {
                console.error('error parsing calibration data', error);
            }
        }
    },
    editCalibrationdata: {
        eventType: 'click',
        event: (e) => {
            if(!State.calibrationEditVew)
                updateState('newCalibrationData', getCalibrationData());
            toggleCalibrationDataEditView();
        }
    },
    flipX: {
        eventType: 'click',
        event: (e) => {
            const data = getCalibrationData();
            if(!data) return;
            saveCalibrationData({...data, flipX: !data.flipX});
            syncCalibrationDataDisplay();
        }
    },
    flipY: {
        eventType: 'click',
        event: (e) => {
            const data = getCalibrationData();
            if(!data) return;
            saveCalibrationData({...data, flipY: !data.flipY});
            syncCalibrationDataDisplay();
        }
    },
    rotateCalibraion: {
        eventType: 'click',
        event: (e) => {
            const data = getCalibrationData();
            if(!data) return;
            let rotation = data.rotation || 0;
            saveCalibrationData({...data, rotation: rotation + 90 % 360});
            syncCalibrationDataDisplay();
        }
    },
    resetCalibrationdata: {
        eventType: 'click',
        event: (e) => {
                // if the edit view is active, it will be closed
                if(document.getElementById('calibrationDataDisplay').style.display === 'none') {
                    toggleCalibrationDataEditView(true);
                    return;
                }
                // gives warning to user
                if(!confirm('Are you sure you want to reset the calibration data?')) return;
                saveCalibrationData(null);
                syncCalibrationDataDisplay();
        }
    },
    echo: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/echo',
                body: 'echoing from web-client'
            }));
        }
    },
    addLog: {
        eventType: 'click',
        event: (e) => {
            sendMsg(JSON.stringify({
                path: '/log',
                body: 'log entry ' + logCounter
            }));
            // printLog('log entry ' + logCounter);
            logCounter++;
        }
    },
    testCalibration: {
        eventType: 'click',
        event: (e) => {
            if(getCalibrationData()) return;
            saveCalibrationData({max: 4, min: -4});
            const vals = [
                convertTrackerDataToCanvasCoordinates(0, 8, 930, 30, 0.5),
                convertTrackerDataToCanvasCoordinates(0, -8, 930, 30, 0.5),
                convertTrackerDataToCanvasCoordinates(-4, 0, 930, 30, 0.5),
                convertTrackerDataToCanvasCoordinates(4, 0, 930, 30, 0.5),
                convertTrackerDataToCanvasCoordinates(0, 0, 930, 30, 0.5),
            ]
            vals.forEach((val, i) => console.log(`val${i}`, val));
            updateCanvas(vals);
        }
    },
    resetCanvas: {
        eventType: 'click',
        event: (e) => {
            updateCanvas([]);
        }
    },
    emulateTracking: {
        eventType: 'click',
        event: (e) => {
            updateState('isTrackingEmulationActive', !State.isTrackingEmulationActive);
        }
    },
    testPartialPath: {
        eventType: 'click',
        event: (e) => {
            handlePartialPathGeneration();
        }
    },
    toggleLog: {
        eventType: 'click',
        event: (e) => {
            const log = document.getElementById('log');
            log.style.display = log.style.display === 'none' ? 'block' : 'none';
        }
    },
    trackerMinX: {
        eventType: 'wheel',
        event: (e) => {
            manualUpdatetracking(e, 'minX');
        }
    },
    trackerMaxX: {
        eventType: 'wheel',
        event: (e) => {
            manualUpdatetracking(e, 'maxX');
        }
    },
    trackerMinY: {
        eventType: 'wheel',
        event: (e) => {
            manualUpdatetracking(e, 'minY');
        }
    },
    trackerMaxY: {
        eventType: 'wheel',
        event: (e) => {
            manualUpdatetracking(e, 'maxY');
        }
    },
};

const Init = () => {
    initUpdateListener();

    Object.keys(InputElements).forEach((key) => {
        document.getElementById(key)?.addEventListener(InputElements[key].eventType, InputElements[key].event);
    });

    document.getElementById('participantIdInput').value = INIT_CONFIG.participantId;
    updateParticipantIdAndConfig();
    updateState('pathMode', INIT_CONFIG.pathMode);

    syncCalibrationDataDisplay();
    setConnectionStatusDisplay(false);
    initPresetSelection();
    initNbackTypeSelect();

}

const initUpdateListener = () => {
    setStateUpdateListener('pathMode', (value) => {
        document.getElementById('pathType').innerText = "Active Paths: " + value;
        const set24Paths = (is24PathMode) => {
            Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
                if(is24PathMode)
                    return light.classList.remove('disabled');
                if((i + 2) % 3)
                    light.classList.add('disabled');
            });
        } 
        set24Paths(value === 24);
    });

    setStateUpdateListener('useTrackingForLights', (value) => {
        const useTrackingForLightsElem = document.getElementById('useTrackingForLights');
        useTrackingForLightsElem.classList.toggle('button-selected', value);

        document.getElementById('reset').disabled = value;
        document.getElementById('all_on').disabled = value;
        document.getElementById('random').disabled = value;
        if(value) {
            // asumes that the user starts at node 0
            updateState('currentNode', 0);
        } else {
            updateState('currentNode', -1);
            updateState('previousNode', -1);
            updateState('currentPath', null);
        }
    });

    setStateUpdateListener('isTrackingEmulationActive', (value) => {
        const trackerMap = document.getElementById("trackerMap");
        if(value) {
            trackerMap.addEventListener("mousemove", emulateTrackerData);
            document.getElementById('emulateTracking').classList.add('button-selected');
            trackerMap.style.pointerEvents = 'auto';
            return;
        }
        document.getElementById('emulateTracking').classList.remove('button-selected');
        trackerMap.removeEventListener("mousemove", emulateTrackerData);
        trackerMap.style.pointerEvents = 'none';
        document.getElementById('trackerDebugData').innerText = '';
        activateSVGNodes([]);
        updateCanvas([]);

    });

    setStateUpdateListener('currentNode', (value) => {});

    setStateUpdateListener('previousNode', (value) => {});

    setStateUpdateListener('currentPath', (value) => {});

    setStateUpdateListener('newCalibrationData', (value) => {
        const edit = document.getElementById('calibrationDataEdit');
        edit.value = JSON.stringify(value, null, 2);
        updateCanvasWithCalibrationData(value);    
    });

    setStateUpdateListener('taskTimer', (value) => {});

    setStateUpdateListener('mainTrackerName', (value) => {});

    setStateUpdateListener('currentTrackerValues', (value) => {});

    setStateUpdateListener('allowTracking', (value) => {
        document.getElementById('toggleTracking').classList.toggle('button-selected', value);
    });

    setStateUpdateListener('reverseOutput', (value) => {
        const reverseOutput = document.getElementById('reverseOutput');
        reverseOutput.classList.toggle('button-selected', value);
    });
};
        

// adds event listeners to all paths in the lights-path-svg 
Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
    light.addEventListener('click', () => {
        if(light.classList.contains('disabled')) return;
        const nextState = !light.classList.contains('selected');
        updateDisplayLight(light, nextState);
        sendLightUpdate(i, nextState);
    });
});

// functions

const toggleLogging = (force) => {
    const button = document.getElementById("disableLogging");
    button.classList.toggle('button-selected', force === undefined ? undefined : !force);
    sendMsg(JSON.stringify({
        path: '/disableLogging',
        body: button.classList.contains('button-selected')
    }));
};

const manualUpdatetracking = (e, key) => {
    console.log("scoll");
    if(!State.newCalibrationData) return;
    const scrollingDown = e.deltaY > 0;
    const isctrl = e.ctrlKey;
    const isshift = e.shiftKey;
    const value = State.newCalibrationData[key] + (scrollingDown ? -1 : 1) * (isctrl ? 0.01 : 0.1) * (isshift ? 0.1 : 1);
    updateNewCalibrationData({[key]: value});
};

const updateNBackSteps = (steps) => {
    document.getElementById('nbackSteps').value = steps;
    try {
        sendMsg(JSON.stringify({
            path: '/nback',
            body: 'nbackSteps:'+steps
        }));
    } catch (error) {}
};

const updateNBackType = (type) => {
    document.getElementById('nbackTypeSelect').value = type;
    try {
        sendMsg(JSON.stringify({
            path: '/nback',
            body: 'nbackType:'+type
        }));
    } catch (error) {}
}

const updateParticipantIdAndConfig = () => {
    let presetConfig = getPresetConfigByName(document.getElementById('presetSelect').value);
    let partId = document.getElementById("participantIdInput").value;

    if(!presetConfig)
        presetConfig = INIT_PRESET;

    printLog(`using preset: ${presetConfig.name}`);

    const { config } = presetConfig;
    const presetId = presetConfig.id;

    updateNBackSteps(config.nback);
    updateNBackType(config.nbackType);
    partId += `_${presetId}_${config.type}_n${config.nback}_t${config.nbackType}`;

    sendMsg(JSON.stringify({
        path: '/participantId',
        body: partId
    }));
}

/**
 * generates the next 2 segments of the path relativ to the current node
 * @returns 
 */
const handlePartialPathGeneration = () => {
    updateState('currentNode', State.currentNode === -1 ? 0 : State.currentNode);
    console.log('currentNode', State.currentNode, 'previousNode', State.previousNode);
    let nextNode = getRandomNodeNeighbour(State.currentNode, State.previousNode);
    const path = calcRandomPath(State.pathMode === 8, [State.currentNode, nextNode]);
    if(!State.currentPath) updateState('currentPath', []);
    if(State.currentPath.length >= 2) {
        State.currentPath.shift();
        updateState('currentPath', State.currentPath);
    }
    State.currentPath.push(path[0]);
    updateState('currentPath',State.currentPath);

    updateState('previousNode', State.currentNode);
    updateState('currentNode', nextNode);
    if(State.currentPath.length < 2) {
        handlePartialPathGeneration();
        return;
    }
    console.log('currentPath', State.currentPath);
    updateDisplayByPath(State.currentPath);
    sendPath(State.currentPath);
}

/**
 * receives the mouse coordinates to emulate the tracker data
 * @param {MouseEvent} e
 */
const emulateTrackerData = (e) => {
    const canvas = document.getElementById('trackerMap');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleTrackerData(`emulated,${x},${y},0,0,0,0,0`, true);
}

/**
 * adds a log entry to the log list
 * @param {string} message 
 */
const printLog = (message) => {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    const time = `${hours}:${minutes}:${seconds}`;
    message = `[${time}] ${message}`;

    const log = document.getElementById('log');
    if(log.children.length > 500) {
        log.removeChild(log.children[0]);
    }
    const logEntry = document.createElement('li');
    logEntry.innerText = message;
    log.appendChild(logEntry);
}

/**
 * processes the tracker data and updates the display
 * @param {{x: number, y: number}} data 
 * @param {boolean} skipConversion set to true if the data is already converted
 * @returns 
 */
const handleTrackerData = (data, skipConversion) => {
    const editMode = document.getElementById('calibrationDataDisplay').style.display === 'none';
    if(!State.allowTracking) return;
    const trackerDebugData = document.getElementById('trackerDebugData');
    const [name, x, y, z, rx, ry, rz, rw] = data.split(',');
    State.currentTrackerValues[name] = {x, y, z, rx, ry, rz, rw};
    // TODO: change if we have multiple trackers
    if(State.mainTrackerName === '')
        updateState('mainTrackerName', name);
    let coords;
    if(skipConversion) {
        coords = {x, y};
    } else {
        coords = convertTrackerDataToCanvasCoordinates(
            parseFloat(x),
            parseFloat(z),
            CANVAS_SIZE,
            CANVAS_MARGIN,
            (editMode ? State.newCalibrationData : undefined)
        );
    }
    
    if(!coords) {
        trackerDebugData.innerText = JSON.stringify({...State.currentTrackerValues, coords}, null, 2);
        return;
    }
    const nodesInRange = getCurrentNodeInRange(coords.x, coords.y);
    if(State.currentNode === -1 && nodesInRange === 0 && State.useTrackingForLights)
        updateState('currentNode', 0);
    trackerDebugData.innerText = JSON.stringify({...State.currentTrackerValues, coords, nodesInRange}, null, 2);
    activateSVGNodes([nodesInRange]);
    updatePathWithTracking(nodesInRange);
    updateCanvas([coords]);
    // so outlines wont be overdrawn
    if(editMode) {
        updateCanvasWithCalibrationData(State.newCalibrationData, true);
    }
}

/**
 * if the given node is in range of the current node
 * the next part of the path will be generated
 * @param {number} nodeInRange 
 * @returns 
 */
const updatePathWithTracking = (nodeInRange) => {
    if([State.previousNode, State.currentNode].includes(nodeInRange)) {
        handlePartialPathGeneration();
    }
};

/**
 * returns all paths that are in currentPaths but not in activePaths
 * @param {number[]} activePaths 
 * @param {number[]} currentPaths 
 * @returns {number[]} all paths that are in currentPaths but not in activePaths
 */
const getUpComingPath = (activePaths, currentPaths) => {
    const ret = [];
    for (let i = 0; i < currentPaths.length; i++) {
        const path = currentPaths[i];
        if(!activePaths.includes(path)) {
            ret.push(path);
        }
    }
    return ret;
};

/**
 * sets all svg nodes to active that are in the given array
 * all other nodes will be set to inactive
 * @param {number[]} activeNodes 
 */
const activateSVGNodes = (activeNodes) => {
    const svgNodes = document.getElementsByTagName('circle');
    for (let i = 0; i < svgNodes.length; i++) {
        const node = svgNodes[i];
        if (activeNodes.includes(i)) {
            node.classList.add('active');
        } else {
            node.classList.remove('active');
        }
    }
};

/**
 * creates a random path and sends it to the server
 */
const sendRandomPath = () => {
    const path = calcRandomPath(State.pathMode === 8);
    updateDisplayByPath(path);
    // sendPath(path);
    sendPath(path);
};

/**
 * updates the state of a light on the client display
 * @param {HTMLElement} lightHTMLElement 
 * @param {boolean} state 
 */
const updateDisplayLight = (lightHTMLElement, state, className = 'selected') => {
    if (state) {
        lightHTMLElement.classList.add(className);
    } else {
        lightHTMLElement.classList.remove(className);
        // qick fix to remove the active-stroke class
        lightHTMLElement.classList.remove('active-stroke');
        lightHTMLElement.classList.remove('selected');
    }
};

/**
 * updates the state of all lights on the client display
 * by a given path
 * @param {number[]} paths 
 */
const updateDisplayByPath = (paths, highlightedPaths) => {
    Array.from(document.getElementsByTagName('path'))
        .forEach((light, i) => {
            if(!highlightedPaths)
                return updateDisplayLight(light, paths.includes(i))
            updateDisplayLight(light, paths.includes(i), highlightedPaths.includes(i) ? 'active-stroke' : 'selected');
        });
};


/**
 * sends a request to the server to update the state of one light
 * @param {number} index
 * @param {boolean} state
 */
const sendLightUpdate = (index, state) => {
    sendMsg(JSON.stringify({
        path: '/setlight',
        body: {
            index: index,
            state: state
        }
    }));
}

/**
 * sends a request to the server to reset all lights
*/
const sendReset = () => {
    sendMsg(JSON.stringify({
        path: '/reset',
        body: ''
    }));
}

/**
 * sends the given path to the server
 * @param {number[]} path [0, 1, 2, 3, 4] (light indexes)
*/
const sendPath = (path) => {
    const body = new Array(24).fill(0).map((_, i) => {
        if(isOutputReversed())
            return path.includes(i) ? '0' : '1';
        return path.includes(i) ? '1' : '0'
    }).join('');
    sendMsg(JSON.stringify({
        path: '/setall',
        body
    }));
}

/**
 * updates the connection status display
 * according to the given boolean
 * @param {boolean} connected 
 */
const setConnectionStatusDisplay = (connected) => {
    const icon = document.getElementById('connectionStatusIndicator');
    const statusText = document.getElementById('connectionStatusText');
    const urlText = document.getElementById('connectionStatusConnectedTo');
    const statusNBack = document.getElementById('connectionStatusNBack');
    const statusTracker = document.getElementById('connectionStatusTracker');

    if (connected) {
        icon.classList.remove('disconnected');
        icon.classList.add('connected');
        statusText.innerText = 'connected';
        urlText.innerText = URL;
        urlText.style.display = 'block';
        statusNBack.style.display = 'block';
        statusTracker.style.display = 'block';
    } else {
        icon.classList.remove('connected');
        icon.classList.add('disconnected');
        statusText.innerText = 'disconnected';
        urlText.innerText = '';
        urlText.style.display = 'none';
        statusNBack.style.display = 'none';
        statusTracker.style.display = 'none';
    }
};

/**
 * set the nback connection status display
 * @param {boolean} connected 
 */
const setNBackStatusDisplay = (connected) => {
    const statusNBack = document.getElementById('connectionStatusNBack');
    statusNBack.innerText = 'N-Back:' + (connected ? 'connected' : 'disconnected');
};

/**
 * set the tracker connection status display
 * @param {boolean} connected 
 */
const setTrackerStatusDisplay = (connected) => {
    const statusTracker = document.getElementById('connectionStatusTracker');
    statusTracker.innerText = 'Tracker:' + (connected ? 'connected' : 'disconnected');
};

/**
 * draws the given points on the canvas
 * @param {{x: number, y:number}[]} data 
 */
const updateCanvas = (data, keepCanvas) => {
    const canvas = document.getElementById('trackerMap');
    const ctx = canvas.getContext('2d');
    if(!keepCanvas)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    data.forEach((point) => {
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    });
}

const drawLines = (data, keepCanvas) => {
    const canvas = document.getElementById('trackerMap');
    const ctx = canvas.getContext('2d');
    if(!keepCanvas)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.moveTo(data[0].x, data[0].y);
    data.forEach((point) => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
}

/**
 * syncs the calibration data display with the saved calibration data in local storage
 * @returns 
 */
const syncCalibrationDataDisplay = () => {
    const display = document.getElementById('calibrationDataDisplay');
    const data = getCalibrationData();
    if(!data) {
        display.innerText = 'no calibration data';
        return;
    }
    display.innerText = `minY: ${data.minY}, maxY: ${data.maxY}\nminX: ${data.minX}, maxX: ${data.maxX}`+
        `\nrotation: ${data.rotation}°\nflipX: ${data.flipX}, flipY: ${data.flipY}`;
}

/**
 * starts a timer in fullscreen that counts down from 10 to 0
 * @param {string} finnishText 
 * @returns 
 */
const startTimer = (finnishText = "done") => {
    let interval;
    return new Promise((resolve) => {
        const timer = document.getElementById('timer');
        timer.innerText = 10;
        timer.style.display = 'block';
        let durationInSeconds = 10;
        const updateTimer = () => {
            if(durationInSeconds >= 0)
                timer.innerText = durationInSeconds;
            durationInSeconds--;
            if(durationInSeconds === -1) {
                timer.style.fontSize = '100pt';
                timer.innerText = finnishText;
                return;
            }
            if(durationInSeconds < -2) {
                timer.innerText = 0;
                timer.style.display = 'none';
                timer.style.fontSize = '200pt';
                clearInterval(interval);
                resolve();
            }
        };
        updateTimer();
        interval = setInterval(updateTimer, 1000);
    });
}

/**
 * 
 * @returns {boolean} true if the calibration data edit view is active
 */
const toggleCalibrationDataEditView = (skipSave) => {
    const display = document.getElementById('calibrationDataDisplay');
    const edit = document.getElementById('calibrationDataEdit');
    const editBtn = document.getElementById('editCalibrationdata');
    const resetBtn = document.getElementById('resetCalibrationdata');
    const manualEdit = document.getElementById('manualTrackerCalibrationDisplay');

    updateState('calibrationEditVew', !State.calibrationEditVew);

    setCanvasToEditView(State.calibrationEditVew);
    if(State.calibrationEditVew) {
        display.style.display = 'none';
        const data = State.newCalibrationData;
        edit.value = data ? JSON.stringify(data, null, 2) : '';
        edit.style.display = 'block';
        editBtn.innerHTML = 'Save';
        resetBtn.innerHTML = 'Cancel'; 
        manualEdit.style.display = 'flex';   
    } else {
        editBtn.innerHTML = 'Edit';
        resetBtn.innerHTML = 'Reset';
        display.style.display = 'block';
        edit.style.display = 'none';
        manualEdit.style.display = 'none';
        try {
            if(!skipSave)
                saveCalibrationData(State.newCalibrationData);
                // saveCalibrationData(JSON.parse(edit.value));
            syncCalibrationDataDisplay();
        } catch (e) {
            printLog('could not parse calibration data');
            console.error(e);
        }
    }
};

/**
 * 
 * @param {{minY: number, maxY: number, minX: number, maxX: number}} update
 */
const updateNewCalibrationData = (update) => {
    updateState('newCalibrationData', {...State.newCalibrationData, ...update});
};

/**
 * is true the scroll event will be used to change the calibration data
 * as well as a preview of the calibration data on the canvas is shown
 * @param {boolean} isEditView 
 */
const setCanvasToEditView = (isEditView) => {
    const canvas = document.getElementById('trackerMap');

    const handleScroll = (e) => {
        const scrollingDown = e.deltaY > 0;
        const ishift = e.shiftKey;
        const isctrl = e.ctrlKey;
        if(isctrl)
            e.preventDefault();
        const value = 0.01 * (scrollingDown ? -1 : 1) * (isctrl ? 0.1 : 1);

        let updatedCalibrationData = {...State.newCalibrationData};

        if(ishift) {
            updatedCalibrationData.maxY += value;
            updatedCalibrationData.minY += value;
        } else {
            updatedCalibrationData.maxX += value;
            updatedCalibrationData.minX += value;
        }
        updateNewCalibrationData({...updatedCalibrationData});
    };

    if(isEditView) {
        canvas.style.pointerEvents = 'auto';
        canvas.addEventListener('wheel', handleScroll);
        updateCanvasWithCalibrationData(State.newCalibrationData);
    } else {
        canvas.style.pointerEvents = 'none';
        canvas.removeEventListener('wheel', handleScroll);
        updateCanvas([]);
    }
};

/**
 * 
 * @param {{minY: number, maxY: number, minX: number, maxX: number}} data
 * @returns 
 */
const updateCanvasWithCalibrationData = (points, keepCanvas) => {
    if(!points) return;
    const xRange = points.maxX - points.minX;
    const yRange = points.maxY - points.minY;
    if(!keepCanvas)
        updateCanvas([]);
    drawLines([
        convertTrackerDataToCanvasCoordinates(points.minX, points.minY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.maxX, points.minY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.maxX, points.maxY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.minX, points.maxY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.minX, points.minY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
    ], true);
    drawLines([
        convertTrackerDataToCanvasCoordinates(points.minX + xRange / 2, points.minY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.minX + xRange / 2, points.maxY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
    ], true);
    drawLines([
        convertTrackerDataToCanvasCoordinates(points.minX, points.minY + yRange / 2, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.maxX, points.minY + yRange / 2, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
    ], true);
    drawLines([
        convertTrackerDataToCanvasCoordinates(points.minX + xRange / 2, points.minY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.maxX, points.minY + yRange / 2, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
    ], true);
    drawLines([
        convertTrackerDataToCanvasCoordinates(points.maxX, points.minY + yRange / 2, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.minX + xRange / 2, points.maxY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
    ], true);
    drawLines([
        convertTrackerDataToCanvasCoordinates(points.minX + xRange / 2, points.maxY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.minX, points.minY + yRange / 2, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
    ], true);
    drawLines([
        convertTrackerDataToCanvasCoordinates(points.minX, points.minY + yRange / 2, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
        convertTrackerDataToCanvasCoordinates(points.minX + xRange / 2, points.minY, CANVAS_SIZE, CANVAS_MARGIN, State.newCalibrationData),
    ], true);
};

const initPresetSelection = () => {
    const presetSelection = document.getElementById('presetSelect');
    let presetOptions = [];
    presetOptions.push(`<option value="none">None</option>`);
    presetOptions = [...presetOptions,  ...PRESETS.map((preset) => 
        `<option value="${preset.name}">${preset.name}</option>`
    )];
    presetSelection.innerHTML = presetOptions.join('');
}

const initNbackTypeSelect = () => {
    const nbackTypeSelect = document.getElementById('nbackTypeSelect');
    const nbackTypeOptions = Object.values(NBACK_TYPES).map((type) => 
        `<option value="${type}">${type}</option>`
    );
    nbackTypeSelect.innerHTML = nbackTypeOptions.join('');
}

const startTaskTimer = (next) => {
    const timer = document.getElementById('taskTimer');
    timer.style.display = 'block';
    let durationInSeconds = TASK_DURATION;
    const updateTimer = () => {
        if(durationInSeconds >= 0)
            timer.innerText = `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, '0')}`;
        durationInSeconds--;
        if(durationInSeconds === -1) {
            timer.innerText = "0:00";
            timer.style.display = 'none';
            clearInterval(State.taskTimer);
            updateState('taskTimer', null);
            next?.();
        }
    };
    updateTimer();
    updateState('taskTimer', setInterval(updateTimer, 1000));
};

const stopTaskTimer = () => {
    clearInterval(State.taskTimer);
    const timer = document.getElementById('taskTimer');
    timer.innerText = "0:00";
    timer.style.display = 'none';
};

// init
Init();