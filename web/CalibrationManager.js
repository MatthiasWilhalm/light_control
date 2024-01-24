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
    console.log(normX, normY, range, canvasRange);
    // scale x, y to canvas size
    const xCanvas = normX * canvasRange / range + canvasBorderOffset;
    const yCanvas = normY * canvasRange / range + canvasBorderOffset;
    
    return { x: xCanvas, y: yCanvas };
};