
export const autoAdjustBrightness = (cv) => (image, minimumBrightness=0.8) => {
    let brightness = 0;
    const src = image;
    console.log(src.isContinuous())
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
    
    let maxPoint = result.maxLoc;
    
    let color = new cv.Scalar(255, 0, 0, 255);
    let maxPointX = maxPoint.x;
    let maxPointY = maxPoint.y;
    let templateWidth = template.cols;
    let templateHeight = template.rows;
    let point = new cv.Point(maxPointX + templateWidth, maxPointY + templateHeight);
    
    let matchQuality = 0;

    let colorBlue = new cv.Scalar(200, 255, 100, 255);
    let imageWidth = image.cols;
    let imageHeight = image.rows;
    const point1 = new cv.Point(Math.round((imageWidth - templateWidth) / 2), Math.round((imageHeight - templateHeight) / 2));
    const point2 = new cv.Point(Math.round((imageWidth - templateWidth) / 2) + templateWidth, Math.round((imageHeight - templateHeight) / 2) + templateHeight);
    if(isDrawRectangle) {
        cv.rectangle(image, point1, point2, colorBlue, 1, cv.LINE_8, 0);
    }
    let currentPoints = null;
    if(maxPointX > 0 && maxPointY > 0 && Math.abs(maxPointX - point1.x) < 8 && Math.abs(maxPointY - point1.y) < 8 ) {
        matchQuality = 1;
        if (isDrawRectangle) {
            cv.rectangle(image, maxPoint, point, color, 1, cv.LINE_8, 0);
        }
        currentPoints = {
            x1: maxPointX / imageWidth,
            y1: maxPointY / imageHeight,
            x2: point.x / imageWidth,
            y2: point.y / imageHeight,
        }
    }
    else{
        matchQuality = 0;
 
    }
 mask.delete();
 destination.delete();
 return {
     image, 
     matchQuality: matchQuality,
     autoAdjustBrightnessRatio : autoAdjustBrightnessResult.ratio,
     targetPoints: {
            x1: point1.x / imageWidth,
            y1: point1.y / imageHeight,
            x2: point2.x / imageWidth,
            y2: point2.y / imageHeight
     },
     currentPoints
 };
}