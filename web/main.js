import { convertTrackerDataToCanvasCoordinates, getCalibrationData, getCurrentNodeInRange, getNodeOnCanvas, saveCalibrationData } from "./CalibrationManager.js";
import { calcRandomNodes, calcRandomPath, getNextPath } from "./PathGenerator.js";

const URL = 'ws://localhost:8765';

const socket = new WebSocket(URL);

var mainTrackerName = '';
const currentTrackerValues = {};

var pathMode = 24;

const isOutputReversed = () => document.getElementById('reverseOutput').classList.contains('button-selected');

var allowTracking = true;
var useTrackingForLights = false;

// is used if useTrackingForLights is true
var currentPath = null; 
var currentNodes = null;
var activePaths = null;
var reversingPath = false;

const setReversingPath = (value) => {
    reversingPath = value;
    const reverseLightspath = document.getElementById('reverseLightspath');
    if(reversingPath)
        reverseLightspath.classList.add('button-selected');
    else
        reverseLightspath.classList.remove('button-selected');
}

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
            handleTrackerData(message.body);
            break;
        case '/participantId':
            document.getElementById("participantIdInput").value = message.body;
            break;
    }    
});

Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
    light.addEventListener('click', () => {
        if(light.classList.contains('disabled')) return;
        const nextState = !light.classList.contains('selected');
        updateDisplayLight(light, nextState);
        sendLightUpdate(i, nextState);
    });
});

//logging
    
document.getElementById("updateId").addEventListener("click", () => {
    const partId = document.getElementById("participantIdInput").value;
    socket.send(JSON.stringify({
        path: '/participantId',
        body: partId
    }));
});
// the idea behind this to force all loggers to store the logs to disk
// in case they use a buffer
document.getElementById("forceSaveLogs").addEventListener("click", () => {
    socket.send(JSON.stringify({
        path: '/saveLogs',
        body: ''
    }));
});
document.getElementById("disableLogging").addEventListener("click", () => {
    const button = document.getElementById("disableLogging");
    button.classList.toggle('button-selected');
    socket.send(JSON.stringify({
        path: '/disableLogging',
        body: button.classList.contains('button-selected')
    }));
});

// lights

document.getElementById('reset').addEventListener('click', () => {
    updateDisplayByPath([]);
    sendPath([]);
});

document.getElementById('random').addEventListener('click', () => {
    sendRandomPath();
});

document.getElementById('all_on').addEventListener('click', () => {
    const path = new Array(24).fill(0).map((_, i) => i);
    updateDisplayByPath(path);
    sendPath(path);
});

document.getElementById('pathType').addEventListener('click', () => {
    pathMode = pathMode === 24 ? 8 : 24;
    document.getElementById('pathType').innerText = "Active Paths: " + pathMode;
    const set24Paths = (is24PathMode) => {
        Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
            if(is24PathMode)
                return light.classList.remove('disabled');
            if((i + 2) % 3)
                light.classList.add('disabled');
        });
    } 
    set24Paths(pathMode === 24);
});

document.getElementById('reverseOutput').addEventListener('click', () => {
    const reverseOutput = document.getElementById('reverseOutput');
    reverseOutput.classList.toggle('button-selected');
});

document.getElementById('useTrackingForLights').addEventListener('click', () => {
    const useTrackingForLightsElem = document.getElementById('useTrackingForLights');
    const reverseLightspath = document.getElementById('reverseLightspath');

    useTrackingForLightsElem.classList.toggle('button-selected');
    useTrackingForLights = useTrackingForLightsElem.classList.contains('button-selected');

    document.getElementById('reset').disabled = useTrackingForLights;
    document.getElementById('all_on').disabled = useTrackingForLights;
    document.getElementById('random').disabled = useTrackingForLights;
    reverseLightspath.style.display = useTrackingForLights ? 'block' : 'none';
    setReversingPath(false);
    if(useTrackingForLights) {
        currentNodes = calcRandomNodes();
        currentPath = calcRandomPath(pathMode === 8, currentNodes);
    } else {
        currentNodes = null;
        currentPath = null;
    }
    // reset lights
    updateDisplayByPath([]);
    sendPath([]);
});

