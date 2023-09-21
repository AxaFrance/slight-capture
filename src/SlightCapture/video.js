import {imageResize, loadImageAsync, toImageBase64} from "./image.js";
import {applyTemplateMatching, templateMatchingImageRatio, templateMatchingImageSize, templateMatchingGreenThresholdPercentage} from "./templateMatching.js";
import {templateMaximumSize, zoneAsync} from "./zoning.js";
import {blobToBase64Async, toBlobAsync} from "./blob.js";
import {detectAndComputeSerializable} from "./featureMatching.js";
import {loadScriptAsync} from "./script.js";
import {cuid} from "./guid.js";

const delay = ms => new Promise(res => setTimeout(res, ms));

const sligthCaptureDatabase = {

};

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
                });
      
                iVideo.onloadedmetadata = async function (e) {
                    await iVideo.play();
                    let stream_settings = stream.getVideoTracks()[0].getSettings();
                    
                    let src = new cv.Mat(stream_settings.height, stream_settings.width, cv.CV_8UC4);
                    iVideo.height = iVideo.videoHeight;
                    iVideo.width = iVideo.videoWidth;
                    let videoCapture = new cv.VideoCapture(iVideo);
                    
                    const stopStreamTracks = () => {
                        stream.getTracks().forEach(function(track) {
                            track.stop();
                            track.enabled = true;
                        });
                    }

                    resolve({ videoCapture, src, stopStreamTracks});

                }
            }) .catch(function(err) {
            console.error(err.name + ": " + err.message);
            error(err);
        });
    });

}
const initTemplateAsync = (cv) => async (file) => {
    const convertedFile = await blobToBase64Async(file);
    const imgCvTemplate = await loadImageAsync(cv)(convertedFile);
    let templateMatchingImage = imageResize(cv)(imgCvTemplate, templateMatchingImageSize * templateMatchingImageRatio).image;
    let ksize = new cv.Size(2, 2);
    let anchor = new cv.Point(-1, -1);
    cv.blur(templateMatchingImage, templateMatchingImage, ksize, anchor, cv.BORDER_DEFAULT)
    let imgCvTemplateResizedMatch = imageResize(cv)(imgCvTemplate, templateMaximumSize).image;
    const featureMatchingDetectAndComputeSerializable = detectAndComputeSerializable(cv)(imgCvTemplateResizedMatch);
    return { featureMatchingDetectAndComputeSerializable, templateMatchingImage };
}

let openCVPromise = null;

const loadOpenCVAsync = async (openCVScript = `https://docs.opencv.org/4.8.0/opencv.js` ) => {
    openCVPromise = loadScriptAsync(openCVScript);
    return await openCVPromise;
}

const texts = {
    'sc-modal__video-title' : 'Positionner 5 secondes votre document dans le cadre',
    'sc-modal__video-invert-camera' : "Inverser caméra",
    'sc-modal__video-message-too-dark' : "Image trop sombre",
    'sc-modal__video-quit' : "X",
    'sc-modal__confirm-loading' : "Traitement en cours...",
    'sc-modal__confirm-title':"Est-ce que tous les champs sont parfaitement lisibles ?",
    'sc-modal__confirm-button--ko':"Non",
    'sc-modal__confirm-button--ok':"Oui",
    'sc-modal__error-title': "Une erreur est survenue",
    'sc-modal__error-button--restart': "Recommencer",
    'sc-modal__error-button--quit': "Quitter",
    'sc-modal__video-message-too-white': "Image trop claire",
};

const properties = {
    translations: texts,
    enableDefaultCss: true,
    outputImageQuality: 0.6,
    outputImageMimeType: 'image/jpeg',
    waitNumberOfSecond: 3,
    thresholdTooWhite: 1.15,
    thresholdTooDark: 2.5,
    video: {
        width: {ideal: 1600},
        height: {ideal: 1600},
        facingMode: {
            ideal: 'environment' // 'face'
        },
    }
}

function validateProperties(internal_properties) {
    let final_properties = {...properties, ...internal_properties};
    final_properties.texts = {...texts, ...internal_properties.texts};

    if (final_properties.outputImageMimeType !== 'image/jpeg' && final_properties.outputImageMimeType !== 'image/png') {
        throw new Error('outputImageMimeType must be image/jpeg or image/png');
    }
    if (final_properties.outputImageQuality < 0 || final_properties.outputImageQuality > 1) {
        throw new Error('outputImageQuality must be between 0 and 1');
    }
    if (final_properties.waitNumberOfSecond < 0) {
        throw new Error('waitNumberOfSecond must be greater than 0');
    }
    if (final_properties.thresholdTooWhite < 0) {
        throw new Error('thresholdTooWhite must be greater than 0');
    }
    if (final_properties.thresholdTooDark < 0) {
        throw new Error('thresholdTooDark must be greater than 0');
    }
    return final_properties;
}

