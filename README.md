# Slight Capture

[![Continuous Integration](https://github.com/AcaFrance/slight-capture/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/AxaFrance/slight-capture/actions/workflows/npm-publish.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=alert_status)](https://sonarcloud.io/dashboard?id=AxaGuilDEv_slight-capture) [![Reliability](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=reliability_rating)](https://sonarcloud.io/component_measures?id=AxaGuilDEv_slight-capture&metric=reliability_rating) [![Security](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=security_rating)](https://sonarcloud.io/component_measures?id=AxaGuilDEv_slight-capture&metric=security_rating) [![Code Coverage](https://sonarcloud.io/api/project_badges/measure?project=AxaGuilDEv_slight-capture&metric=coverage)](https://sonarcloud.io/component_measures?id=AxaGuilDEv_slight-capture&metric=Coverage) [![Twitter](https://img.shields.io/twitter/follow/GuildDEvOpen?style=social)](https://twitter.com/intent/follow?screen_name=GuildDEvOpen)

- [About](#about)
- [How to consume](#how-to-consume)
- [Contribute](#contribute)

## About 

Simple vanilla JS library to capture a clean image and light from documents from a webcam. 
It use Opencv.js under the hood.
The usage is easy for user. Your data is lighter and cleaner for future OCR in your backend system.

Online Storybook Demo: https://wonderful-forest-0a9f5b103.3.azurestaticapps.net/

## Get Started  [![npm version](https://badge.fury.io/js/%40axa-fr%2Fslight-capture.svg)](https://badge.fury.io/js/%40axa-fr%2Fslight-capture)

```bash
npm install @axa-fr/slight-capture --save

# To install in your public folder a light version of opencv.js
node ./node_modules/@axa-fr/slight-capture/bin/copy-opencv.mjs public
```


WARNING : To keep opencv.js up to date. You may setup a postinstall script in your package.json file to update it at each npm install. For example :
```sh
  "scripts": {
    ...
    "postinstall": "node ./node_modules/@axa-fr/slight-capture/bin/copy-opencv.mjs public"
  },
```


The sample bellow use react, but the library work with vanilla JS with any framework of your choice.

```javascript
import React, {useEffect, useState} from "react";
import sligthCaptureFactory, {toBase64Async} from "@axa-fr/slight-capture";

const sligthCapture = sligthCaptureFactory();

export const SlightCaptureVideo = () => {
    
    const [state, setState] = useState({
        isLoading: false,
        url: null,
    });

    useEffect(() => {
        sligthCapture.initAsync('opencv.js');
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
        <form>
            <h1>Slight Capture</h1>
            <input type="file" onChange={onChange} multiple={true}/>
            <div>
                {state.url &&
                    <img style={{"maxWidth": "800px"}} src={state.url} alt="image found"/>
                }
            </div>
        </form>
    )

};
```

Texts can be override by passing a translation object to the initAsync method.

```javascript
const translations = {
    'sc-modal__video-title' : 'Positionner 5 secondes votre document dans le cadre',
    'sc-modal__video-invert-camera' : "Inverser caméra",
    'sc-modal__video-message-too-dark' : "Image trop sombre",
    'sc-modal__video-quit' : "X",
    'sc-modal__confirm-loading' : "Traitement en cours...",
    'sc-modal__confirm-title':"Est-ce que tous les champs sont parfaitement lisibles ?",
    'sc-modal__confirm-button--ko':"Non",
    'sc-modal__confirm-button--ok':"Oui",
    'sc-modal__error-title': "Une erreur est survenue",
    'sc-modal__error-button--restart': "Recommencer",
    'sc-modal__error-button--quit': "Quitter",
    'sc-modal__video-message-too-white': "Image trop claire",
};


const onChange = async event => {
    // ...
    const properties = {
        translations,
        enableDefaultCss: false,
    };
    const video = await sligthCapture.loadVideoAsync()(file, onCapture, properties);
    // ...
}

```

All properties with default values :
``` javascript
const properties = {
    translations: texts,
    enableDefaultCss: true,
    outputImageQuality: 0.6,
    outputImageMimeType: 'image/jpeg',
    waitNumberOfSecond: 3,
    thresholdTooWhite: 1.15,
    thresholdTooDark: 2.5,
    video: {
        // lower resolution are speeder
        width: {ideal: 1600},
        height: {ideal: 1600},
        facingMode: {
            // "environment" for back webcam in priority else "face" for front webcam 
            ideal: 'environment' // 'face'
        },
    }
}
``` 


You can customize the css by passing properties.enableDefaultCss: false to take the control of the css.
css use BEM (Block Element Modifier) convention. 

```css

/* CSS to customize SlightCapture 
   const video = await sligthCapture.loadVideoAsync()(file: file, onCaptureCallback: onCapture, enableDefaultCss: false);
   disable default inline css by passing enableDefaultCss: false to take the control of the css 
*/
.sc-modal {
  position: fixed;
  z-index: 10000000;
  padding-top: 0;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: auto;
  background-color: white;
  text-align:center;
}

.sc-modal__video-title {
  padding-left: 0.5em;
  padding-right: 0.5em;
}

.sc-modal__video-invert-camera {
  padding: 0.5em;
  font-size: 1em;
  margin: 1em;
  position:absolute;
  background-color:#a8a8a88f;
}

.sc-modal__video-quit {
  padding: 0.3em;
  font-size: 1em;
  margin: 1em;
  position:absolute; 
  top: 0; 
  right: 0;
}

.sc-modal__video-video {
  display: inline;
  height: 80vh;
}

.sc-modal__video-container{
    position: absolute;
    z-index: 10000000;
    padding-top: 0;
    left: 0;
    top: 0;
    width: 100%;
    max-height: 90vh;
    overflow: auto;
    background-color: white;
    text-align:center;
}

.sc-modal__confirm-container {
  position: absolute;
  z-index: 100000000;
  padding-top: 0;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: auto;
  background-color: white;
  text-align:center;
}

.sc-modal__confirm-loading {
  
}

.sc-modal__confirm-title {
  
}

.sc-modal__confirm-image {
  max-width: 800px;
  width: 100%;
}

.sc-modal__confirm-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.sc-modal__confirm-button {
  padding: 0.5em;
  font-size: 2em;
  margin: 1em;
}



.sc-modal__error-container {
    position: absolute;
    z-index: 100000000;
    padding-top: 0;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;
    overflow: auto;
    background-color: white;
    text-align:center;
}

.sc-modal__error-title {

}

.sc-modal__error-button-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.sc-modal__error-button {
    padding: 0.5em;
    font-size: 2em;
    margin: 1em;
}



```

## Contribute

- [How to run the solution and to contribute](./CONTRIBUTING.md)
- [Please respect our code of conduct](./CODE_OF_CONDUCT.md)
