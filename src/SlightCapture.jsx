import React, {useEffect, useState} from "react";
import {blobToBase64Async} from "./SlightCapture/index.js";
import {sligthCaptureFactory} from "./SlightCapture/video.js";

//import './index.css'

const sligthCapture = sligthCaptureFactory();

export const SlightCaptureVideo = () => {
    
    const [state, setState] = useState({
        isLoading: false,
        url: null,
    });

    useEffect(() => {
        sligthCapture.initAsync();
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

    if (state.isLoading) {
        return (<p>Loading</p>);
    }

    return (
        <form>
            <h1>Slight Capture</h1>
            <a href={'https://github.com/AxaFrance/slight-capture'}>Slight Capture Github</a>
            <div>
            <input type="file" onChange={onChange} multiple={true}/>
            </div>
            <div>
                {state.url &&
                    <img style={{"maxWidth": "800px"}} src={state.url} alt="image found"/>
                }
            </div>
        </form>
    )

};