export const loadVideoAsync = (name) => (cv=null) => async (file, 
                                                            onCaptureCallback = null,
                                                            internal_properties = properties) => {
    if(!openCVPromise) {
        openCVPromise = await loadOpenCVAsync();
    }
    await openCVPromise;
    if(!cv) {
        if(window.cv instanceof Promise){
            cv = await window.cv;    
        } else {
            cv = window.cv;
        }
        
    }
    let final_properties = validateProperties(internal_properties);
    const {featureMatchingDetectAndComputeSerializable, templateMatchingImage} = await initTemplateAsync(cv)(file);
  
   return await captureAsync(cv)(name, featureMatchingDetectAndComputeSerializable, templateMatchingImage, onCaptureCallback, final_properties);
}

const displayError = (iDiv, translations, enableDefaultCss, stopStreaming, name, restart, quit) => {
    stopStreaming();
    removeAllChildren(iDiv);
    const iDivError = document.createElement('div');
    if (enableDefaultCss) {
        iDivError.style = `position:absolute;z-index:200000000;padding-top:0;left:0px;top:0px;width:100%;height:100vh;overflow:auto;background-color: white;text-align:center;`;
    }
    iDivError.className = `sc-modal__error-container sc-modal__error-container--${name}`;
    iDivError.id = cuid();
    iDiv.appendChild(iDivError);

    const iH1 = document.createElement('h1');
    iH1.className = 'sc-modal__error-title';
    iH1.id = cuid();
    const text = document.createTextNode(translations['sc-modal__error-title']);
    iH1.appendChild(text);
    iDivError.appendChild(iH1);

    const iDivButton = document.createElement('div');
    iDivButton.id = cuid();
    iDivButton.className = 'sc-modal__error-button-container';
    if (enableDefaultCss) {
        iDivButton.style = 'display: flex;justify-content: center;align-items: center;';
    }
    iDivError.appendChild(iDivButton);

    const iButtonRestart = document.createElement('button');
    iButtonRestart.id = cuid();
    if (enableDefaultCss) {
        iButtonRestart.style = 'padding: 0.5em;font-size: 2em;margin: 1em;';
    }
    iButtonRestart.className = 'sc-modal__error-button sc-modal__error-button--restart';
    iButtonRestart.textContent = translations['sc-modal__error-button--restart'];
    iButtonRestart.onclick = restart;
    iDivButton.appendChild(iButtonRestart);

    const iButtonQuit = document.createElement('button');
    iButtonQuit.id = cuid();
    if (enableDefaultCss) {
        iButtonQuit.style = 'padding: 0.5em;font-size: 2em;margin: 1em;';
    }
    iButtonQuit.className = 'sc-modal__error-button sc-modal__error-button--quit';
    iButtonQuit.textContent = translations['sc-modal__error-button--quit'];
    iButtonQuit.onclick = quit;
    iDivButton.appendChild(iButtonQuit);
}

const removeAllChildren = (node)  => {
    while (node.hasChildNodes()) {
        node.removeChild(node.lastChild);
    }
}

