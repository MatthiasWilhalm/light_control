export const detectableNodeRange = 100;

const nodes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
];

export const getNodeOnCanvas = (nodeIndex, canvasSize, canvasBorderOffset) => {
    const node = nodes[nodeIndex];
    const absoluteSize = canvasSize - canvasBorderOffset * 2;
    const x = node.x * absoluteSize / 2 + canvasBorderOffset;
    const y = node.y * absoluteSize / 2 + canvasBorderOffset;
    return { x, y };
};


export const saveCalibrationData = (data) => {
    localStorage.setItem('calibrationData', JSON.stringify(data));
};

export const getCalibrationData = () => {
    const data = localStorage.getItem('calibrationData');
    return data ? JSON.parse(data) : null;
}

export const convertTrackerDataToCanvasCoordinates = (x, y, canvasSize, canvasBorderOffset, verticalScale = 1) => {
    const data = getCalibrationData();
    if (!data) return null;
    const range = Math.abs(data.max - data.min);
    const canvasRange = canvasSize - canvasBorderOffset * 2;
    //convert x, y origin from center of screen to top left corner
    const normX = x + range / 2;
    const normY = y * verticalScale + range / 2;
    // console.log(normX, normY, range, canvasRange);
    // scale x, y to canvas size
    const xCanvas = normX * canvasRange / range + canvasBorderOffset;
    const yCanvas = normY * canvasRange / range + canvasBorderOffset;
    
    return { x: xCanvas, y: yCanvas };
};

/**
 * Finds the node that is closest to the given coordinates
 * if the distance is less than the detectableNodeRange
 * @param {number} x 
 * @param {number} y 
 */
export const getCurrentNodeInRange = (x, y) => {
    let ret;
    nodes.forEach((_, index) => {
        const nodeOnCanvas = getNodeOnCanvas(index, 930, 30);
        const distance = Math.sqrt((x - nodeOnCanvas.x) ** 2 + (y - nodeOnCanvas.y) ** 2);
        if (distance < detectableNodeRange) {
            ret = index;
            return;
        }
    });
    return ret;
};