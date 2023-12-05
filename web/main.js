// TODO: just a temp solution
const SvgIndexToLightIndex = [1, 6, 4, 3, 0, 5, 2, 7];

Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
    light.addEventListener('click', () => {
        const className = 'selected';
        light.classList.toggle(className);
        console.log(`Light ${i} is ${SvgIndexToLightIndex[i]}`);
        sendLightUpdate(SvgIndexToLightIndex[i], light.classList.contains(className));
    });
});

document.getElementById('reset').addEventListener('click', () => {
    Array.from(document.getElementsByTagName('path')).forEach(light => {
        light.classList.remove('selected');
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