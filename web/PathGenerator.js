const NODES = {
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

export const calcRandomPath = () => {
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