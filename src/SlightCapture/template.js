import {cropImage, imageResize, loadImageAsync, rotateImage} from "./image.js";
import {computeAndComputeHomographyRectangle} from "./featureMatching.js";
import {cropContours, findContours} from "./contours.js";
import {autoAdjustBrightness} from "./templateMatching.js";


export const toBase64Async = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function extractCroppedContour(cv, imgCvCopy, result, ratio) {
    let angle = 0;
    let mat = new cv.Mat(imgCvCopy.rows, imgCvCopy.cols, imgCvCopy.type(), new cv.Scalar());

    if (result && result.lines) {
        let i = 0;
        const lines = result.lines;
        lines.forEach(l => {
            const rectangleColor = new cv.Scalar(i, 128, 0, 128);
            const p0 = l[0]
            const point0 = new cv.Point(parseInt(p0.x / ratio, 10), parseInt(p0.y / ratio, 10));
            const p1 = l[1]
            const point1 = new cv.Point(parseInt(p1.x / ratio, 10), parseInt(p1.y / ratio, 10));
            i = i + 50
            cv.line(mat, point0, point1, rectangleColor, 5);
        });

        let line0 = lines[0];
        const ax = line0[0].x + line0[1].x;
        const ay = line0[0].y + line0[1].y;

        let line1 = lines[1];
        const bx = line1[0].x + line1[1].x;
        const by = line1[0].y + line1[1].y;

        let line2 = lines[2];
        const cx = line2[0].x + line2[1].x;
        const cy = line2[0].y + line2[1].y;

        let line3 = lines[3];
        const dx = line3[0].x + line3[1].x;
        const dy = line3[0].y + line3[1].y;

        const maxX = Math.max(ax, bx, cx, dx);
        const minX = Math.min(ax, bx, cx, dx);
        const maxY = Math.max(ay, by, cy, dy);

        if (maxX === ax) {
            angle = 270;
        } else if (maxY === ay) {
            angle = 180;
        } else if (minX === ax) {
            angle = 90;
        }

    }

    const contours = findContours(cv)(mat, 0);
    let croppedContours = cropContours(cv)(imgCvCopy, contours);
    let croppedContoursBase64 = croppedContours.map(cc => rotateImage(cv)(cc.img, angle));
    return {angle, croppedContours, croppedContoursBase64};
}

export const zoneAsync = (cv) => async (sceneUrl, imgDescription, goodMatchSizeThreshold = 6, targetPoints) => {
    let imgCv = null;
    if(sceneUrl instanceof String){
        imgCv = await loadImageAsync(cv)(sceneUrl);
    } else{
        imgCv= sceneUrl;
    }
    let imgCvClone = imgCv.clone();
    const autoAdjustBrightnessResult = autoAdjustBrightness(cv)(imgCvClone, 0.5);
    imgCvClone = autoAdjustBrightnessResult.image;
    const marge = Math.round((imgDescription.img.rows+ imgDescription.img.cols) /2 * 0.1);
    
    const point1 = new cv.Point(Math.max(0, Math.round(targetPoints.x1 * imgCvClone.cols) - marge), Math.max(0, Math.round(targetPoints.y1 * imgCvClone.rows) - marge));
    const point2 = new cv.Point(Math.min(imgCvClone.cols, Math.round(targetPoints.x2 * imgCvClone.cols) + marge), Math.min( imgCvClone.rows, Math.round(targetPoints.y2 * imgCvClone.rows) + marge));
    let imgCvCropped = cropImage(cv)(imgCvClone, point1.x, point1.y, point2.x - point1.x, point2.y - point1.y);
    
    imgCvClone.delete();
    let cropRatio = imgCv.cols / imgCvCropped.cols ;
    const { image: imgResized, ratio} = imageResize(cv)(imgCvCropped, 1600 * cropRatio);
    
    
    const result = computeAndComputeHomographyRectangle(cv)(imgDescription, imgResized, goodMatchSizeThreshold);

    const deleteClean = () => {
        if(sceneUrl instanceof String) {
            imgCv.delete();
        }
        imgResized.delete();
        
    }
    
    if (!result) {
        deleteClean();
        
        return {
            expectedOutput: [],
            goodMatchSize: 0,
            finalImage: imgCvCropped,
            outputInfo: null
        };
    }

    let {
        angle,
        croppedContours,
        croppedContoursBase64
    } = extractCroppedContour(cv, imgCvCropped, result, ratio);

    let outputInfo = {
        result: croppedContours.map(cc => {
            return {
                homography: {
                    from: cc.from,
                    to: cc.to
                },
                angle_rotation: angle,
            }
        }),
        img: {
            width: imgCv.cols,
            height: imgCv.rows
        }
    }
    
    const {xmax, xmin, ymax, ymin} = result.rectangle;
    const left = Math.round(xmin / ratio);
    const top = Math.round(ymin / ratio);
    const width = Math.round(xmax / ratio) - left;
    const height = Math.round(ymax / ratio) - top;
    const expectedOutput = [{left, top, width, height}];

    deleteClean();
    imgCvCropped.delete();
    
    return {expectedOutput, goodMatchSize: result.goodMatchSize, finalImage : croppedContoursBase64[0], outputInfo};
}