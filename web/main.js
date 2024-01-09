import { calcRandomPath } from "./PathGenerator.js";

const URL = 'ws://localhost:8765';

const socket = new WebSocket(URL);

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
    console.log('Message from server: ', event.data);
    const message = JSON.parse(event.data);
    if(message.path === '/connections') {
        setNBackStatusDisplay(!!message.body?.includes('nback'));
    }
    if(message.path === '/log') {
        printLog(message.body);
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
    sendReset();
});

document.getElementById('random').addEventListener('click', () => {
    sendRandomPath();
});

document.getElementById('all_on').addEventListener('click', () => {
    const path = new Array(24).fill(0).map((_, i) => i);
    updateDisplayByPath(path);
    sendPath(path);
});

document.getElementById('echo').addEventListener('click', () => {
    socket.send(JSON.stringify({
        path: '/echo',
        body: 'echoing from web-client'
    }));
});

var logCounter = 0;

document.getElementById('addLog').addEventListener('click', () => {
    printLog('log entry ' + logCounter);
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

document.getElementById('toggleLog').addEventListener('click', () => {
    const log = document.getElementById('log');
    log.style.display = log.style.display === 'none' ? 'block' : 'none';
});

const printLog = (message) => {
    const log = document.getElementById('log');
    const logEntry = document.createElement('li');
    logEntry.innerText = message;
    log.appendChild(logEntry);
}

/**
 * creates a random path and sends it to the server
 */
const sendRandomPath = () => {
    const path = calcRandomPath();
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
    socket.send(JSON.stringify({
        path: '/setall',
        body: new Array(24).fill(0).map((_, i) => path.includes(i) ? '1' : '0').join('')
    }));
}

const setConnectionStatusDisplay = (connected) => {
    const icon = document.getElementById('connectionStatusIndicator');
    const statusText = document.getElementById('connectionStatusText');
    const urlText = document.getElementById('connectionStatusConnectedTo');
    const statusNBack = document.getElementById('connectionStatusNBack');

    if (connected) {
        icon.classList.remove('disconnected');
        icon.classList.add('connected');
        statusText.innerText = 'connected';
        urlText.innerText = URL;
        urlText.style.display = 'block';
        statusNBack.style.display = 'block';
    } else {
        icon.classList.remove('connected');
        icon.classList.add('disconnected');
        statusText.innerText = 'disconnected';
        urlText.innerText = '';
        urlText.style.display = 'none';
        statusNBack.style.display = 'none';
    }
};

const setNBackStatusDisplay = (connected) => {
    const statusNBack = document.getElementById('connectionStatusNBack');
    statusNBack.innerText = 'N-Back:' + (connected ? 'connected' : 'disconnected');
};

setConnectionStatusDisplay(false);