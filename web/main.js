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

document.getElementById('send').addEventListener('click', () => {
    socket.send('Hello Server!');
});

/**
 * creates a random path and sends it to the server
 */
const sendRandomPath = () => {
    const path = calcRandomPath();
    updateDisplayByPath(path);
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
    fetch('http://localhost:5000/setlight', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
            index: index,
            state: state
        })
    }).then(response => {
        if(response.status !== 200)
            console.log(response);
    });
}

/**
 * sends a request to the server to reset all lights
 */
const sendReset = () => {
    fetch('http://localhost:5000/reset', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
    }).then(response => {
        if(response.status !== 200)
            console.log(response);
    });
}

/**
 * @param {number[]} path [0, 1, 2, 3, 4] (light indexes)
 */
const sendPath = (path) => {
    fetch('http://localhost:5000/setall', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
            path: new Array(24).fill(0).map((_, i) => path.includes(i) ? '1' : '0').join('')
        })
    }).then(response => {
        if(response.status !== 200)
            console.log(response);
    });
}