/* @refresh reload */
import { render } from 'solid-js/web';

// import './index.css';
// import App from './App';
// render(() => <App />, document.getElementById('root'));

import './style.css'

// import the store
import { setMixedFactorGraphData } from './stores/MixedFactorGraphData'
// import the component
import SlamViz from './SlamViz';
// import fallback data
import * as fallback0_MixedFactorGraphData from "./stores/fallback0_MixedFactorGraphData.json"
import * as fallback1_MixedFactorGraphData from "./stores/fallback1_MixedFactorGraphData.json"
import * as fallback2_MixedFactorGraphData from "./stores/fallback2_M3500_solved_MixedFactorGraphData.json"


// set store: if no data, use fallback data
setMixedFactorGraphData( window.MixedFactorGraphData == null ?
  fallback0_MixedFactorGraphData : window.MixedFactorGraphData
)

// setTimeout(()=>setMixedFactorGraphData(fallback1_MixedFactorGraphData),2000);

setInterval(
  ()=>{
    console.log("[Interval tests] new data t1");
    setMixedFactorGraphData(fallback1_MixedFactorGraphData)
    setTimeout(()=>{
      console.log("[Interval tests] new data t2");
      setMixedFactorGraphData(fallback0_MixedFactorGraphData)
    },2500)
  }
  ,5000
) 

render(() => <SlamViz />, document.getElementById('root'));