const captureAsync = (cv) => async (name, 
                                    featureMatchingDetectAndComputeSerializable, 
                                    templateMatchingImage, 
                                    onCaptureCallback ,
                                    internal_properties ,
                                    ) => {
    return new Promise((resolve, error) => {
        const { enableDefaultCss, translations, outputImageMimeType, outputImageQuality, waitNumberOfSecond, thresholdTooWhite, thresholdTooDark } = internal_properties;
        let mediaDevices = navigator.mediaDevices;
        if (!mediaDevices || !mediaDevices.getUserMedia) {
            console.log("getUserMedia() not supported.");
            return;
        }

        const iDiv = document.createElement('div');
        iDiv.className = `sc-modal sc-modal--${name}`;
        if (enableDefaultCss) {
            iDiv.style = `margin:0px;position: fixed;z-index: 10000000;padding-top: 0;left: 0;top: 0;width: 100%;height: 100vh;overflow: auto ;background-color: white;text-align:center;`;
        }
        iDiv.id = cuid();
        document.getElementsByTagName('body')[0].appendChild(iDiv);

        const iDivContainerVideo = document.createElement('div');
        iDivContainerVideo.className = `sc-modal__video-container`;
        if (enableDefaultCss) {
            iDivContainerVideo.style = `margin:0px;position: absolute;z-index: 10000000;padding-top: 0;left: 0;top: 0;width: 100%;max-height: 100vh;background-color: white;text-align:center;`;
        }
        iDivContainerVideo.id = cuid();
        iDiv.appendChild(iDivContainerVideo);
        
        const iH1 = document.createElement('h1');
        if (enableDefaultCss) {
            iH1.style = 'padding-left: 0.5em;padding-right: 0.5em;';
        }
        iH1.className = 'sc-modal__video-title';
        const text = document.createTextNode(translations['sc-modal__video-title']);
        iH1.appendChild(text);
        iH1.id = cuid();
        iDivContainerVideo.appendChild(iH1);

        let cameraPromise = null;
        let streaming = true;
        const stopStreaming = () => {
            streaming = false;
        };

        let constraints = {
            audio: false,
            video: internal_properties.video
        };
        
        const quit = () => {
            stopStreaming();
            document.getElementsByTagName('body')[0].removeChild(iDiv);
        };

        const iButton = document.createElement('button');
        iButton.id = cuid();
        iButton.textContent = translations['sc-modal__video-invert-camera']
        iButton.className = 'sc-modal__video-invert-camera';
        if (enableDefaultCss) {
            iButton.style = 'padding:0.5em;font-size:1em;margin:1em;position:absolute;background-color:#a8a8a842;';
        }
        iButton.onclick = () => {
            stopStreaming();
            constraints.video.facingMode.ideal = constraints.video.facingMode.ideal === 'face' ? 'environment' : 'face';
            cameraPromise = startCaptureAsync(cv)(constraints, iVideo);
        }
        iDivContainerVideo.appendChild(iButton);

        const iButtonQuit = document.createElement('button');
        iButtonQuit.id = cuid();
        iButtonQuit.textContent = translations['sc-modal__video-quit']
        iButtonQuit.className = 'sc-modal__video-quit';
        
        if (enableDefaultCss) {
            iButtonQuit.style = 'padding:0.3em;font-size:1em;margin:1em;position:absolute;top:0;right:0;';
        }
        iButtonQuit.onclick = quit;
        iDivContainerVideo.appendChild(iButtonQuit);

        const outputCanvas = document.createElement("canvas");
        if (enableDefaultCss) {
            outputCanvas.style = 'display:inline;max-width:100vw;max-height:86vh;';
        }
        outputCanvas.className = 'sc-modal__video-video';
        iDivContainerVideo.appendChild(outputCanvas);

        const iVideo = document.createElement('video');
        iVideo.style = 'visibility:hidden;display:none;';
        iVideo.autoplay = true;
        iVideo.playsInline = true;
        iVideo.id = cuid();
        iDivContainerVideo.appendChild(iVideo);

        const iDivContainerImage = document.createElement('div');
        if (enableDefaultCss) {
            iDivContainerImage.style = `position:absolute;z-index:100000000;padding-top:0;left:0;top:0;width:100%;height:100vh;overflow:auto;background-color: white;text-align:center;`;
        }
        iDivContainerImage.className = `sc-modal__confirm-container`;
        iDivContainerImage.id = cuid();

        const FPS = 30;
        let beginMatch = Date.now();
        let numberFollowingMatchQuality = 0;

        const restartAsync = async () => {
            document.getElementsByTagName('body')[0].removeChild(iDiv);
            const loadVideo = await captureAsync(cv)(name, featureMatchingDetectAndComputeSerializable, templateMatchingImage, onCaptureCallback, internal_properties);
            if (loadVideo) {
                loadVideo.start();
            }
        }

        let processVideoCache = {
            imageCv: null,
            targetPoints: null,
            currentPoints: null,
            autoAdjustBrightnessRatio : null
        }

        let frameCounter = 0;
        let imageDestination = null;
        async function processVideo(videoCapture, src) {
            videoCapture.read(src);
            if(imageDestination === null && src.cols > 0 && src.rows > 0) {
                imageDestination = new cv.Mat(src.rows, src.cols, cv.CV_8UC4);
            }
            src.copyTo(imageDestination);
            
            if(frameCounter%3===0) {
                const applyTemplateMatchingResult = await applyTemplateMatching(cv)(templateMatchingImage, imageDestination);
                processVideoCache.imageCv = applyTemplateMatchingResult.imageCv;
                processVideoCache.targetPoints = applyTemplateMatchingResult.targetPoints;
                processVideoCache.currentPoints = applyTemplateMatchingResult.currentPoints;
                processVideoCache.autoAdjustBrightnessRatio = applyTemplateMatchingResult.autoAdjustBrightnessRatio;
                
                if (frameCounter > 0) {
                    frameCounter = 0;
                }
                frameCounter++;
            }
            else{
                frameCounter++;
                processVideoCache.imageCv = null;
            }
            const { imageCv, autoAdjustBrightnessRatio, currentPoints, targetPoints } = processVideoCache;
            const point1TargetRectangle = new cv.Point(Math.round(targetPoints.x1 * imageDestination.cols), Math.round(targetPoints.y1 * imageDestination.rows));
            const point2TargetRectangle = new cv.Point(Math.round(targetPoints.x2 * imageDestination.cols), Math.round(targetPoints.y2 * imageDestination.rows));

            let colorRectangle;
            let sizeRectangle; 
             if(currentPoints){
                 const templateMatchingPercentage = Math.abs(currentPoints.x1 - targetPoints.x1) * 100;
                 if( templateMatchingPercentage < templateMatchingGreenThresholdPercentage ) {
                     colorRectangle = new cv.Scalar(95, 225, 62, 150); // Green
                     sizeRectangle = 30;
                 } else {
                     colorRectangle = new cv.Scalar(255, 158, 47, 200); // Orange
                     sizeRectangle = 25;
                 }
             } else {
                 colorRectangle = new cv.Scalar(255, 50, 50, 255); // Red
                 sizeRectangle = 20;
             }
            
            cv.rectangle(imageDestination, point1TargetRectangle, point2TargetRectangle, colorRectangle, sizeRectangle, cv.LINE_8, 0);

            let counterTime;
            if (currentPoints != null) {
                numberFollowingMatchQuality++;
                counterTime = Math.round((Date.now() - beginMatch) / 1000);
                const font = cv.FONT_HERSHEY_SIMPLEX;
                const fontScale = imageDestination.cols > 2000 ? 15 : 10;
                const thickness = 20;
                // const baseline=0;
                // const size= cv.getTextSize('Test', font, fontScale, thickness, baseline);
                const size = new cv.Size(300, -280);
                const subRatio = Math.max(waitNumberOfSecond - counterTime + 1, 1);
                const green = 100 + Math.round(155 / subRatio);
                let colorGreen = new cv.Scalar( 50, green, 255 - Math.round(255 / subRatio), 255);
                cv.putText(imageDestination, (waitNumberOfSecond - counterTime).toString(), new cv.Point(Math.round(imageDestination.cols / 2 - size.width / 2), Math.round(imageDestination.rows / 2 - size.height / 2)), font, fontScale, colorGreen, thickness, cv.LINE_AA);

                //const point1 = new cv.Point(Math.round(currentPoints.x1 * imageDestination.cols), Math.round(currentPoints.y1 * imageDestination.rows));
                //const point2 = new cv.Point(Math.round(currentPoints.x2 * imageDestination.cols), Math.round(currentPoints.y2 * imageDestination.rows));

                //let colorGreen = new cv.Scalar(95, 225, 62, 150);
                //cv.rectangle(imageDestination, point1, point2, colorGreen, 20, cv.LINE_8, 0);
            } else {
                numberFollowingMatchQuality = 0;
                counterTime = 0;
                beginMatch = Date.now();
            }

            if(autoAdjustBrightnessRatio > thresholdTooDark){
                const size = new cv.Size(300, -280);
                const font = cv.FONT_HERSHEY_SIMPLEX;
                const fontScale = imageDestination.cols > 2000 ? 8 : 4;
                const thickness = 10;
                let colorBlack = new cv.Scalar(255, 255, 255, 255);
                cv.putText(imageDestination, translations['sc-modal__video-message-too-dark'], new cv.Point(Math.round(size.width * 0.12), Math.round(imageDestination.rows *0.12)), font, fontScale, colorBlack, thickness, cv.LINE_AA);
            }

            if(autoAdjustBrightnessRatio < thresholdTooWhite){
                const size = new cv.Size(300, -280);
                const font = cv.FONT_HERSHEY_SIMPLEX;
                const fontScale = imageDestination.cols > 2000 ? 8 : 4;
                const thickness = 10;
                let colorWhite = new cv.Scalar(0, 0, 0, 255);
                cv.putText(imageDestination, translations['sc-modal__video-message-too-white'], new cv.Point(Math.round(size.width * 0.12), Math.round(imageDestination.rows *0.12)), font, fontScale, colorWhite, thickness, cv.LINE_AA);
            }

            if (counterTime > waitNumberOfSecond) {
                numberFollowingMatchQuality = 0;
                const finalShot = src.clone();
                stopStreaming();
                
                const iHLoading = document.createElement('p');
                iHLoading.id = cuid();
                const text = document.createTextNode(translations['sc-modal__confirm-loading']);
                iHLoading.className = 'sc-modal__confirm-loading';
                iHLoading.appendChild(text);
                iDivContainerImage.appendChild(iHLoading);
                removeAllChildren(iDiv);
                iDiv.appendChild(iDivContainerImage);

                await delay(50);
                const zoneResult = await zoneAsync(cv)(finalShot, featureMatchingDetectAndComputeSerializable, 60, targetPoints);
                iDivContainerImage.removeChild(iHLoading);
                finalShot.delete();
                
                const iH1 = document.createElement('h1');
                iH1.className = 'sc-modal__confirm-title';
                iH1.id = cuid();
                const textConfirmTitle = document.createTextNode(translations['sc-modal__confirm-title']);
                iH1.appendChild(textConfirmTitle);
                iDivContainerImage.appendChild(iH1);
                const iImage = document.createElement('img');
                iImage.id = cuid();
                iImage.className = 'sc-modal__confirm-image';
                if (enableDefaultCss) {
                    iImage.style = "max-width: 800px;width: 100%;";
                }
                iImage.src = toImageBase64(cv)(zoneResult.finalImage);
                iDivContainerImage.appendChild(iImage);
                
                const iDivButton = document.createElement('div');
                iDivButton.id = cuid();
                iDivButton.className = 'sc-modal__confirm-button-container';
                if (enableDefaultCss) {
                    iDivButton.style = 'display: flex;justify-content: center;align-items: center;';
                }
                iDivContainerImage.appendChild(iDivButton);

                const iButtonNo = document.createElement('button');
                iButtonNo.id = cuid();
                if (enableDefaultCss) {
                    iButtonNo.style = 'padding: 0.5em;font-size: 2em;margin: 1em;';
                }
                iButtonNo.className = 'sc-modal__confirm-button sc-modal__confirm-button--ko';
                iButtonNo.textContent = translations['sc-modal__confirm-button--ko'];
                iButtonNo.onclick = () => {
                    zoneResult.finalImage.delete();
                    restartAsync();
                }
                iDivButton.appendChild(iButtonNo);

                const iButtonYes = document.createElement('button');
                iButtonYes.id = cuid();
                if (enableDefaultCss) {
                    iButtonYes.style = 'padding: 0.5em;font-size: 2em;margin: 1em;';
                }
                iButtonYes.className = 'sc-modal__confirm-button sc-modal__confirm-button--ok';
                iButtonYes.textContent = translations['sc-modal__confirm-button--ok'];
                iButtonYes.onclick = async () => {
                    const blob = await toBlobAsync(cv)(zoneResult.finalImage, outputImageMimeType, outputImageQuality);
                    zoneResult.finalImage.delete();
                    document.getElementsByTagName('body')[0].removeChild(iDiv);
                    if(onCaptureCallback){
                        onCaptureCallback(blob);
                    }
                }
                iDivButton.appendChild(iButtonYes);
            }

            if (imageCv) {
                imageCv.delete();
            }

            if (imageDestination) {
                cv.imshow(outputCanvas, imageDestination)
            }
            return src;
        }

        async function* startStreaming() {
            try {
                cameraPromise = startCaptureAsync(cv)(constraints, iVideo);
                await delay(100);
                while (cameraPromise !== null) {
                    streaming = true;
                    let {videoCapture, src, stopStreamTracks} = await cameraPromise;
                    cameraPromise = null;
                    while (streaming) {
                        let begin = Date.now();
                        yield await processVideo(videoCapture, src);
                        let timeDelay = 1000 / FPS - (Date.now() - begin);
                        await delay(timeDelay);
                    }
                    src.delete();
                    console.log("Fermeture Camera");
                    if (cameraPromise === null) {
                        stopStreamTracks();
                        if (imageDestination) {
                            imageDestination.delete();
                        }
                    }
                } 
            }
            catch (err) {
                console.error(err);
                displayError(iDiv, translations, enableDefaultCss, stopStreaming, name, restartAsync, quit);
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


export const sligthCaptureFactory = (name="default") => {
    if (sligthCaptureDatabase[name]) {
        return sligthCaptureDatabase[name];
    }
    sligthCaptureDatabase[name] ={
        loadVideoAsync: loadVideoAsync(name),
        initAsync: loadOpenCVAsync
    };
    return sligthCaptureDatabase[name];
}
