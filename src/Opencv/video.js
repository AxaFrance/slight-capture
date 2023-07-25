import cuid from "cuid";
import {imageResize, toImageBase64} from "./image.js";
import {findMatch} from "./templateMatching.js";
import {zoneAsync} from "../template.js";

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

const transformFunction = async (imageCvTemplate, imageCvTemplateDescription, imgCv, divId, state, promise) => {
    try {
        const cv = window.cv;
        if (imgCv === null) return;
        const imd = imageResize(cv)(imgCv, 200);

        const imgCvTemplateResized = imd.image;
        
        const {image: imageCv, matchQuality} = findMatch(cv)(imageCvTemplate, imgCvTemplateResized);
        return {imageCv, matchQuality};
        if (matchQuality > 0) {

            if(promise !== null) {
                const bestOutput = toImageBase64(cv)(imgCv);
                const newState = {
                    ...state,
                    output: outputCv,
                    bestNumberPoint: matchQuality,
                    bestOutput: bestOutput,
                };
                state = newState;
                return;
            }
            // const imgDescription =  JSON.parse(state.jsonContent)
            // const limiteRate = parseInt((state.confidenceRate + state.confidenceRate / 8), 10);
            //  console.log("limiteRate", limiteRate)
           /* promise = zoneAsync(cv)(imgCv, imageCvTemplateDescription, 30).then(result => {

                    try {
                        console.log("result", result);
                        if (result && result?.goodMatchSize > state.confidenceRate) {
                            const bestOutput = toImageBase64(cv)(imgCv);
                            const newState = {
                                ...state,
                                output: outputCv,
                                bestNumberPoint: numberPoint,
                                bestOutput: bestOutput,
                                //url: result?.croppedContoursBase64,
                                confidenceRate: result?.goodMatchSize
                            };

                            if( result && result.finalImage) {
                                const iVideo = document.createElement('img');
                                iVideo.id = cuid();
                                iVideo.style = "max-width: 400px";
                                iVideo.src = toImageBase64(cv)(result.finalImage);
                                document.getElementById(divId).appendChild(iVideo);
                            }


                            state = newState;
                        }
                        promise = null;
                    } catch (e) {
                        console.log(e)
                        promise = null;
                    }

                }
            );*/

            /*
            const result = await computeAndApplyHomography(cv)(imgDescription, imgCv, state.confidenceRate);
            if (result?.goodMatchSize > state.confidenceRate) {
                const bestOutput = toImageBase64(cv)(imgCv);
                const newState = {
                    ...state,
                    output: outputCv,
                    bestNumberPoint: numberPoint,
                    bestOutput: bestOutput,
                    //url: result?.croppedContoursBase64,
                    confidenceRate: result?.goodMatchSize
                };
                const iVideo = document.createElement('img');
                iVideo.id = cuid();
                iVideo.src = toImageBase64(cv)(result?.finalImage);
                document.getElementById(divId).appendChild(iVideo);


                state = newState;
            }*/

        } else {
            const newState = {...state, numberPoint, output: outputCv};
            state = newState;
        }
        // imgCv.delete();
        //  imgCvTemplateResized.delete();
        return outputCv;
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


                    resolve({ videoCapture, src});

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
        const stopStreaming = () => {
            streaming = false;
        };

        let constraints = {
            audio: false,
            video: {
                width: { ideal: 1600 },
                height: { ideal: 1600 },
                facingMode: {
                    //ideal: 'face'
                    ideal: 'environment'
                },

            }
        };

        const iButton = document.createElement('button');
        iButton.id = cuid();
        iButton.textContent = "Inverser la caméra";
        iButton.style = 'padding: 0.5em;font-size: 2em;margin: 1em;float: right;'
        iButton.onclick = () => {
            stopStreaming();
            constraints.video.facingMode.ideal = constraints.video.facingMode.ideal === 'face' ? 'environment' : 'face';
            cameraPromise = startCaptureAsync(cv)(constraints, iVideo);
        }
        iDiv.appendChild(iButton);

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
            let promise = null;
            let beginMatch = Date.now();


            
            let numberFollowingMatchQuality = 0;
            async function processVideo(videoCapture, src) {
                try {
                    // start processing.
                    videoCapture.read(src);
                    const {imageCv, matchQuality} = await transformFunction(imageCvTemplate, imageCvTemplateDescription, src, iDivImagesId, state, promise, true);
                    let diff;
                    if(matchQuality > 0) {
                        numberFollowingMatchQuality++;
                        let colorRed = new cv.Scalar(255, 100, 200, 255);
                        diff =  Math.round((Date.now() - beginMatch) / 1000);
                        cv.putText(imageCv, diff.toString(), new cv.Point(30, 100), cv.FONT_HERSHEY_SIMPLEX, 1.0, colorRed, 1, cv.LINE_AA);
                    }
                    else {
                        numberFollowingMatchQuality = 0;
                        diff = 0;
                        beginMatch = Date.now();
                    }
                   
                    if(diff > 3 && promise === null) {
                        numberFollowingMatchQuality = 0;
                        stopStreaming();
                        iDiv.appendChild(iDivImages);
                        promise = checkImageQuality(cv)(imageCvTemplate, imageCvTemplateDescription, src, iDivImagesId).then(result => {
                            promise = null;
                            if( result && result.finalImage) {
                                const iH1 = document.createElement('h1');
                                iH1.id = cuid();
                                const text = document.createTextNode("Es-ce que tous les champs sont-ils tous parfaitement lisibles ?");
                                iH1.appendChild(text);
                                iDivImages.appendChild(iH1);
                                const iVideo = document.createElement('img');
                                iVideo.id = cuid();
                                iVideo.style = "max-width: 800px";
                                iVideo.src = toImageBase64(cv)(result.finalImage);
                                iDivImages.appendChild(iVideo);
                                
                                
                                const iDivButton = document.createElement('div');
                                iDivButton.id = cuid();
                                iDivButton.style = 'display: flex;justify-content: center;align-items: center;'
                                iDivImages.appendChild(iDivButton);

                                const iButtonNo = document.createElement('button');
                                iButtonNo.id = cuid();
                                iButtonNo.style = 'padding: 0.5em;font-size: 2em;margin: 1em;'
                                iButtonNo.textContent = "Non";
                                iButtonNo.onclick = () => {

                                }
                                iDivButton.appendChild(iButtonNo);

                                const iButtonYes = document.createElement('button');
                                iButtonYes.id = cuid();
                                iButtonYes.style = 'padding: 0.5em;font-size: 2em;margin: 1em;'
                                iButtonYes.textContent = "Oui";
                                iButtonYes.onclick = () => {

                                }
                                iDivButton.appendChild(iButtonYes);
                                
                                
                                
                            }
                           
                            
                        })
                        
                    }
                    
                    if(imageCv) {
                        cv.imshow(outputCanvas, imageCv)
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
                    let { videoCapture, src } = await cameraPromise;
                    cameraPromise = null;
                    while (streaming) {
                        let begin = Date.now();
                        yield await processVideo(videoCapture, src);
                        let timeDelay = 1000 / FPS - (Date.now() - begin);
                        await delay(timeDelay);
                    }
                    src.delete();
                }
               
            }
            
            const start = async () => {
                for await (const val of startStreaming()) {

                }
            }

            resolve({
                start,
            })
          
  
        
        

       
    });
}
