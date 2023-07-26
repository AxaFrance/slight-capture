import cuid from "cuid";
import {imageResize, toImageBase64} from "./image.js";
import {findMatch} from "./templateMatching.js";
import {zoneAsync} from "../template.js";
import {findContours} from "./contours.js";

/*
let dst = src.clone();
const imgThresh = new cv.Mat();
const dilate = -1;

//  const imd = imageResize(cv)(dst, 100);
// dst = imd.image;
cv.bilateralFilter(src, src, 9, 10, 75, cv.BORDER_DEFAULT);
// cv.cvtColor(dst, imgThresh, cv.COLOR_RGBA2GRAY, 0);


//cv.Sobel(imgThresh, imgThresh, cv.CV_8U, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
//cv.Sobel(imgThresh, imgThresh, cv.CV_8U, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);

//cv.adaptiveThreshold(imgThresh, imgThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, -2);

/*const M3 = cv.Mat.ones(3, 3, cv.CV_8U);
const M2 = cv.Mat.ones(2, 2, cv.CV_8U);
cv.erode(imgThresh, imgThresh, M2);
cv.dilate(imgThresh, imgThresh, M2);
cv.dilate(imgThresh, imgThresh, M2);*/
//cv.dilate(imgThresh, imgThresh, M2);

/*const M = cv.Mat.ones(3, 3, cv.CV_8U);
cv.morphologyEx(imgThresh, imgThresh, cv.MORPH_CLOSE, M);
cv.morphologyEx(imgThresh, imgThresh, cv.MORPH_OPEN, M);
if (dilate <= 0) {
    const M2 = cv.Mat.ones(6, 6, cv.CV_8U);
    cv.dilate(imgThresh, imgThresh, M2);
}*/
//const s = new cv.Scalar(0, 0, 0, 255);
//cv.copyMakeBorder(imgThresh, imgThresh, 10, 10, 10, 10, cv.BORDER_CONSTANT, s);
//cv.threshold(imgThresh, imgThresh, 177, 200, cv.THRESH_BINARY);
/*   let horizontal = imgThresh.clone();
   var horizontal_size = Math.round(imgThresh.cols / 4);
   // # Create structure element for extracting horizontal lines through morphology operations
   let ksize_horizontal = new cv.Size(horizontal_size, 1);
   var horizontalStructure = cv.getStructuringElement(cv.MORPH_RECT, ksize_horizontal)
   // # Apply morphology operations
   cv.erode(horizontal, horizontal, horizontalStructure)
   cv.dilate(horizontal, horizontal, horizontalStructure)


   let vertical = imgThresh.clone();
   var vertical_size = Math.round(imgThresh.rows / 4);
   // # Create structure element for extracting horizontal lines through morphology operations
   let ksize = new cv.Size(1, vertical_size);
   var verticalStructure = cv.getStructuringElement(cv.MORPH_RECT, ksize)
   // # Apply morphology operations
   cv.erode(vertical, vertical, verticalStructure)
   cv.dilate(vertical, vertical, verticalStructure)


   //const image2 = imgThresh.clone();  //image2 is cloned from image1  to be sure that they have the same size
   const addWeightedMat = new cv.Mat(imgThresh.rows, imgThresh.cols, imgThresh.type());
   const alpha = 0.7;
   const betta = 0.3;
   const gamma = 0;

   cv.addWeighted(vertical, alpha, horizontal, betta, gamma, addWeightedMat);

   cv.adaptiveThreshold(addWeightedMat, addWeightedMat, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, -2);
   //cv.dilate(addWeightedMat, addWeightedMat, M2);
   let contours = new cv.MatVector();
   let hierarchy = new cv.Mat();
   cv.findContours(addWeightedMat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
   for (let i = 0; i < contours.size(); ++i) {
       let contour = contours.get(i);
       // You can try more different parameters
       let rect = cv.boundingRect(contour);
       let area = cv.contourArea(contour, false);
      // console.log(area);
       const height = src.cols;
       const width = src.rows;
       const originArea = height * width
       const percentageAreaMin = Math.round(originArea * 0.0001)
       console.log(area + " > " + percentageAreaMin)
       if (area > percentageAreaMin) {
           let contoursColor = new cv.Scalar(255, 255, 255);
           let rectangleColor = new cv.Scalar(255, 0, 0);
           cv.drawContours(dst, contours, 0, contoursColor, 1, 8, hierarchy, 100);
           let point1 = new cv.Point(rect.x, rect.y);
           let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
           cv.rectangle(dst, point1, point2, rectangleColor, 2, cv.LINE_AA, 0);
       }
   }*/
