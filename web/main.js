import { calcRandomPath } from "./PathGenerator.js";
const socket = new WebSocket('ws://localhost:8765');

// Connection opened
socket.addEventListener('open', (event) => {
    console.log('connected to WebSocket-Server');
});

// Listen for messages
socket.addEventListener('message', (event) => {
    console.log('Message from server: ', event.data);
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

document.getElementById('send').addEventListener('click', () => {
    const path = new Array(24).fill(0).map((_, i) => i);
    updateDisplayByPath(path);
    sendPath(path);
});

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