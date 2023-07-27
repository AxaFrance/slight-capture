import React, {useState, useEffect} from "react";
import {toBase64Async} from "./template.js";
import { sligthCaptureFactory} from "./Opencv/video.js";

const sligthCapture = sligthCaptureFactory("default");

export const SlightCaptureVideo= () => {
    

    const [state, setState] = useState({
        isLoading: false,
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
        setState({...state, isLoading: true});
        const video = await sligthCapture.loadVideoAsync(cv)(file, onCapture);
        setState({...state, isLoading: false});
        video.start();
    }

    if (state.isLoading) {
        return (<p>Loading</p>);
    }
    
    return (
            <form className="af-form ri__form-container" name="myform">
                <h1>Slight Capture</h1>
                <input type="file" id="newFile" onChange={onChange} multiple={true} />
                <div>
                    {state.url &&
                        <><img style={{"maxWidth": "800px"}} src={state.url} alt="image found"/></>
                    }
                </div>
            </form>
    )

};


export default {
    title: 'Component/SlightCapture',
    component: SlightCaptureVideo,
    tags: ['autodocs'],
    argTypes: {
        
    },
};

