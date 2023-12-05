// TODO: just a temp solution
const SvgIndexToLightIndex = [1, 6, 4, 3, 0, 5, 2, 7];
const LightIndexToSvgIndex = (index) => SvgIndexToLightIndex.indexOf(index);

Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
    light.addEventListener('click', () => {
        const className = 'selected';
        light.classList.toggle(className);
        sendLightUpdate(SvgIndexToLightIndex[i], light.classList.contains(className));
    });
});

document.getElementById('reset').addEventListener('click', () => {
    Array.from(document.getElementsByTagName('path')).forEach(light => {
        light.classList.remove('selected');
    });
    sendReset();
});

document.getElementById('random').addEventListener('click', () => {
    sendRandomPath();
});

const NODES = {
    // path: [neighbouring nodes]
    0: {
        neighbours: [1, 2, 3],
        paths: [0, 1, 2]
    },
    1: {
        neighbours: [0, 2, 4],
        paths: [0, 3, 5]
    },
    2: {
        neighbours: [0, 1, 3, 4],
        paths: [1, 3, 4, 6]
    },
    3: {
        neighbours: [0, 2, 4],
        paths: [2, 4, 7]
    },
    4: {
        neighbours: [1, 2, 3],
        paths: [5, 6, 7]
    }
};

sendRandomPath = () => {
    const path = calcRandomPath();
    updatePathDispaly(path.map(path => LightIndexToSvgIndex(path)));
    sendPath(path);
};

const calcRandomPath = () => {
    const path = [];
    let currentNode = 0;
    let nextNode = 0;
    let prevNodes = [];
    let i = 0;
    path.push(currentNode);
    while (currentNode !== 4 && i < 100) {
        const connectedNodes = NODES[currentNode].neighbours;
        const filteredNodes = connectedNodes.filter(node => prevNodes.indexOf(node) === -1);
        nextNode = filteredNodes[Math.floor(Math.random() * filteredNodes.length)];
        prevNodes.push(currentNode);
        currentNode = nextNode;
        i++;
        path.push(currentNode);
    }
    return convertNodeIndexesToPath(path);
}

const convertNodeIndexesToPath = (nodeIndexes) => {
    const paths = [];
    for (let i = 0; i < nodeIndexes.length - 1; i++) {
        const path = nodeIndexesToPaths(nodeIndexes[i], nodeIndexes[i + 1]);
        paths.push(path);
    }
    return paths;
};

const nodeIndexesToPaths = (startNode, endNode) => {
    const index = NODES[startNode].neighbours.indexOf(endNode);
    return NODES[startNode].paths[index];
}

const updatePathDispaly = (paths) => {
    Array.from(document.getElementsByTagName('path')).forEach((light, i) => {
        light.classList.remove('selected');
        if (paths.includes(i)) {
            light.classList.add('selected');
        }
    });
};


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

// path = [0, 1, 2, 3, 4] (light indexes)
sendPath = (path) => {
    fetch('http://localhost:5000/setall', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
            path: new Array(8).fill(0).map((_, i) => path.includes(i) ? '1' : '0').join('')
        })
    }).then(response => {
        if(response.status !== 200)
            console.log(response);
    });
}