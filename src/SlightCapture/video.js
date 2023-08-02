import {base64ToBlob, imageResize, loadImageAsync, toImageBase64} from "./image.js";
import {findMatch} from "./templateMatching.js";
import {toBase64Async, zoneAsync} from "./template.js";
import {detectAndComputeSerializable} from "./featureMatching.js";
import {loadScriptAsync} from "./script.js";
import {cuid} from "./guid.js";


const delay = ms => new Promise(res => setTimeout(res, ms));

const transformFunction = async (imageCvTemplate, imgCv) => {
    try {
        const cv = window.cv;
        if (imgCv === null) return;
        const imd = imageResize(cv)(imgCv, 100);
        const imgCvTemplateResized = imd.image;
        const {image: imageCv, matchQuality, targetPoints, currentPoints, autoAdjustBrightnessRatio} = findMatch(cv)(imageCvTemplate, imgCvTemplateResized);
        return {imageCv, matchQuality, targetPoints, currentPoints, autoAdjustBrightnessRatio};
    } catch (e) {
        console.log(e)
        return null;
    }
}


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
            })  .catch(function(err) {
            console.error(err.name + ": " + err.message);
            error(err);
        });
    });

}
const initTemplateAsync = (cv) => async (file) => {
    const convertedFile = await toBase64Async(file);
    const imgCvTemplate = await loadImageAsync(cv)(convertedFile);
    let templateMatchingImage = imageResize(cv)(imgCvTemplate, 50).image;
    let ksize = new cv.Size(2, 2);
    let anchor = new cv.Point(-1, -1);
    cv.blur(templateMatchingImage, templateMatchingImage, ksize, anchor, cv.BORDER_DEFAULT)
    let imgCvTemplateResizedMatch = imageResize(cv)(imgCvTemplate, 800).image;
    const featureMatchingDetectAndComputeSerializable = detectAndComputeSerializable(cv)(imgCvTemplateResizedMatch);
    return {featureMatchingDetectAndComputeSerializable, templateMatchingImage};
}

let openCVPromise = null;

const loadOpenCVAsync = async (openCVScript = `https://docs.opencv.org/4.8.0/opencv.js` ) => {
    return await loadScriptAsync(openCVScript);
}

const texts = {
    'sc-modal-video__title' : 'Positionner 5 secondes votre document dans le cadre',
    'sc-modal-video__invert-camera' : "Inverser caméra",
    'sc-modal-video__message-too-dark' : "Image trop sombre",
    'sc-modal-video__quit' : "X",
    'sc-modal-confirm__loading' : "Traitement en cours...",
    'sc-modal-confirm__title':"Est-ce que tous les champs sont parfaitement lisibles ?",
    'sc-modal-confirm__button--cancel':"Non",
    'sc-modal-confirm__button--ok':"Oui",
    'sc-modal-confirm__title--error':"Votre document n'a pas été bien détecté, veuillez réessayer",
    'sc-modal-confirm__button--error': "Réessayer",
};

export const loadVideoAsync = (name) => (cv=null) => async (file, 
                                                            onCaptureCallback = null, 
                                                            enableDefaultCss = true,
                                                            translations = texts) => {
    if(!openCVPromise) {
        openCVPromise = loadOpenCVAsync();
    }
    await openCVPromise;
    if(!cv) {
        cv = window.cv;
    }
    const {featureMatchingDetectAndComputeSerializable, templateMatchingImage} = await initTemplateAsync(cv)(file);
  
   return await captureAsync(cv)(name, featureMatchingDetectAndComputeSerializable, templateMatchingImage, onCaptureCallback, enableDefaultCss, translations);
}

