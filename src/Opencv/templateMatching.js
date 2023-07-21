
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
   
 let colorRed = new cv.Scalar(255, 0, 0, 255);
 let colorBlue = new cv.Scalar(0, 255, 0, 255);

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
    if(maxPoint.x > 0 && maxPoint.y > 0) {
        const lineSize = numberPoint < 2000 ? 2 : parseInt(numberPoint / 1000, 10);
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