//cv.imshow(outputCanvas, src);
//src.delete(); 
//dst.delete();
//  contours.delete(); 
//hierarchy.delete();
//imgThresh.delete();
//addWeightedMat.delete();
//horizontal.delete();
//vertical.delete();
//M3.delete();
//M2.delete();

/*for (let i = 0; i < contours.size(); ++i) {
    let contour = contours.get(i);
    contour.delete();
}*/
// cnt.delete();
/*console.log("here")
const contours = findContours(cv)(src, 0);
console.log("after")
console.log(contours)
for (let i = 0; i < contours.length; ++i) {
    var contour = contours[i];
    let contoursColor = new cv.Scalar(255, 255, 255);
    let hierarchy = new cv.Mat();
    cv.drawContours(src, contour, 0, contoursColor, 1, 8, hierarchy, 100);
    console.log("youhou")
}
if(src) {
    cv.imshow(outputCanvas, src)
}*/

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log(devices);
}

const checkImageQuality = (cv) => (imageCvTemplate, imageCvTemplateDescription, imgCv, divId) => {
    return zoneAsync(cv)(imgCv, imageCvTemplateDescription, 30).then(result => {

            try {
                console.log("result", result);
               return result;
            } catch (e) {
                console.log(e)
            }

        }
    );
}

const transformFunction = async (imageCvTemplate, imageCvTemplateDescription, imgCv, divId, state) => {
    try {
        const cv = window.cv;
        if (imgCv === null) return;
        const imd = imageResize(cv)(imgCv, 100);

        const imgCvTemplateResized = imd.image;
        
        const {image: imageCv, matchQuality, targetPoints, currentPoints} = findMatch(cv)(imageCvTemplate, imgCvTemplateResized);
        return {imageCv, matchQuality, targetPoints, currentPoints};
    } catch (e) {
        console.log(e)
    }
}
    
const startCaptureAsync = cv =>(constraints, iVideo) => {
    return new Promise((resolve, error) => {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                if ("srcObject" in iVideo) {
                    iVideo.srcObject = stream;
                } else {
                    iVideo.src = window.URL.createObjectURL(stream);
                }

                stream.getTracks().forEach(function(track) {
                    track.enabled = true;
                    console.log("enable tracks" + track.label  );
                });
      
                iVideo.onloadedmetadata = async function (e) {
                    await iVideo.play();

                    let width = iVideo.width;
                    let height = iVideo.height;
                    console.log({width, height});
                    let stream_settings = stream.getVideoTracks()[0].getSettings();
                    console.log(stream_settings)
                    
                    //const text = document.createTextNode(JSON.stringify(stream_settings));
                    //iH1.appendChild(text);

                    let src = new cv.Mat(stream_settings.height, stream_settings.width, cv.CV_8UC4);
                    iVideo.height = iVideo.videoHeight;
                    iVideo.width = iVideo.videoWidth;
                    let videoCapture = new cv.VideoCapture(iVideo);
                    
                    const stopStreamTracks = () => {
                        stream.getTracks().forEach(function(track) {
                            track.stop();
                            track.enabled = true;
                            console.log("stopStreamTracks" + track.label  );
                        });
                    }

                    resolve({ videoCapture, src, stopStreamTracks});

                }
            })  .catch(function(err) {
            console.error(err.name + ": " + err.message);
            error(err);
        });
    });

}

