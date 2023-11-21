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

function formatSizeUnits(bytes){
    if      (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + " GB"; }
    else if (bytes >= 1048576)    { bytes = (bytes / 1048576).toFixed(2) + " MB"; }
    else if (bytes >= 1024)       { bytes = (bytes / 1024).toFixed(2) + " KB"; }
    else if (bytes > 1)           { bytes = bytes + " bytes"; }
    else if (bytes === 1)          { bytes = bytes + " byte"; }
    else                          { bytes = "0 bytes"; }
    return bytes;
}

export const SlightCaptureVideo = () => {
    
    const [state, setState] = useState({
        isLoading: false,
        url: null,
        size:0
    });

    useEffect(() => {
        sligthCapture.initAsync("opencv.js");
    });

    const onCapture = async (file) => {
        const convertedFile = await blobToBase64Async(file);
        setState({...state, url: convertedFile, size:file.size});
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
                {state.url && <>
                    <p  style={{"fontSize":"1.2em", color: "green"}}>{formatSizeUnits(state.size)}</p>
                    <img style={{"maxWidth": "100%"}} src={state.url} alt="image found"/>
                </>
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
