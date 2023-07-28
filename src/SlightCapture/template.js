import {cropImage, imageResize, isImgGray, loadImageAsync, rotateImage, toImageBase64} from "./image";
import {computeAndComputeHomographyRectangle} from "./match";
import {cropContours, findContours} from "./contours";


export const toBase64Async = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const findFirstGoodPageAsync = (cv) => async (files, imgDescription, goodMatchSizeThreshold = 6) => {
    let firstResult = null;
    for (let i = 0; i < files.length; i++) {
        const result = await zoneAsync(cv)(files[i], imgDescription, goodMatchSizeThreshold);
        if (i === 0) {
            firstResult = result;
        }
        if (result.expectedOutput.length > 0) {
            return result;
        }
    }
    if (firstResult) {
        return firstResult;
    }
}

export const playAlgoAsync = (cv) => async (file, imgDescription, goodMatchSizeThreshold = 6, feedback = message => message) => {
    const filename = file.name.toLowerCase();
    let files;
    if (filename.endsWith(".pdf")) {
        files = await convertPdfToImagesAsync()(file, 2);
    } else if (filename.endsWith(".tif") || filename.endsWith(".tiff")) {
        files = await convertTiffToImagesAsync()(file);
    } else if (filename.endsWith(".base64")) {
        files = [file.fileBase64];
    } else {
        files = [await toBase64Async(file)];
    }
    const data = await findFirstGoodPageAsync(cv)(files, imgDescription, goodMatchSizeThreshold);
    return {data, filename, files, feedback};
}

export const playAlgoNoTemplateAsync = async (file) => {
    const filename = file.name.toLowerCase();
    let files;
    if (filename.endsWith(".pdf")) {
        files = await convertPdfToImagesAsync()(file, 2);
    } else if (filename.endsWith(".base64")) {
        files = [file.fileBase64];
    } else if (filename.endsWith(".tif") || filename.endsWith(".tiff")) {
        files = await convertTiffToImagesAsync()(file);
    } else {
        files = [await toBase64Async(file)];
    }
    return files;
}

export const zoneAsync = (cv) => async (sceneUrl, imgDescription, goodMatchSizeThreshold = 6) => {
    let imgCv = null;
    if(sceneUrl instanceof String){
        imgCv = await loadImageAsync(cv)(sceneUrl);
    } else{
        imgCv= sceneUrl;
    }
    let imgCvCopy = imgCv; //.clone();

   // const isGray = isImgGray(cv)(imgCv);

    const {image: imgResized, ratio} = imageResize(cv)(imgCvCopy, 1600);
    
    const templateCols = imgDescription.img.cols;
    const templateRows = imgDescription.img.rows;
    
    const marge = Math.round(1600 * 0.15);
    
    const x1 = Math.round((imgResized.cols - templateCols) / 2) - marge < 0 ? 0 : Math.round((imgResized.cols - templateCols) / 2) - marge;
    const y1 = Math.round((imgResized.rows - templateRows) / 2) - marge < 0 ? 0 : Math.round((imgResized.rows - templateRows) / 2) - marge;
    const w = Math.round( templateCols) + marge *2 > imgResized.cols ? imgResized.cols : Math.round( templateCols) + marge *2;
    const h = Math.round( templateRows) + marge *2 > imgResized.rows ? imgResized.rows : Math.round( templateRows) + marge *2;
    console.log("x1", x1, "y1", y1, "w", w, "h", h);
    console.log("imgResized.cols", imgResized.cols, "imgResized.rows", imgResized.rows);
    console.log("templateCols", templateCols, "templateRows", templateRows);
    const imgResizedAndCropped = cropImage(cv)(imgResized, x1, y1, w, h);
    console.log("youhou");
    //const imgVersoCvTemplate = await loadImageAsync(cv)(imgDescription.template_url);
    //const imgVersoCvTemplateResized = imageResize(cv)(imgVersoCvTemplate, 600).image;
    // const youhou = detectAndComputeSerializable(cv)( imgVersoCvTemplateResized);

    const result = computeAndComputeHomographyRectangle(cv)(imgDescription, imgResizedAndCropped, goodMatchSizeThreshold);
    let angle = 0;
    let mat = new cv.Mat(imgResizedAndCropped.rows, imgResizedAndCropped.cols, imgResizedAndCropped.type(), new cv.Scalar());

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

        const ax = lines[0][0].x + lines[0][1].x;
        const ay = lines[0][0].y + lines[0][1].y;

        const bx = lines[1][0].x + lines[1][1].x;
        const by = lines[1][0].y + lines[1][1].y;

        const cx = lines[2][0].x + lines[2][1].x;
        const cy = lines[2][0].y + lines[2][1].y;

        const dx = lines[3][0].x + lines[3][1].x;
        const dy = lines[3][0].y + lines[3][1].y;

        const maxX = Math.max(ax, bx, cx, dx);
        const minX = Math.min(ax, bx, cx, dx);
        const maxY = Math.max(ay, by, cy, dy);
        const minY = Math.min(ay, by, cy, dy);

        if (maxX === ax) {
            angle = 270;
        } else if (maxY === ay) {
            angle = 180;
        } else if (minX === ax) {
            angle = 90;
        }

    }
   // const base64Url = toImageBase64(cv)(imgCv);
    if (!result) {
        return {
            expectedOutput: [],
           // url: base64Url,
            goodMatchSize: 0,
         //   isGray,
            finalImage: null,
            outputInfo: null
        };
    }

    const {xmax, xmin, ymax, ymin} = result.rectangle;

    const contours = findContours(cv)(mat, 0);
    let croppedContours = cropContours(cv)(imgResizedAndCropped, contours);
    let croppedContourImgs = croppedContours.map(cc => rotateImage(cv)(cc.img, angle));
    let croppedContoursBase64 = croppedContourImgs.map(cc => {
       // let result = imageResize(cv)(cc, 680);
        return cc;
    });

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

    const left = parseInt(xmin / ratio, 10);
    const top = parseInt(ymin / ratio, 10);
    const width = parseInt(xmax / ratio, 10) - left;
    const height = parseInt(ymax / ratio, 10) - top;
    const expectedOutput = [{left, top, width, height}];

    if(sceneUrl instanceof String) {
        imgCv.delete();
    }
    imgResized.delete();
    //imgResizedAndCropped.delete();
    
    return {expectedOutput, goodMatchSize: result.goodMatchSize, finalImage : croppedContoursBase64[0], outputInfo};
}

    export const cropImageAsync = (cv) => async (imageUrlBase64, xmin, ymin, witdh, height, angle = 0) => {
    const img = await loadImageAsync(cv)(imageUrlBase64);
    let rotatedImage = null;
    if (angle) {
        rotatedImage = rotateImage(cv)(img, angle);
    }

    const imgCropped = cropImage(cv)(rotatedImage ? rotatedImage : img, xmin, ymin, witdh, height);
    const base64url = toImageBase64(cv)(imgCropped);
    img.delete();
    if (rotatedImage) {
        rotatedImage.delete();
    }
    imgCropped.delete();
    return base64url;
}