document.getElementById('reverseLightspath').addEventListener('click', () => {
    setReversingPath(!reversingPath);    
});

// nback

document.getElementById('startTask').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/nback',
        body: 'startTask'
    }));
});
document.getElementById('startBaseline').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/nback',
        body: 'startBaseline'
    }));
});
document.getElementById('stopTask').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/nback',
        body: 'stopTask'
    }));
});
document.getElementById('triggerLeft').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/nback',
        body: 'triggerLeft'
    }));
});
document.getElementById('triggerRight').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/nback',
        body: 'triggerRight'
    }));
});
document.getElementById('updateSteps').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/nback',
        body: 'nbackSteps:'+document.getElementById('nbackSteps').value
    }));
});

// tracking

document.getElementById('toggleTracking').addEventListener('click', () => {
    allowTracking = !allowTracking;
    if(allowTracking) {
        document.getElementById('toggleTracking').innerText = 'Disable Tracking';
    } else {
        document.getElementById('toggleTracking').innerText = 'Enable Tracking';
    }
});

document.getElementById('startCalibration').addEventListener('click', async () => {
    if(!mainTrackerName || !currentTrackerValues) return;

    await startTimer("calibrating");
    const val1 = parseFloat(currentTrackerValues[mainTrackerName].x);
    await startTimer("calibrating");
    const val2 = parseFloat(currentTrackerValues[mainTrackerName].x);

    const max = Math.max(val1, val2);
    const min = Math.min(val1, val2);
    saveCalibrationData({max, min});
    syncCalibrationDataDisplay();
});

// debug

document.getElementById('echo').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/echo',
        body: 'echoing from web-client'
    }));
});

var logCounter = 0;

document.getElementById('addLog').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/log',
        body: 'log entry ' + logCounter
    }));
    // printLog('log entry ' + logCounter);
    logCounter++;
});

document.getElementById('resetCalibrationdata').addEventListener('click', () => {
    // gives warning to user
    if(!confirm('Are you sure you want to reset the calibration data?')) return;
    saveCalibrationData(null);
    syncCalibrationDataDisplay();
});

document.getElementById('testCalibration').addEventListener('click', () => {
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
});

// document.getElementById('testNodes').addEventListener('click', () => {
//     const nodesToDraw = [];
//     for (let i = 0; i < 5; i++) {
//         nodesToDraw.push(getNodeOnCanvas(i, 930, 30));
//     }
//     console.log(nodesToDraw);
//     updateCanvas(nodesToDraw);
// });


// document.getElementById('testCanvas').addEventListener('click', () => {
//     updateCanvas([
//         {x: Math.random()*930, y: Math.random()*930}
//     ]);
// });

document.getElementById('resetCanvas').addEventListener('click', () => {
    updateCanvas([]);
});

var isTrackingEmulationActive = false;

document.getElementById('emulateTracking').addEventListener('click', () => {
    const trackerMap = document.getElementById("trackerMap");

    if(isTrackingEmulationActive) {
        isTrackingEmulationActive = false;
        document.getElementById('emulateTracking').classList.remove('button-selected');
        trackerMap.removeEventListener("mousemove", emulateTrackerData);
        trackerMap.style.pointerEvents = 'none';
        document.getElementById('trackerDebugData').innerText = '';
        activateSVGNodes([]);
        updateCanvas([]);
        return;
    }
    isTrackingEmulationActive = true;
    trackerMap.addEventListener("mousemove", emulateTrackerData);
    document.getElementById('emulateTracking').classList.add('button-selected');
    trackerMap.style.pointerEvents = 'auto';
});

// other

document.getElementById('toggleLog').addEventListener('click', () => {
    const log = document.getElementById('log');
    log.style.display = log.style.display === 'none' ? 'block' : 'none';
});





// functions

const emulateTrackerData = (e) => {
    const canvas = document.getElementById('trackerMap');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleTrackerData(`emulated,${x},${y},0,0,0,0,0`, true);
}


