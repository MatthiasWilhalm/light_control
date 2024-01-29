// nodes with their neighbours and the paths that connect them
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

/**
 * Returns the neighbours of a node without duplicates
 * @param {number} nodeIndex 
 * @returns 
 */
const getReducedNeighbours = (nodeIndex) => {
    return [...new Set(NODES[nodeIndex].neighbours)];
};

/**
 * returns an array of node indexes that can be used to generate a path
 * first node is always 0, last node is always 4
 * @returns {number[]}
 */
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

/**
 * generates a random path based on the given node indexes
 * if path param is not given, it will generate random nodes
 * @param {boolean} disablePathVariation true if there are 8 paths, false if there are 24
 * @param {number[]} path 
 * @returns {number[]}
 */
export const calcRandomPath = (disablePathVariation, path = calcRandomNodes()) => {
    return convertNodeIndexesToPath(path, disablePathVariation);
}

/**
 * returns the next path that the user should walk
 * @param {number[]} paths all paths that are NOT currently active
 * @param {number} currentNode where the user is currently located
 * @param {boolean} reverse true if the user is walking from node 4 to node 0
 * @returns {number} the next path that the user should walk
 */
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

/**
 * returns the paths that connect the given nodes
 * if disablePathVariation is false, it will choose a random path out of 3 possible paths
 * that connects the same node
 * @param {number[]} nodeIndexes 
 * @param {boolean} disablePathVariation 
 * @returns {number[]}
 */
const convertNodeIndexesToPath = (nodeIndexes, disablePathVariation) => {
    const paths = [];
    // this is needed since we currently only connect to nodes that are next to each other
    // but we want to have some variation in the paths
    const getRandomOffset = () => Math.floor(Math.random() * 3);
    for (let i = 0; i < nodeIndexes.length - 1; i++) {
        const path = nodeIndexesToPath(
            nodeIndexes[i], 
            nodeIndexes[i + 1], 
            disablePathVariation ? 1 : getRandomOffset()
        );
        paths.push(path);
    }
    return paths;
};

/**
 * returns the path that connects the given nodes
 * @param {number} startNode 
 * @param {number} endNode 
 * @param {number} offset 
 * @returns {number}
 */
const nodeIndexesToPath = (startNode, endNode, offset) => {
    const index = NODES[startNode].neighbours.indexOf(endNode);
    return NODES[startNode].paths[index + offset];
}