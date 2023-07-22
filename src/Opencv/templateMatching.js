
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
export const findMatch = (cv) => (template, image) => {
    let mask = new cv.Mat();
    let destination = new cv.Mat();
    cv.matchTemplate(image, template, destination, cv.TM_CCORR_NORMED, mask);
    let result = cv.minMaxLoc(destination, mask);
    
    
    //console.log(result)
    //console.log(destination)
    let maxPoint = result.maxLoc;
    let color = new cv.Scalar(255, 0, 0, 255);
    let point = new cv.Point(maxPoint.x + template.cols, maxPoint.y + template.rows);
    //if(maxPoint.x > 20) {
    //cv.rectangle(image, maxPoint, point, color, 2, cv.LINE_8, 0);
    //}
   
 


 const newDst = [];
 let start = 0;
 let end = destination.cols;
 let numberPoint = 0;
 
 const minPointMemory = {
     "x": 999999999,
     "y": 999999999
 }
 const maxPointMemory = {
     "x": 0,
     "y": 0
 }
 const totalPoint = destination.rows * destination.cols;
 let total = 0;
 for (let i = 0; i < destination.rows; i++) {
     newDst[i] = [];
     for (let k = 0; k < destination.cols; k++) {

         newDst[i][k] = destination.data32F[start];

         if (newDst[i][k] > 0.9) {
             numberPoint++;
             total = total + newDst[i][k];
             //console.log(newDst[i][k])
            /* let maxPoint = {
                 "x": k,
                 "y": i
             }
             if(maxPoint.x < minPointMemory.x) {
                 minPointMemory.x = maxPoint.x;
             }
             if(maxPoint.y < minPointMemory.y) {
                 minPointMemory.y = maxPoint.y;
             }
             if(maxPoint.x <= 20) {
                continue;
             }
             
            
             let point = new cv.Point(k + template.cols, i + template.rows);
             if(point.x > maxPointMemory.x) {
                 maxPointMemory.x = maxPoint.x;
             }
             if(point.y > maxPointMemory.y) {
                 maxPointMemory.y = maxPoint.y;
             }*/
             // let colorRed = new cv.Scalar(getRandomInt(255), getRandomInt(255),getRandomInt(255), 255);
             // cv.rectangle(image, maxPoint, point, colorRed, 1, cv.LINE_8, 0);
         }
         start++;
     }
     start = end;
     end = end + destination.cols;
 }
 //console.log("total")
 let average = total/totalPoint;
 //console.log(total/totalPoint)
    
    numberPoint = average;

 //if(maxPointMemory.x !== 0 && maxPointMemory.y !== 0 && minPointMemory.x !== 999999999 && minPointMemory.y !== 999999999 ) {
     //let marginX = 0;// maxPointMemory.x - minPointMemory.x ;
     //let marginY = maxPointMemory.y - minPointMemory.y;
     //cv.rectangle(image, minPointMemory, new cv.Point(maxPointMemory.x + template.cols + marginX, maxPointMemory.y + template.rows + marginY), colorBlue, parseInt(numberPoint / 10, 10), cv.LINE_8, 0);


    let colorBlue = new cv.Scalar(200, 255, 100, 255);
    var point1 = new cv.Point( parseInt((image.cols - template.cols) / 2,10) , parseInt((image.rows - template.rows)/2,10));
    var point2 = new cv.Point( parseInt((image.cols - template.cols) / 2,10) + template.cols  , parseInt((image.rows - template.rows)/2,10) + template.rows);
    cv.rectangle(image, point1, point2, colorBlue, 12, cv.LINE_8, 0);
    let colorRed = new cv.Scalar(255, 100, 200, 255);
    cv.putText(image, "" + numberPoint, new cv.Point(10, 30), cv.FONT_HERSHEY_SIMPLEX, 1.0, colorRed, 1, cv.LINE_AA);

    if(maxPoint.x > 0 && maxPoint.y > 0 && Math.abs(maxPoint.x - point1.x) < 20 && Math.abs(maxPoint.y - point1.y) < 20 ) {
        const lineSize = average < 0.1 ? 1 : parseInt(average * 10, 10);
        //console.log("lineSize")
        //console.log(lineSize)

        cv.rectangle(image, maxPoint, point, color, lineSize, cv.LINE_8, 0);
    }
    else{
        numberPoint = 0;
    }
 /*} 
 else {
     numberPoint = 0;
 }*/
 mask.delete();
 destination.delete();
 return {image, numberPoint};
}