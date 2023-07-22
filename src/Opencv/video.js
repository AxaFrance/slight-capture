import cuid from "cuid";
import {toImageBase64} from "./image.js";

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log(devices);
}

export const loadVideoAsync = (cv) => (transformImage) => {
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
        //iH1.style = modalStyle;
        var text = document.createTextNode("Positionner votre carte d'identité dans le cadre");
        iH1.appendChild(text);
        iH1.id = cuid();
        iDiv.appendChild(iH1);

        const outputCanvas = document.createElement("canvas");
        outputCanvas.style = 'display: inline;width: 100%;';
        iDiv.appendChild(outputCanvas);

        const iVideo = document.createElement('video');
        iVideo.style = 'visibility:hidden;display:none;';
        iVideo.id = cuid();
        iDiv.appendChild(iVideo);

        const iDivImages = document.createElement('div');
        //iDivImages.style = modalStyle;
        const iDivImagesId = cuid();
        iDivImages.id = iDivImagesId;
        iDiv.appendChild(iDivImages);
        
        let constraints = {
            audio: false,
            video: {
                width: { ideal: 2600 },
                height: { ideal: 2000 },
                facingMode: {
                    //ideal: 'face'
                    ideal: 'environment'
                },
                
            }
        };
        getDevices();
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
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

                    const iP = document.createElement('p');
                    const text = document.createTextNode(JSON.stringify(stream_settings));
                    iP.appendChild(text);
                    iP.id = cuid();
                    iDiv.appendChild(iP);
                    
                    let src = new cv.Mat(stream_settings.height, stream_settings.width, cv.CV_8UC4);
                    let dst = new cv.Mat(stream_settings.height, stream_settings.width, cv.CV_8UC1);
                    iVideo.height = iVideo.videoHeight;
                    iVideo.width = iVideo.videoWidth;
                    let cap = new cv.VideoCapture(iVideo);

                    const FPS = 30;

                    let streaming = true;
                    const stopStreaming = () => {
                        streaming = false;
                    };

                    async function processVideo() {
                        try {
                            // start processing.
                            cap.read(src);
                            const dst = await transformImage(src, iDivImagesId);
                            if(dst) {
                                cv.imshow(outputCanvas, dst)
                            }
                            return src;
                        } catch (err) {
                            console.error(err);
                            return null
                        }
                    }

                    async function* startStreaming() {
                        await delay(100)
                        while (streaming) {
                            let begin = Date.now();
                            yield await processVideo();
                            let timeDelay = 1000 / FPS - (Date.now() - begin);
                            await delay(timeDelay);
                        }
                        src.delete();
                        dst.delete();
                        iVideo.remove();
                    }
                    
                    const start = async () => {
                        for await (const val of startStreaming()) {
        
                        }
                    }

                    resolve({
                        processVideo,
                        start,
                    })
                };
                
            })
            .catch(function(err) {
                console.log(err.name + ": " + err.message);
                error();
            });
    
        
        

       
    });
}
