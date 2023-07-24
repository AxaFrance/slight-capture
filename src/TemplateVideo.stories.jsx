import {TemplateGenerator} from "./TemplateGenerator.jsx";
import useScript from "./Script/useScript.js";
import React, {useState} from "react";
import Loader, {LoaderModes} from "@axa-fr/react-toolkit-loader";
import {toBase64Async, zoneAsync} from "./template.js";
import {imageResize, loadImageAsync, toImageBase64} from "./Opencv/image.js";
import {computeAndApplyHomography, detectAndComputeSerializable} from "./Opencv/match.js";
import {findMatch} from "./Opencv/templateMatching.js";
import {loadVideoAsync} from "./Opencv/video.js";
import cuid from "cuid";



export const TemplateVideo= () => {

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
        url:null,
        confidenceRate: 0
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
        let imgCvTemplateResized = imageResize(cv)(imgCvTemplate, 200).image;
        let imgCvTemplateResizedMatch = imageResize(cv)(imgCvTemplate, 600).image;
        //let imgCvGray = convertImgToGray(cv)(imgCvTemplateResized);
        const resizedImg = detectAndComputeSerializable(cv)(imgCvTemplateResizedMatch);
        const jsonValue = JSON.stringify(resizedImg);
        const templateImage = toImageBase64(cv)(imgCvTemplateResized);

        setState({...state, jsonContent: jsonValue, templateImage:templateImage, imgCvTemplateResized});
        
       // const transform = transformImage(imgCvTemplateResized, resizedImg);
        
        const video = await loadVideoAsync(cv)(imgCvTemplateResized, resizedImg);
        console.log('loadVideoAsync');
        video.start();
        
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
                    </div>}
                <div>
                    {state.output &&
                        <><img style={{"maxWidth": "400px"}} src={state.output} alt="image found"/>
                            <p>{state.numberPoint}</p></>
                    }

                </div>
                <div>
                    {state.url &&
                        <> <p>{state.confidenceRate}</p><img style={{"maxWidth": "400px"}} src={state.url} alt="image found"/></>

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


export default {
    title: 'Demo/Template',
    component: TemplateVideo,
    tags: ['autodocs'],
    argTypes: {
        backgroundColor: { control: 'color' },
    },
};

