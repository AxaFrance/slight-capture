# Slight Capture

[![Continuous Integration](https://github.com/AxaGuilDEv/slight-capture/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/AxaGuilDEv/slight-capture/actions/workflows/npm-publish.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=alert_status)](https://sonarcloud.io/dashboard?id=AxaGuilDEv_slight-capture) [![Reliability](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=reliability_rating)](https://sonarcloud.io/component_measures?id=AxaGuilDEv_slight-capture&metric=reliability_rating) [![Security](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=security_rating)](https://sonarcloud.io/component_measures?id=AxaGuilDEv_slight-capture&metric=security_rating) [![Code Coverage](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=coverage)](https://sonarcloud.io/component_measures?id=AxaGuilDEv_slight-capture&metric=Coverage) [![Twitter](https://img.shields.io/twitter/follow/GuildDEvOpen?style=social)](https://twitter.com/intent/follow?screen_name=GuildDEvOpen)

- [About](#about)
- [How to consume](#how-to-consume)
- [Contribute](#contribute)

## About

Simple vanilla JS app to capture clean image from documents from a webcam and. It use Opencv.js under the hood.

Online Storybook Demo: https://wonderful-forest-0a9f5b103.3.azurestaticapps.net/

## How to consume

```javascript
import React, {useEffect, useState} from "react";
import sligthCaptureFactory, {toBase64Async} from "@axa-fr/slight-capture";

const sligthCapture = sligthCaptureFactory("default");

export const SlightCaptureVideo = () => {
    
    const [state, setState] = useState({
        isLoading: false,
        url: null,
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
        setState({...state, isLoading: true});
        const video = await sligthCapture.loadVideoAsync()(file, onCapture);
        setState({...state, isLoading: false});
        video.start();
    }

    if (state.isLoading) {
        return (<p>Loading</p>);
    }

    return (
        <form className="af-form ri__form-container" name="myform">
            <h1>Slight Capture</h1>
            <input type="file" id="newFile" onChange={onChange} multiple={true}/>
            <div>
                {state.url &&
                    <><img style={{"maxWidth": "800px"}} src={state.url} alt="image found"/></>
                }
            </div>
        </form>
    )

};
```

## Contribute

- [How to run the solution and to contribute](./CONTRIBUTING.md)
- [Please respect our code of conduct](./CODE_OF_CONDUCT.md)