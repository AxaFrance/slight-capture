
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
export const findMatch = (cv) => (template, image, isDrawRectangle = false) => {
    let mask = new cv.Mat();
    let destination = new cv.Mat();

    let ksize = new cv.Size(2, 2);
    let anchor = new cv.Point(-1, -1);
    cv.blur(image, image, ksize, anchor, cv.BORDER_DEFAULT)
    
    cv.matchTemplate(image, template, destination, cv.TM_CCORR_NORMED, mask);
    let result = cv.minMaxLoc(destination, mask);
    
    let maxPoint = result.maxLoc;
    
    let color = new cv.Scalar(255, 0, 0, 255);
    let point = new cv.Point(maxPoint.x + template.cols, maxPoint.y + template.rows);
    
    let matchQuality = 0;

    let colorBlue = new cv.Scalar(200, 255, 100, 255);
    const point1 = new cv.Point(Math.round((image.cols - template.cols) / 2), Math.round((image.rows - template.rows) / 2));
    const point2 = new cv.Point(Math.round((image.cols - template.cols) / 2) + template.cols, Math.round((image.rows - template.rows) / 2) + template.rows);
    if(isDrawRectangle) {
        cv.rectangle(image, point1, point2, colorBlue, 1, cv.LINE_8, 0);
    }
   // let colorRed = new cv.Scalar(255, 100, 200, 255);
    //cv.putText(image,  matchQuality.toString(), new cv.Point(10, 30), cv.FONT_HERSHEY_SIMPLEX, 1.0, colorRed, 1, cv.LINE_AA);
    let currentPoints = null;
    if(maxPoint.x > 0 && maxPoint.y > 0 && Math.abs(maxPoint.x - point1.x) < 8 && Math.abs(maxPoint.y - point1.y) < 8 ) {
        //const lineSize = average < 0.1 ? 1 : Math.round( average );
        matchQuality = 1;
        if (isDrawRectangle) {
            cv.rectangle(image, maxPoint, point, color, 1, cv.LINE_8, 0);
        }
        currentPoints = {
            x1: maxPoint.x / image.cols,
            y1: maxPoint.y / image.rows,
            x2: point.x / image.cols,
            y2: point.y / image.rows,
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
     targetPoints: {
            x1: point1.x / image.cols,
            y1: point1.y / image.rows,
            x2: point2.x / image.cols,
            y2: point2.y / image.rows
     },
     currentPoints
 };
}