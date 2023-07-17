

export const findMatch = (cv) => (template, image) => {
    let mask = new cv.Mat();
    let destination = new cv.Mat();
    cv.matchTemplate(image, template, destination, cv.TM_CCOEFF_NORMED, mask);
    let result = cv.minMaxLoc(destination, mask);
    /*
    console.log(result)
    console.log(destination)
    let maxPoint = result.maxLoc;
    let color = new cv.Scalar(255, 0, 0, 255);
    let point = new cv.Point(maxPoint.x + template.cols, maxPoint.y + template.rows);
    cv.rectangle(image, maxPoint, point, color, 2, cv.LINE_8, 0);
    
    */
    let color = new cv.Scalar(255, 0, 0, 255);

    var newDst = [];
    var start = 0;
    var end = destination.cols;

    for (var i = 0; i < destination.rows; i++) {

        newDst[i] = [];
        for (var k = 0; k < destination.cols; k++) {

            newDst[i][k] = destination.data32F[start];

            if (newDst[i][k] > 0.5) {
                console.log(newDst[i][k])
                let maxPoint = {
                    "x": k,
                    "y": i
                }
                let point = new cv.Point(k + template.cols, i + template.rows);
                cv.rectangle(image, maxPoint, point, color, 1, cv.LINE_8, 0);
            }
            start++;
        }
        start = end;
        end = end + destination.cols;
    }

    mask.delete();
    return image;
}