import React, {useEffect, useState} from "react";
import {blobToBase64Async} from "./SlightCapture/index.js";
import {sligthCaptureFactory} from "./SlightCapture/video.js";

//import './index.css'

const sligthCapture = sligthCaptureFactory();


const loadTemplateAsync = async (url, filename) => {
    return new Promise(async (resolve, reject) => {
        const files = await fetch(url);
        const blob = await files.blob();
        blob.lastModifiedDate = new Date();
        blob.name = filename;
        blob.filename = filename;
        resolve(blob);
    });
};

export const SlightCaptureVideo = () => {
    
    const [state, setState] = useState({
        isLoading: false,
        url: null,
    });

    useEffect(() => {
        sligthCapture.initAsync("opencv.js");
    });

    const onCapture = async (file) => {
        const convertedFile = await blobToBase64Async(file);
        setState({...state, url: convertedFile});
    }

    const onChange = async event => {
        event.preventDefault();
        let file = event.target.files[0];
        if (!file) return;
        setState({...state, isLoading: true});
        const video = await sligthCapture.loadVideoAsync()(file, onCapture);
        setState({...state, isLoading: false});
        video.start();
    }
    
    const onClick = async (event, url) => {
        event.preventDefault();
        const file = await loadTemplateAsync(url, 'template.jpg');
        if (!file) return;
        setState({...state, isLoading: true});
        const video = await sligthCapture.loadVideoAsync()(file, onCapture);
        setState({...state, isLoading: false});
        video.start();
    }

    if (state.isLoading) {
        return (<p>Loading</p>);
    }

    return (
        <form>
            <h1>Slight Capture</h1>
            <div>
                {state.url &&
                    <img style={{"maxWidth": "800px"}} src={state.url} alt="image found"/>
                }
            </div>
            <a href={'https://github.com/AxaFrance/slight-capture'}>Slight Capture Github</a>

            <div>
                <button onClick={(e) => onClick(e, "./template_cni_recto.jpg") } style={{"fontSize":"2em", margin: "1em"}}>French ID card recto</button>
            </div>
            <div>
                <button onClick={(e) => onClick(e, "./template_cni_verso.jpg") } style={{"fontSize":"2em", margin: "1em"}}>French ID card verso</button>
            </div>
            <div>
                <button onClick={(e) => onClick(e, "./template_new_cni_recto.jpg") } style={{"fontSize":"2em", margin: "1em"}}>New french ID card recto</button>
            </div>
            <div>
                <button onClick={(e) => onClick(e, "./template_new_cni_verso.jpg") } style={{"fontSize":"2em", margin: "1em"}}>New french ID card verso</button>
            </div>
            <div>
                <label style={{"fontSize":"2em", margin: "1em"}}>Your own template :</label>
                <input type="file" onChange={onChange} multiple={true} style={{"fontSize":"2em", margin: "1em"}}/>
            </div>

        </form>
    )

};
