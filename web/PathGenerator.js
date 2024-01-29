const NODES = {
    0: {
        neighbours: [1, 1, 1, 2, 2, 2, 3, 3, 3],
        paths: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    },
    1: {
        neighbours: [0, 0, 0, 2, 2, 2, 4, 4, 4],
        paths: [0, 1, 2, 9, 10, 11, 15, 16, 17]
    },
    2: {
        neighbours: [0, 0, 0, 1, 1, 1, 3, 3, 3, 4, 4, 4],
        paths: [3, 4, 5, 9, 10, 11, 12, 13, 14, 18, 19, 20]
    },
    3: {
        neighbours: [0, 0, 0, 2, 2, 2, 4, 4, 4],
        paths: [6, 7, 8, 12, 13, 14, 21, 22, 23]
    },
    4: {
        neighbours: [1, 1, 1, 2, 2, 2, 3, 3, 3],
        paths: [15, 16, 17, 18, 19, 20, 21, 22, 23]
    }
};

const getReducedNeighbours = (nodeIndex) => {
    return [...new Set(NODES[nodeIndex].neighbours)];
};

export const calcRandomNodes = () => {
    const path = [];
    let currentNode = 0;
    let nextNode = 0;
    let prevNodes = [];
    let i = 0;
    path.push(currentNode);
    while (currentNode !== 4 && i < 100) {
        const connectedNodes = getReducedNeighbours(currentNode);
        const filteredNodes = connectedNodes.filter(node => prevNodes.indexOf(node) === -1);
        nextNode = filteredNodes[Math.floor(Math.random() * filteredNodes.length)];
        prevNodes.push(currentNode);
        currentNode = nextNode;
        i++;
        path.push(currentNode);
    }
    // quick and dirty fix to avoid paths with only 2 nodes
    return path.length > 3 ? path : calcRandomNodes();
};


export const calcRandomPath = (disablePathVariation, path = calcRandomNodes()) => {
    return convertNodeIndexesToPath(path, disablePathVariation);
}

export const getNextPath = (paths, currentNode, reverse) => {
    let ret = null;

    for (const index in NODES[currentNode].neighbours) {
        const orderedPaths = reverse ? NODES[currentNode].paths.slice().reverse() : NODES[currentNode].paths;
        if (paths.includes(orderedPaths[index])) {
            ret = orderedPaths[index];
            break;
        }
    }
    return ret;
}


const convertNodeIndexesToPath = (nodeIndexes, disablePathVariation) => {
    const paths = [];
    // this is needed since we currently only connect to nodes that are next to each other
    // but we want to have some variation in the paths
    const getRandomOffset = () => Math.floor(Math.random() * 3);
    for (let i = 0; i < nodeIndexes.length - 1; i++) {
        const path = nodeIndexesToPaths(
            nodeIndexes[i], 
            nodeIndexes[i + 1], 
            disablePathVariation ? 1 : getRandomOffset()
        );
        paths.push(path);
    }
    return paths;
};

const nodeIndexesToPaths = (startNode, endNode, offset) => {
    const index = NODES[startNode].neighbours.indexOf(endNode);
    return NODES[startNode].paths[index + offset];
}