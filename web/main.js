Array.from(document.getElementsByClassName('light-element')).forEach((light, i) => {
    light.addEventListener('click', () => {
        const className = 'light-element-active';
        light.classList.toggle(className);
        sendLightUpdate(i, light.classList.contains(className));
    });
});

document.getElementById('reset').addEventListener('click', () => {
    Array.from(document.getElementsByClassName('light-element')).forEach(light => {
        light.classList.remove('light-element-active');
    });
    sendReset();
});

/**
 * @param {number} index
 * @param {boolean} state
 */
sendLightUpdate = (index, state) => {
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

sendReset = () => {
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