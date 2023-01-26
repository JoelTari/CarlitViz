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
import * as fallback1_MixedFactorGraphData from "./stores/fallback1_MixedFactorGraphData.json"
import * as fallback2_MixedFactorGraphData from "./stores/fallback2_M3500_solved_MixedFactorGraphData.json"


// set store: if no data, use fallback data
setMixedFactorGraphData( window.MixedFactorGraphData == null ?
  fallback_MixedFactorGraphData : window.MixedFactorGraphData
)

// setInterval(
//   ()=>{
//     console.log("[Interval tests] new data t1");
//     setMixedFactorGraphData(fallback1_MixedFactorGraphData)
//     setTimeout(()=>{
//       console.log("[Interval tests] new data t2");
//       setMixedFactorGraphData(fallback_MixedFactorGraphData)
//     },2500)
//   }
//   ,5000
// ) 

render(() => <MixedFactorGraph />, document.getElementById('root'));