export const loadVideoAsync = (cv) => (imageCvTemplate, imageCvTemplateDescription) => {
    return new Promise((resolve, error) => {

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log("getUserMedia() not supported.");
            return;
        }
       
        const modalStyle = ` position: fixed;z-index: 10000000;padding-top: 0x;left: 0;top: 0;width: 100%;height: 100vh;overflow: auto;background-color: white;text-align:center;`
        const iDiv = document.createElement('div');
        iDiv.style = modalStyle;
        const divId = cuid();
        iDiv.id = divId;
        document.getElementsByTagName('body')[0].appendChild(iDiv);

        const iH1 = document.createElement('h1');
        
        const text = document.createTextNode("Positionner votre carte d'identité dans le cadre");
        iH1.appendChild(text);
        iH1.id = cuid();
        iDiv.appendChild(iH1);

        let cameraPromise = null;
        let streaming = true;
        let wait = false;
        const stopStreaming = () => {
            streaming = false;
        };

        let constraints = {
            audio: false,
            video: {
                width: { ideal: 2600 },
                height: { ideal: 2600 },
                facingMode: {
                    //ideal: 'face'
                    ideal: 'environment'
                },

            }
        };

        const iButton = document.createElement('button');
        iButton.id = cuid();
        iButton.textContent = "Inverser la caméra";
        iButton.style = 'padding: 0.5em;font-size: 1em;margin: 1em;position:absolute;'
        iButton.onclick = () => {
            stopStreaming();
            constraints.video.facingMode.ideal = constraints.video.facingMode.ideal === 'face' ? 'environment' : 'face';
            cameraPromise = startCaptureAsync(cv)(constraints, iVideo);
        }
        iDiv.appendChild(iButton);

        const iButtonQuit = document.createElement('button');
        iButtonQuit.id = cuid();
        iButtonQuit.textContent = "Quitter";
        iButtonQuit.style = 'padding: 0.5em;font-size: 1em;margin: 1em;position:absolute; top: 0; right: 0;';
        iButtonQuit.onclick = () => {
            stopStreaming();
            iDiv.removeChild(iVideo);
            document.getElementsByTagName('body')[0].removeChild(iDiv);
        }
        iDiv.appendChild(iButtonQuit);

        const outputCanvas = document.createElement("canvas");
        outputCanvas.style = 'display: inline;width: 100%;';
        iDiv.appendChild(outputCanvas);

        const iVideo = document.createElement('video');
        iVideo.style = 'visibility:hidden;display:none;';
        iVideo.id = cuid();
        iDiv.appendChild(iVideo);
        

        const iDivImages = document.createElement('div');
        const modalStyleImage = ` position: fixed;z-index: 100000000;padding-top: 0x;left: 0;top: 0;width: 100%;height: 100vh;overflow: auto;background-color: white;text-align:center;`
        iDivImages.style = modalStyleImage;
        const iDivImagesId = cuid();
        iDivImages.id = iDivImagesId;
        
        
   
        getDevices();
            const FPS = 30;

            
            let state = { bestNumberPoint: 0, confidenceRate: 0 }
            let beginMatch = Date.now();


            
            let numberFollowingMatchQuality = 0;
            async function processVideo(videoCapture, src) {
                try {
                    // start processing.
                    videoCapture.read(src);
                    const imageOutput = imageResize(cv)(src, 1600).image;
                    const {imageCv, matchQuality, targetPoints, currentPoints} = await transformFunction(imageCvTemplate, imageCvTemplateDescription, imageOutput, iDivImagesId, state);
                    const point1 = new cv.Point(Math.round(targetPoints.x1 * imageOutput.cols), Math.round(targetPoints.y1 * imageOutput.rows));
                    const point2 = new cv.Point(Math.round(targetPoints.x2 * imageOutput.cols), Math.round(targetPoints.y2 * imageOutput.rows));
                    
                    let colorBlue = new cv.Scalar(0, 150, 238, 100);
                    cv.rectangle(imageOutput, point1, point2, colorBlue, 30, cv.LINE_8, 0);
                    
                    let diff;
                    if(currentPoints != null) {
                        numberFollowingMatchQuality++;
                        let colorRed = new cv.Scalar(255, 158, 47, 200);
                        diff =  Math.round((Date.now() - beginMatch) / 1000);
                        const font = cv.FONT_HERSHEY_SIMPLEX;
                        const fontScale = 10;
                        const thickness = 20;
                        const baseline=0;
                       // const size= cv.getTextSize('Test', font, fontScale, thickness, baseline);
                        const size = new cv.Size(300, -280);
                        cv.putText(imageOutput, diff.toString(), new cv.Point(Math.round( imageOutput.cols /2 - size.width /2), Math.round( imageOutput.rows /2 - size.height /2)), font, fontScale, colorRed, thickness, cv.LINE_AA);

                        const point1 = new cv.Point(Math.round(currentPoints.x1 * imageOutput.cols), Math.round(currentPoints.y1 * imageOutput.rows));
                        const point2 = new cv.Point(Math.round(currentPoints.x2 * imageOutput.cols), Math.round(currentPoints.y2 * imageOutput.rows));

                        let colorGreen = new cv.Scalar(95, 225, 62, 150);
                        cv.rectangle(imageOutput, point1, point2, colorGreen, 20, cv.LINE_8, 0);
                    }
                    else {
                        numberFollowingMatchQuality = 0;
                        diff = 0;
                        beginMatch = Date.now();
                    }
                   
                    if(diff > 3) {
                        numberFollowingMatchQuality = 0;
                        wait = true;
                        const finalShot = src.clone();
                        stopStreaming();

                      
                        const iHLoading = document.createElement('h1');
                        iHLoading.id = cuid();
                        const text = document.createTextNode("Traitement en cours ...");
                        iHLoading.appendChild(text);
                        iDivImages.appendChild(iHLoading);
                        iDiv.appendChild(iDivImages);
                        
                        delay(1000).then(() => {
                            checkImageQuality(cv)(imageCvTemplate, imageCvTemplateDescription, finalShot, iDivImagesId).then(result => {
                            iDivImages.removeChild(iHLoading);
                            finalShot.delete();
                            if( result && result.finalImage) {
                                const iH1 = document.createElement('h1');
                                iH1.id = cuid();
                                const text = document.createTextNode("Es-ce que tous les champs sont-ils tous parfaitement lisibles ?");
                                iH1.appendChild(text);
                                iDivImages.appendChild(iH1);
                                const iImage = document.createElement('img');
                                iImage.id = cuid();
                                iImage.style = "max-width: 800px;width: 100%;";
                                iImage.src = toImageBase64(cv)(result.finalImage);
                                iDivImages.appendChild(iImage);


                                const iDivButton = document.createElement('div');
                                iDivButton.id = cuid();
                                iDivButton.style = 'display: flex;justify-content: center;align-items: center;'
                                iDivImages.appendChild(iDivButton);

                                const iButtonNo = document.createElement('button');
                                iButtonNo.id = cuid();
                                iButtonNo.style = 'padding: 0.5em;font-size: 2em;margin: 1em;'
                                iButtonNo.textContent = "Non";
                                iButtonNo.onclick = async () => {
                                    iDiv.removeChild(iVideo);
                                    document.getElementsByTagName('body')[0].removeChild(iDiv);
                                    const loadVideo = await loadVideoAsync(cv)(imageCvTemplate, imageCvTemplateDescription);
                                    if(loadVideo) {
                                        loadVideo.start();
                                    }
                                }
                                iDivButton.appendChild(iButtonNo);

                                const iButtonYes = document.createElement('button');
                                iButtonYes.id = cuid();
                                iButtonYes.style = 'padding: 0.5em;font-size: 2em;margin: 1em;'
                                iButtonYes.textContent = "Oui";
                                iButtonYes.onclick = () => {
                                    wait = false;
                                }
                                iDivButton.appendChild(iButtonYes);
                            }
                            });
                           
                            
                        })
                        
                    }
                    
                    if(imageCv){
                        imageCv.delete();
                    }
                    
                    if(imageOutput) {
                        cv.imshow(outputCanvas, imageOutput)
                        imageOutput.delete();
                    }
                    return src;
                } catch (err) {
                    console.error(err);
                    return null
                }
            }

            async function* startStreaming()
            {
                cameraPromise = startCaptureAsync(cv)(constraints, iVideo);
                await delay(100);
                
                while (cameraPromise !== null) {
                    streaming = true;
                    let { videoCapture, src, stopStreamTracks } = await cameraPromise;
                    cameraPromise = null;
                    while (streaming) {
                        let begin = Date.now();
                        yield await processVideo(videoCapture, src);
                        let timeDelay = 1000 / FPS - (Date.now() - begin);
                        await delay(timeDelay);
                    }
                    src.delete();
                    console.log("Fermeture Camera");
                    if(cameraPromise === null){
                        stopStreamTracks();
                    }
                }
                
               
            }
            
            const start = async () => {
                for await (const val of startStreaming()) {

                }
                console.log("Fin du streaming");
            }

            resolve({
                start,
            })
          
  
        
        

       
    });
}
