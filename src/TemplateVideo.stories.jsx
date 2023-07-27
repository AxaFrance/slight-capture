import React, {useState, useEffect} from "react";
import Loader, {LoaderModes} from "@axa-fr/react-toolkit-loader";
import {toBase64Async} from "./template.js";
import { sligthCaptureFactory} from "./Opencv/video.js";

const sligthCapture = sligthCaptureFactory("default");

export const TemplateVideo= () => {
    

    const [state, setState] = useState({
        loaderMode: LoaderModes.none,
        url:null,
    });

    useEffect(() => {
        sligthCapture.initAsync();
    });
    
    const onCapture = async (file) => {
        const convertedFile = await toBase64Async(file);
        setState({...state, url: convertedFile});
    }

    const onChange = async event => {
        event.preventDefault();
        let file = event.target.files[0];
        if (!file) return;
        const cv = window.cv;
        setState({...state, loaderMode: LoaderModes.get});
        const video = await sligthCapture.loadVideoAsync(cv)(file, onCapture);
        setState({...state, loaderMode: LoaderModes.none});
        video.start();
    }

    if (state.loaderMode !== LoaderModes.none) {
        return (<p>Loading</p>);
    }
    
    return (
        <Loader mode={state.loaderMode} text={"Your browser is working"}>
            <form className="af-form ri__form-container" name="myform">
                <h1>Template Generator</h1>
                <input type="file" id="newFile" onChange={onChange} multiple={true} />
                <div>
                    {state.url &&
                        <><img style={{"maxWidth": "800px"}} src={state.url} alt="image found"/></>
                    }
                </div>
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