const printLog = (message) => {
    const log = document.getElementById('log');
    if(log.children.length > 500) {
        log.removeChild(log.children[0]);
    }
    const logEntry = document.createElement('li');
    logEntry.innerText = message;
    log.appendChild(logEntry);
}

const handleTrackerData = (data, skipConversion) => {
    if(!allowTracking) return;
    const trackerDebugData = document.getElementById('trackerDebugData');
    const [name, x, y, z, rx, ry, rz, rw] = data.split(',');
    currentTrackerValues[name] = {x, y, z, rx, ry, rz, rw};
    // TODO: change if we have multiple trackers
    if(mainTrackerName === '')
        mainTrackerName = name;
    const canvasSize = 930;
    let coords;
    if(skipConversion) {
        coords = {x, y};
    } else {
        coords = convertTrackerDataToCanvasCoordinates(parseFloat(x), parseFloat(z), canvasSize, 30, 2);
    }
    
    if(!coords) {
        trackerDebugData.innerText = JSON.stringify({...currentTrackerValues, coords}, null, 2);
        return;
    }
    const nodesInRange = getCurrentNodeInRange(coords.x, coords.y);
    trackerDebugData.innerText = JSON.stringify({...currentTrackerValues, coords, nodesInRange}, null, 2);
    activateSVGNodes([nodesInRange]);
    updatePathWithTracking(nodesInRange);
    updateCanvas([coords]);
}

const updatePathWithTracking = (nodeInRange) => {
    if(!currentNodes || !currentPath) return;
    const currentNode = currentNodes[0];
    if(nodeInRange === currentNode) {
        currentNodes.shift();
        if(currentNodes.length === 0) {
            setReversingPath(!reversingPath);
            currentNodes = calcRandomNodes();
            currentPath = calcRandomPath(pathMode === 8, currentNodes);
            currentNodes = reversingPath ? currentNodes.reverse() : currentNodes;
            if(!currentNodes.includes(currentNode))
                currentNodes.unshift(currentNode);
            updateDisplayByPath([]);
            activePaths = null;
        }
        if(!activePaths)
            activePaths = [];
        const nextPath = getNextPath(
            getUpComingPath(activePaths, currentPath),
            currentNode,
            reversingPath
        );
        if(!activePaths.includes(nextPath))
            activePaths.push(nextPath);
        updateDisplayByPath(currentPath, activePaths);
        sendPath([activePaths.at(-1)]);
    }
};

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
    const path = calcRandomPath(pathMode === 8);
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
    socket.send(JSON.stringify({
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
    socket.send(JSON.stringify({
        path: '/reset',
        body: ''
    }));
}

/**
 * @param {number[]} path [0, 1, 2, 3, 4] (light indexes)
*/
const sendPath = (path) => {
    const body = new Array(24).fill(0).map((_, i) => {
        if(isOutputReversed())
            return path.includes(i) ? '0' : '1';
        return path.includes(i) ? '1' : '0'
    }).join('');
    socket.send(JSON.stringify({
        path: '/setall',
        body
    }));
}

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

const setNBackStatusDisplay = (connected) => {
    const statusNBack = document.getElementById('connectionStatusNBack');
    statusNBack.innerText = 'N-Back:' + (connected ? 'connected' : 'disconnected');
};

const setTrackerStatusDisplay = (connected) => {
    const statusTracker = document.getElementById('connectionStatusTracker');
    statusTracker.innerText = 'Tracker:' + (connected ? 'connected' : 'disconnected');
};

const updateCanvas = (data) => {
    const canvas = document.getElementById('trackerMap');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    data.forEach((point) => {
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    });
}

const syncCalibrationDataDisplay = () => {
    const display = document.getElementById('calibrationDataDisplay');
    const data = getCalibrationData();
    if(!data) {
        display.innerText = 'no calibration data';
        return;
    }
    display.innerText = `min: ${data.min}, max: ${data.max}`;
}

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

syncCalibrationDataDisplay();
setConnectionStatusDisplay(false);
