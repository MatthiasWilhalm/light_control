// range where the it counts as "user is on the node"
export const detectableNodeRange = 150;

// normalised nodes location on canvas
const nodes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
];

/**
 * returns the node possition on the canvas
 * as pixel coordinates
 * for now this function assumes that the canvas is a square
 * @param {number} nodeIndex 
 * @param {number} canvasSize 
 * @param {number} canvasBorderOffset basically the border margin
 * @returns {{x: number, y: number}}
 */
export const getNodeOnCanvas = (nodeIndex, canvasSize, canvasBorderOffset) => {
    const node = nodes[nodeIndex];
    const absoluteSize = canvasSize - canvasBorderOffset * 2;
    const x = node.x * absoluteSize / 2 + canvasBorderOffset;
    const y = node.y * absoluteSize / 2 + canvasBorderOffset;
    return { x, y };
};

/**
 * saves the calibration data to local storage
 * @param {{min: number, max: number}} data 
 */
export const saveCalibrationData = (data) => {
    localStorage.setItem('calibrationData', JSON.stringify(data));
};

/**
 * returns the calibration data from local storage
 * @returns {{minY: number, maxY: number, minX: number, maxX: number, rotation: number, flipX: boolean, flipY: boolean}}
 */
export const getCalibrationData = () => {
    const data = localStorage.getItem('calibrationData');
    return data ? JSON.parse(data) : null;
}

/**
 * gets the raw data from the vive tracker
 * and converts it to pixel coordinates on the canvas
 * @param {number} x vive tracker x coordinate
 * @param {number} y vive tracker y coordinate
 * @param {number} canvasSize 
 * @param {number} canvasBorderOffset 
 * @param {number} verticalScale the proportion of the vertical axis to the horizontal axis
 * @returns {{x: number, y: number}} pixel coordinates on the canvas
 */
export const convertTrackerDataToCanvasCoordinates = (x, y, canvasSize, canvasBorderOffset, calibrationDataOverwrite) => {
    const data = calibrationDataOverwrite ?? getCalibrationData();
    if (!data) return null;

    const rangeX = Math.abs(data.maxX - data.minX);
    const rangeY = Math.abs(data.maxY - data.minY);
    const canvasRange = canvasSize - canvasBorderOffset * 2;
    //convert x, y origin from center of screen to top left corner
    const normX = x + rangeX / 2;
    const normY = y + rangeY / 2;
    // scale x, y to canvas size
    let xCanvas = normX * canvasRange / rangeX + canvasBorderOffset;
    let yCanvas = normY * canvasRange / rangeY + canvasBorderOffset;

    if (data.flipX) xCanvas = canvasSize - xCanvas;
    if (data.flipY) yCanvas = canvasSize - yCanvas;

    if(!data.rotation)
        return { x: xCanvas, y: yCanvas };

    const angle = data.rotation * Math.PI / 180;
    const xCenter = canvasSize / 2;
    const yCenter = canvasSize / 2;
    const xRotated = Math.cos(angle) * (xCanvas - xCenter) - Math.sin(angle) * (yCanvas - yCenter) + xCenter;
    const yRotated = Math.sin(angle) * (xCanvas - xCenter) + Math.cos(angle) * (yCanvas - yCenter) + yCenter;

    return { x: xRotated, y: yRotated };
};

/**
 * Finds the node that is closest to the given coordinates
 * if the distance is less than the detectableNodeRange
 * @param {number} x 
 * @param {number} y 
 * @returns {number} index of the node
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