/* @refresh reload */
import { render } from 'solid-js/web';

// import './index.css';
// import App from './App';
// render(() => <App />, document.getElementById('root'));

import './style.css'

// import the store
import { setMixedFactorGraphData } from './stores/MixedFactorGraphData'
// import the component
import MixedFactorGraph from './MixedFactorGraph'
// import fallback data
import * as fallback_MixedFactorGraphData from "./stores/fallback_MixedFactorGraphData.json"


// set store: if no data, use fallback data
setMixedFactorGraphData( window.MixedFactorGraphData == null ?
  fallback_MixedFactorGraphData : window.MixedFactorGraphData
)

render(() => <MixedFactorGraph />, document.getElementById('root'));