const captureAsync = (cv) => async (name, 
                                    featureMatchingDetectAndComputeSerializable, 
                                    templateMatchingImage, 
                                    onCaptureCallback = null, 
                                    enableDefaultCss = true,
                                    translations=texts) => {
    return new Promise((resolve, error) => {
        let mediaDevices = navigator.mediaDevices;
        if (!mediaDevices || !mediaDevices.getUserMedia) {
            console.log("getUserMedia() not supported.");
            return;
        }

        const iDiv = document.createElement('div');
        iDiv.className = `sc-modal-video sc-modal-video--${name}`;
        if (enableDefaultCss) {
            iDiv.style = `position: fixed;z-index: 10000000;padding-top: 0;left: 0;top: 0;width: 100%;height: 100vh;overflow: auto;background-color: white;text-align:center;`;
        }
        iDiv.id = cuid();
        document.getElementsByTagName('body')[0].appendChild(iDiv);

        const iH1 = document.createElement('h1');
        if (enableDefaultCss) {
            iH1.style = 'padding-left: 0.5em;padding-right: 0.5em;';
        }
        iH1.className = 'sc-modal-video__title';
        const text = document.createTextNode(translations['sc-modal-video__title']);
        iH1.appendChild(text);
        iH1.id = cuid();
        iDiv.appendChild(iH1);

        let cameraPromise = null;
        let streaming = true;
        const stopStreaming = () => {
            streaming = false;
        };

        let constraints = {
            audio: false,
            video: {
                width: {ideal: 2600},
                height: {ideal: 2600},
                facingMode: {
                    //ideal: 'face'
                    ideal: 'environment'
                },
            }
        };

        const iButton = document.createElement('button');
        iButton.id = cuid();
        iButton.textContent = translations['sc-modal-video__invert-camera']
        iButton.className = 'sc-modal-video__invert-camera';
        if (enableDefaultCss) {
            iButton.style = 'padding: 0.5em;font-size: 1em;margin: 1em;position:absolute;background-color:#a8a8a842;';
        }
        iButton.onclick = () => {
            stopStreaming();
            constraints.video.facingMode.ideal = constraints.video.facingMode.ideal === 'face' ? 'environment' : 'face';
            cameraPromise = startCaptureAsync(cv)(constraints, iVideo);
        }
        iDiv.appendChild(iButton);

        const iButtonQuit = document.createElement('button');
        iButtonQuit.id = cuid();
        iButtonQuit.textContent = translations['sc-modal-video__quit']
        iButtonQuit.className = 'sc-modal-video__quit';
        
        if (enableDefaultCss) {
            iButtonQuit.style = 'padding: 0.3em;font-size: 1em;margin: 1em;position:absolute; top: 0; right: 0;';
        }
        iButtonQuit.onclick = () => {
            stopStreaming();
            iDiv.removeChild(iVideo);
            document.getElementsByTagName('body')[0].removeChild(iDiv);
        }
        iDiv.appendChild(iButtonQuit);

        const outputCanvas = document.createElement("canvas");
        if (enableDefaultCss) {
            outputCanvas.style = 'display: inline;width: 100%;';
        }
        outputCanvas.className = 'sc-modal-video__video';
        iDiv.appendChild(outputCanvas);

        const iVideo = document.createElement('video');
        iVideo.style = 'visibility:hidden;display:none;';
        iVideo.autoplay = true;
        iVideo.playsInline = true;
        iVideo.id = cuid();
        iDiv.appendChild(iVideo);

        const iDivImages = document.createElement('div');
        if (enableDefaultCss) {
            iDivImages.style = `position: fixed;z-index: 100000000;padding-top: 0;left: 0;top: 0;width: 100%;height: 100vh;overflow: auto;background-color: white;text-align:center;`;
        }
        iDivImages.className = `sc-modal-confirm sc-modal-confirm--${name}`;
        iDivImages.id = cuid();

        const FPS = 30;
        let beginMatch = Date.now();
        let numberFollowingMatchQuality = 0;

        async function processVideo(videoCapture, src) {
            try {
                // start processing.
                videoCapture.read(src);
                const imageOutput = src.clone();
                const {
                    imageCv,
                    matchQuality,
                    targetPoints,
                    currentPoints,
                    autoAdjustBrightnessRatio
                } = await transformFunction(templateMatchingImage, imageOutput);
                const point1 = new cv.Point(Math.round(targetPoints.x1 * imageOutput.cols), Math.round(targetPoints.y1 * imageOutput.rows));
                const point2 = new cv.Point(Math.round(targetPoints.x2 * imageOutput.cols), Math.round(targetPoints.y2 * imageOutput.rows));

                let colorBlue = new cv.Scalar(0, 200, 238, 150);
                cv.rectangle(imageOutput, point1, point2, colorBlue, 30, cv.LINE_8, 0);


                let counterTime;
                if (currentPoints != null) {
                    numberFollowingMatchQuality++;
                    let colorRed = new cv.Scalar(255, 158, 47, 200);
                    counterTime = Math.round((Date.now() - beginMatch) / 1000);
                    const font = cv.FONT_HERSHEY_SIMPLEX;
                    const fontScale = 10;
                    const thickness = 20;
                    // const baseline=0;
                    // const size= cv.getTextSize('Test', font, fontScale, thickness, baseline);
                    const size = new cv.Size(300, -280);
                    cv.putText(imageOutput, counterTime.toString(), new cv.Point(Math.round(imageOutput.cols / 2 - size.width / 2), Math.round(imageOutput.rows / 2 - size.height / 2)), font, fontScale, colorRed, thickness, cv.LINE_AA);

                    const point1 = new cv.Point(Math.round(currentPoints.x1 * imageOutput.cols), Math.round(currentPoints.y1 * imageOutput.rows));
                    const point2 = new cv.Point(Math.round(currentPoints.x2 * imageOutput.cols), Math.round(currentPoints.y2 * imageOutput.rows));

                    let colorGreen = new cv.Scalar(95, 225, 62, 150);
                    cv.rectangle(imageOutput, point1, point2, colorGreen, 20, cv.LINE_8, 0);
                } else {
                    numberFollowingMatchQuality = 0;
                    counterTime = 0;
                    beginMatch = Date.now();
                }


                if(autoAdjustBrightnessRatio > 1.9){
                    const size = new cv.Size(300, -280);
                    const font = cv.FONT_HERSHEY_SIMPLEX;
                    const fontScale = 2;
                    const thickness = 10;
                    let colorRed = new cv.Scalar(200, 200, 0, 100);
                    cv.putText(imageOutput, translations['sc-modal-video__message-too-dark'], new cv.Point(Math.round(size.width + size.width * 0.1), Math.round(imageOutput.rows *0.12)), font, fontScale, colorRed, thickness, cv.LINE_AA);
                }

                if (counterTime > 5) {
                    numberFollowingMatchQuality = 0;
                    const finalShot = src.clone();
                    stopStreaming();
                    
                    const iHLoading = document.createElement('p');
                    iHLoading.id = cuid();
                    const text = document.createTextNode(translations['sc-modal-confirm__loading']);
                    iHLoading.className = 'sc-modal-confirm__loading';
                    iHLoading.appendChild(text);
                    iDivImages.appendChild(iHLoading);
                    iDiv.appendChild(iDivImages);

                    delay(50).then(() => {
                        zoneAsync(cv)(finalShot, featureMatchingDetectAndComputeSerializable, 30, targetPoints).then(result => {
                            iDivImages.removeChild(iHLoading);
                            finalShot.delete();

                            const restart = async () => {
                                iDiv.removeChild(iVideo);
                                document.getElementsByTagName('body')[0].removeChild(iDiv);
                                const loadVideo = await captureAsync(cv)(name, featureMatchingDetectAndComputeSerializable, templateMatchingImage, onCaptureCallback, enableDefaultCss);
                                if (loadVideo) {
                                    loadVideo.start();
                                }
                            }
                            if (result && result.finalImage) {
                                const iH1 = document.createElement('h1');
                                iH1.className = 'sc-modal-confirm__title';
                                iH1.id = cuid();
                                const text = document.createTextNode(translations['sc-modal-confirm__title']);
                                iH1.appendChild(text);
                                iDivImages.appendChild(iH1);
                                const iImage = document.createElement('img');
                                iImage.id = cuid();
                                iImage.className = 'sc-modal-confirm__image';
                                if (enableDefaultCss) {
                                    iImage.style = "max-width: 800px;width: 100%;";
                                }
                                iImage.src = toImageBase64(cv)(result.finalImage);
                                iDivImages.appendChild(iImage);


                                const iDivButton = document.createElement('div');
                                iDivButton.id = cuid();
                                iDivButton.className = 'sc-modal-confirm__button-container';
                                if (enableDefaultCss) {
                                    iDivButton.style = 'display: flex;justify-content: center;align-items: center;';
                                }
                                iDivImages.appendChild(iDivButton);

                                const iButtonNo = document.createElement('button');
                                iButtonNo.id = cuid();
                                if (enableDefaultCss) {
                                    iButtonNo.style = 'padding: 0.5em;font-size: 2em;margin: 1em;';
                                }
                                iButtonNo.className = 'sc-modal-confirm__button sc-modal-confirm__button--cancel';
                                iButtonNo.textContent = translations['sc-modal-confirm__button--cancel'];
                                iButtonNo.onclick = () => {
                                    result.finalImage.delete();
                                    restart();
                                }
                                iDivButton.appendChild(iButtonNo);

                                const iButtonYes = document.createElement('button');
                                iButtonYes.id = cuid();
                                if (enableDefaultCss) {
                                    iButtonYes.style = 'padding: 0.5em;font-size: 2em;margin: 1em;';
                                }
                                iButtonYes.className = 'sc-modal-confirm__button sc-modal-confirm__button--ok';
                                iButtonYes.textContent = translations['sc-modal-confirm__button--ok'];
                                iButtonYes.onclick = async () => {
                                    const imageBase64 = toImageBase64(cv)(result.finalImage);
                                    console.log(imageBase64);
                                    const blob = base64ToBlob(imageBase64);
                                    result.finalImage.delete();
                                    document.getElementsByTagName('body')[0].removeChild(iDiv);
                                    if(onCaptureCallback){
                                        onCaptureCallback(blob);
                                    }
                                }
                                iDivButton.appendChild(iButtonYes);
                            } else {
                                const iH1 = document.createElement('h1');
                                iH1.className = 'sc-modal-confirm__title sc-modal-confirm__title--error';
                                iH1.id = cuid();
                                const text = document.createTextNode(translations['sc-modal-confirm__title--error']);
                                iH1.appendChild(text);
                                iDivImages.appendChild(iH1);

                                const iButtonNo = document.createElement('button');
                                iButtonNo.id = cuid();
                                if (enableDefaultCss) {
                                    iButtonNo.style = 'padding: 0.5em;font-size: 2em;margin: 1em;';
                                }
                                iButtonNo.className = 'sc-modal-confirm__button sc-modal-confirm__button--error';
                                iButtonNo.textContent = translations['sc-modal-confirm__button--error'];
                                iButtonNo.onclick = restart;
                                iDivImages.appendChild(iButtonNo);
                            }
                        });
                    })
                }

                if (imageCv) {
                   // cv.imshow(outputCanvas, imageCv)
                    imageCv.delete();
                }


                if (imageOutput) {
                    cv.imshow(outputCanvas, imageOutput)
                    imageOutput.delete();
                }
                return src;
            } catch (err) {
                console.error(err);
                error(err);
                return null
            }
        }

        async function* startStreaming() {
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
