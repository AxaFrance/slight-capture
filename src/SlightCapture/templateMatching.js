import {imageResize} from "./image.js";

export const autoAdjustBrightness = (cv) => (image, minimumBrightness=0.8) => {
    let brightness = 0;
    const src = image;
    if (src.isContinuous()) {
        for (let row = 0; row < src.rows; row++) {
            for (let col = 0; col < src.cols; col++) {
                let R = src.data[row * src.cols * src.channels() + col * src.channels()];
                let G = src.data[row * src.cols * src.channels() + col * src.channels() + 1];
                let B = src.data[row * src.cols * src.channels() + col * src.channels() + 2];
                brightness +=  R +  G + B;
            }
        }
    }
    const ratio = ((brightness /3) / (255 * src.cols * src.rows)) / minimumBrightness;
    if(ratio < 1 && ratio > 0) {
        let alpha = 1 / ratio; // # Brightness control 
        let beta = 0;  // # Contrast control
        cv.convertScaleAbs(image, image, alpha, beta)
        return {image, ratio: alpha};
    }
    return { image, ratio: 0 };
}

export const findMatch = (cv) => (template, image, isDrawRectangle = true) => {
    let mask = new cv.Mat();
    let destination = new cv.Mat();

    let ksize = new cv.Size(2, 2);
    let anchor = new cv.Point(-1, -1);
    cv.blur(image, image, ksize, anchor, cv.BORDER_DEFAULT)

    const autoAdjustBrightnessResult = autoAdjustBrightness(cv)(image);
    image = autoAdjustBrightnessResult.image;
    cv.matchTemplate(image, template, destination, cv.TM_CCORR_NORMED, mask);
    let result = cv.minMaxLoc(destination, mask);
    
    let point1DetectedRectangle = result.maxLoc;
    
   
    let maxPointX = point1DetectedRectangle.x;
    let maxPointY = point1DetectedRectangle.y;
    let templateWidth = template.cols;
    let templateHeight = template.rows;
    let point2DetectedRectangle = new cv.Point(maxPointX + templateWidth, maxPointY + templateHeight);
    
    let imageWidth = image.cols;
    let imageHeight = image.rows;
    const point1RectangleToDetect = new cv.Point(Math.round((imageWidth - templateWidth) / 2), Math.round((imageHeight - templateHeight) / 2));
    const point2RectangleToDetect = new cv.Point(Math.round((imageWidth - templateWidth) / 2) + templateWidth, Math.round((imageHeight - templateHeight) / 2) + templateHeight);
    if(isDrawRectangle) {
        let colorBlue = new cv.Scalar(200, 255, 100, 255);
        cv.rectangle(image, point1RectangleToDetect, point2RectangleToDetect, colorBlue, 1, cv.LINE_8, 0);
    }
    let currentPoints = null;
    if(maxPointX > 0 && maxPointY > 0 && Math.abs(maxPointX - point1RectangleToDetect.x) < 8 && Math.abs(maxPointY - point1RectangleToDetect.y) < 8 ) {
        if (isDrawRectangle) {
            let color = new cv.Scalar(255, 0, 0, 255);
            cv.rectangle(image, point1DetectedRectangle, point2DetectedRectangle, color, 1, cv.LINE_8, 0);
        }
        currentPoints = {
            x1: maxPointX / imageWidth,
            y1: maxPointY / imageHeight,
            x2: point2DetectedRectangle.x / imageWidth,
            y2: point2DetectedRectangle.y / imageHeight,
        }
    }

 mask.delete();
 destination.delete();
 return {
     image, 
     autoAdjustBrightnessRatio : autoAdjustBrightnessResult.ratio,
     targetPoints: {
            x1: point1RectangleToDetect.x / imageWidth,
            y1: point1RectangleToDetect.y / imageHeight,
            x2: point2RectangleToDetect.x / imageWidth,
            y2: point2RectangleToDetect.y / imageHeight
     },
     currentPoints
 };
}

export const applyTemplateMatching = (cv) => async (imageCvTemplate, imgCv) => {
    try {
        if (imgCv === null) return;
        const imd = imageResize(cv)(imgCv, 100);
        const imgCvTemplateResized = imd.image;
        const {image: imageCv, targetPoints, currentPoints, autoAdjustBrightnessRatio} = findMatch(cv)(imageCvTemplate, imgCvTemplateResized);
        return {imageCv, targetPoints, currentPoints, autoAdjustBrightnessRatio};
    } catch (e) {
        console.log(e)
        return null;
    }
}