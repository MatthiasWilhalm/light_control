import { calcRandomPath } from "./PathGenerator.js";

const URL = 'ws://localhost:8765';

const socket = new WebSocket(URL);

const trackerMaxMinValues = {};

var pathMode = 24;

const isOutputReversed = () => document.getElementById('reverseOutput').classList.contains('button-selected');

// Connection opened
socket.addEventListener('open', (event) => {
    console.log('connected to WebSocket-Server');
    setConnectionStatusDisplay(true);
    socket.send(JSON.stringify({
        path: '/identify',
        body: 'web-client'
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
    }    
});

Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
    light.addEventListener('click', () => {
        const nextState = !light.classList.contains('selected');
        updateDisplayLight(light, nextState);
        sendLightUpdate(i, nextState);
    });
});

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
});

document.getElementById('reverseOutput').addEventListener('click', () => {
    const reverseOutput = document.getElementById('reverseOutput');
    reverseOutput.classList.toggle('button-selected');
});

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

document.getElementById('toggleLog').addEventListener('click', () => {
    const log = document.getElementById('log');
    log.style.display = log.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('testCanvas').addEventListener('click', () => {
    updateCanvas([
        {x: Math.random()*930, y: Math.random()*930}
    ]);
});

document.getElementById('resetCanvas').addEventListener('click', () => {
    updateCanvas([]);
});



const printLog = (message) => {
    const log = document.getElementById('log');
    if(log.children.length > 500) {
        log.removeChild(log.children[0]);
    }
    const logEntry = document.createElement('li');
    logEntry.innerText = message;
    log.appendChild(logEntry);
}

const handleTrackerData = (data) => {
    const trackerDebugData = document.getElementById('trackerDebugData');
    const [name, x, y, z, rx, ry, rz, rw] = data.split(',');
    // for min max values
    // trackerMaxMinValues[name] = trackerMaxMinValues[name] || {x: {min: 0, max: 0}, y: {min: 0, max: 0}, z: {min: 0, max: 0}};
    // const maxMinValues = trackerMaxMinValues[name];
    // if(x !== undefined && x !==null) {
    //     maxMinValues.x.min = Math.min(maxMinValues.x.min, x);
    //     maxMinValues.x.max = Math.max(maxMinValues.x.max, x);
    // }
    // if(y !== undefined && y !==null) {
    //     maxMinValues.y.min = Math.min(maxMinValues.y.min, y);
    //     maxMinValues.y.max = Math.max(maxMinValues.y.max, y);
    // }
    // if(z !== undefined && z !==null) {
    //     maxMinValues.z.min = Math.min(maxMinValues.z.min, z);
    //     maxMinValues.z.max = Math.max(maxMinValues.z.max, z);
    // }
    // trackerDebugData.innerText = JSON.stringify(trackerMaxMinValues, null, 2);
    // log current values as json
    const canvasSize = 930;
    let xValue = parseFloat(x)*canvasSize/4 + canvasSize/4;
    let yValue = parseFloat(z)*canvasSize/4 + canvasSize/4;

    updateCanvas([{x: xValue, y: yValue}]);
    trackerDebugData.innerText = JSON.stringify({name, x, y, z, rx, ry, rz, rw, xValue, yValue}, null, 2);
}

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
const updateDisplayLight = (lightHTMLElement, state) => {
    const className = 'selected';
    if (state) {
        lightHTMLElement.classList.add(className);
    } else {
        lightHTMLElement.classList.remove(className);
    }
};

/**
 * updates the state of all lights on the client display
 * by a given path
 * @param {number[]} paths 
 */
const updateDisplayByPath = (paths) => {
    Array.from(document.getElementsByTagName('path'))
        .forEach((light, i) => 
            updateDisplayLight(light, paths.includes(i))
        );
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

setConnectionStatusDisplay(false);