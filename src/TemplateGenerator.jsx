import Loader, {LoaderModes} from "@axa-fr/react-toolkit-loader";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {playAlgoWithCurrentTemplateAsync, toBase64Async} from "./template";
import {imageResize, loadImageAsync, toImageBase64} from "./Opencv/image";
import {detectAndComputeSerializable} from "./Opencv/match";
import useScript from "./Script/useScript";
import Webcam from "react-webcam";

import './TemplateGenerator.scss';
import {findMatch} from "./Opencv/templateMatching.js";


function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest function.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}


function WebcamImage({captureCallBack, templateJson}) {
    const [img, setImg] = useState(null);
    const [isWorking, setIsWorking] = useState(false);
    const webcamRef = useRef(null);

    const videoConstraints = {
        width: 1000,
        height: 800,
        facingMode: "user",
    };

    const capture = async () => {
        if (isWorking) return;
        setIsWorking(true);
        const imageSrc = webcamRef.current.getScreenshot();
        setImg(imageSrc);
        await captureCallBack(imageSrc, templateJson);
        setIsWorking(false);
    };


    useInterval(() => {
        capture();
    }, 100);


    return (
        <div className="Container">
          
                <>
                    <Webcam
                        audio={false}
                        mirrored={false}
                        screenshotQuality={1}
                        width={1000}
                        height={800}
                        ref={webcamRef}
                        screenshotFormat="image/bmp"
                        videoConstraints={videoConstraints}
                        imageSmoothing={false}
                    />
                </>

        </div>
    );
}

export const TemplateGenerator = () => {

    const [loaded, error] = useScript(
        `https://docs.opencv.org/4.8.0/opencv.js`
    );

    const [state, setState] = useState({
        loaderMode: LoaderModes.none,
        templateImage: "",
        jsonContent: "",
        croppedContoursBase64: [null],
        errorMessage: "",   
        numberPoint:0,
        output:null,
        bestOutput:null,
        bestNumberPoint:0,
    });

    if (!loaded) {
        return (<p>Loading</p>);
    }

    const onChange = async event => {
        event.preventDefault();
        let file = event.target.files[0];
        if (!file) return;
        const cv = window.cv;
        const convertedFile = await toBase64Async(file);
        const imgCvTemplate = await loadImageAsync(cv)(convertedFile);
        const imgCvTemplateResized = imageResize(cv)(imgCvTemplate, 600).image;
        const resizedImg = detectAndComputeSerializable(cv)(imgCvTemplateResized);
        const jsonValue = JSON.stringify(resizedImg);
        const templateImage = await toImageBase64(cv)(imgCvTemplateResized);
        setState({...state, jsonContent: jsonValue, templateImage:templateImage, imgCvTemplateResized});
    }

    const capture = async (value) => {
        const cv = window.cv;
        if(value === null) return;
        const imgCv= await loadImageAsync(cv)(value);
        if (imgCv === null) return;
        const  imd =  imageResize(cv)(imgCv, 800);
        console.log("imd", imd)
        const imgCvTemplateResized = imd.image;
        const  { image : outputCv, numberPoint}    = findMatch(cv)(state.imgCvTemplateResized, imgCvTemplateResized);
        const output  = toImageBase64(cv)(outputCv);
        
        if(numberPoint > state.bestNumberPoint){
            const bestOutput  = toImageBase64(cv)(imgCv);
            console.log("state.numberPoint")
            console.log(state.bestNumberPoint)
            const newState = {...state, output: output, bestNumberPoint: numberPoint, bestOutput: bestOutput};
            setState(newState);
        } else {
            const newState = {...state, numberPoint , output: output};
            setState(newState);
        }
        imgCv.delete();
        imgCvTemplateResized.delete();
    }

    return (
        <Loader mode={state.loaderMode} text={"Your browser is working"}>
            <form className="af-form ri__form-container" name="myform">
                <h1>Template Generator</h1>
                <input type="file" id="newFile" onChange={onChange} multiple={true} />
                {state.templateImage &&
                    <img src={state.templateImage} alt="template image"/>
                }
                {state.jsonContent &&
                    <div style={{"width": "0px", "visibility": "hidden"}}>
                        <WebcamImage  captureCallBack={capture} templateJson={state.jsonContent} />
                    </div>}
                          <div>
                                    {state.output &&
                                        <><img style={{"maxWidth": "400px"}} src={state.output} alt="image found"/>
                                            <p>{state.numberPoint}</p></>
                                    }

</div>
    <div>
                {state.bestOutput &&
                    <> <p>{state.bestNumberPoint}</p><img style={{"maxWidth": "400px"}} src={state.bestOutput} alt="image found"/></>
                   
                }</div>
            </form>
        </Loader>
    )

};