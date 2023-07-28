import React from 'react'
import ReactDOM from 'react-dom/client'

import {SlightCaptureVideo} from "./SlightCapture.jsx";

import '@axa-fr/react-toolkit-all/dist/style/af-components.scss';
import '@axa-fr/react-toolkit-core/dist/assets/fonts/icons/af-icons.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SlightCaptureVideo />
  </React.StrictMode>,
)
