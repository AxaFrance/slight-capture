import {cropImage, imageResize} from "./image.js";

export const autoAdjustBrightness = (cv) => (image, minimumBrightness=0.8, minimumRatio = 0, maximumRatio = 100, template=null) => {
    let brightness = 0;
    const src = image;
    
    
    if(template == null){
        template = image;
    }

    let cols = template.cols;
    let rows = template.rows;
    
    if(template.isContinuous()) {
        let channels = template.channels();
        let data = template.data;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let R = data[row * cols * channels + col * channels];
                let G = data[row * cols * channels + col * channels + 1];
                let B = data[row * cols * channels + col * channels + 2];
                brightness += R + G + B;
            }
        }
    }
    const ratio = ((brightness /3) / (255 * cols * rows)) / minimumBrightness;
    if(ratio < maximumRatio && ratio > minimumRatio) {
        let alpha = 1 / ratio; // # Brightness control
        let beta = 0;  // # Contrast control
        cv.convertScaleAbs(image, image, alpha, beta)
        console.log("Brightness adjusted: " + alpha);
        return { image, ratio: alpha };
    }
    return { image, ratio: 0 };
}

export const findMatch = (cv) => (template, image, isDrawRectangle = false) => {
    let mask = new cv.Mat();
    let destination = new cv.Mat();

    let ksize = new cv.Size(2, 2);
    let anchor = new cv.Point(-1, -1);
    cv.blur(image, image, ksize, anchor, cv.BORDER_DEFAULT)

    let templateWidth = template.cols;
    let templateHeight = template.rows;
    let imageWidth = image.cols;
    let imageHeight = image.rows;
    const point1RectangleToDetect = new cv.Point(Math.round((imageWidth - templateWidth) / 2), Math.round((imageHeight - templateHeight) / 2));
    const point2RectangleToDetect = new cv.Point(Math.round((imageWidth - templateWidth) / 2) + templateWidth, Math.round((imageHeight - templateHeight) / 2) + templateHeight);
    const croppedImage = cropImage(cv)(image.clone(), point1RectangleToDetect.x, point1RectangleToDetect.y, templateWidth, templateHeight);
    
    const autoAdjustBrightnessResult = autoAdjustBrightness(cv)(image, 0.8, 0,100, croppedImage);
    image = autoAdjustBrightnessResult.image;
    cv.matchTemplate(image, template, destination, cv.TM_CCORR_NORMED, mask);
    let result = cv.minMaxLoc(destination, mask);
    
    let point1DetectedRectangle = result.maxLoc;
    
   
    let maxPointX = point1DetectedRectangle.x;
    let maxPointY = point1DetectedRectangle.y;

    let point2DetectedRectangle = new cv.Point(maxPointX + templateWidth, maxPointY + templateHeight);
    


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