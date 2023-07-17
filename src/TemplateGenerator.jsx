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
    const webcamRef = useRef(null);

    const videoConstraints = {
        width: 1000,
        height: 800,
        facingMode: "user",
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImg(imageSrc);
        captureCallBack(imageSrc, templateJson);
    }, [webcamRef, templateJson]);


    useInterval(() => {
        capture();
    }, 200);


    return (
        <div className="Container">
          
                <>
                    <Webcam
                        audio={false}
                        mirrored={false}
                        height={400}    
                        width={400}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
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
        errorMessage: ""
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
        const imgCvTemplateResized = imageResize(cv)(imgCvTemplate, 200).image;
        const resizedImg = detectAndComputeSerializable(cv)(imgCvTemplateResized);
        const jsonValue = JSON.stringify(resizedImg);
        const templateImage = await toImageBase64(cv)(imgCvTemplateResized);
        setState({...state, jsonContent: jsonValue, templateImage:templateImage, imgCvTemplateResized});
    }

    const capture = async (value, templateJson) => {
        const file = {fileBase64: value, name: "screen.base64"};
        //const template = {imgDescription: JSON.parse(templateJson), goodMatchSizeThreshold: 5};
        //setState({...state, loaderMode: LoaderModes.get, croppedContoursBase64: [null]});

        const cv = window.cv;

       // const imageBase64 = await loadImageAsync(cv)(value)
        console.log("imgCv before")
        const imgCv= await loadImageAsync(cv)(value);
     //   console.log("imgCv", imgCv)
        const imgCvTemplateResized = imageResize(cv)(imgCv, 1000).image;
        console.log("imgCvTemplateResized", imgCvTemplateResized)
        const outputCv = findMatch(cv)(state.imgCvTemplateResized, imgCvTemplateResized);
  
        const output  =  await toImageBase64(cv)(outputCv);
        setState({...state, output: output});
        imgCv.delete();
        imgCvTemplateResized.delete();
        //playAlgoWithCurrentTemplateAsync(template, setState, state, file);
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
                    <table>
                        <tbody>
                        <tr>
                            <td>Webcam</td>
                            <td>Image Found</td>
                        </tr>
                        <tr>
                            <td><WebcamImage captureCallBack={capture} templateJson={state.jsonContent} /></td>
                            <td>  {state.errorMessage ? (
                                <p className="template-generator__error">{state.errorMessage}</p>
                            ) : (
                                <>
                                    {state.output &&
                                        <><img style={{"maxWidth": "200px"}} src={state.output} alt="image found"/></>
                                    }
                                </>
                            )
                            }</td>
                        </tr>


                        </tbody>
                    </table>}


            </form>
        </Loader>
    )

};