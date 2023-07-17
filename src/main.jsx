import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {TemplateGenerator} from "./TemplateGenerator.jsx";

import '@axa-fr/react-toolkit-all/dist/style/af-components.scss';
import '@axa-fr/react-toolkit-core/dist/assets/fonts/icons/af-icons.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TemplateGenerator />
  </React.StrictMode>,
)
