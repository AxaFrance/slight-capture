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
        const outputCanvas = document.createElement("canvas");
        //outputCanvas.style = 'visibility:hidden;display:none;';
        document.getElementsByTagName('body')[0].appendChild(outputCanvas);
        
        const iVideo = document.createElement('video');
        iVideo.style = 'visibility:hidden;display:none;';
        iVideo.id = cuid();
        
        
        document.getElementsByTagName('body')[0].appendChild(iVideo);

        let constraints = {
            audio: false,
            video: {
                width: { ideal: 1000 },
                height: { ideal: 800 },
                facingMode: {
                    ideal: 'face'
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
                            const dst = await transformImage(src);
                            cv.imshow(outputCanvas, dst);
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
                        start
                    })
                };
                
            })
            .catch(function(err) {
                console.log(err.name + ": " + err.message);
                error();
            });
    
        
        

       
    });
}
