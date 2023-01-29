/*
 * Copyright 2023 AKKA Technologies (joel.tari@akkodis.eu)
 *
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the "Licence");
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 *
 * https://joinup.ec.europa.eu/software/page/eupl
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 */

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
import * as fallback0_unsolved_MixedFactorGraphData from "./stores/factor-graph_cutx27M3500_initial_guess.json"
import * as fallback0_MixedFactorGraphData from "./stores/fallback0_MixedFactorGraphData.json"
import * as fallback1_MixedFactorGraphData from "./stores/fallback1_MixedFactorGraphData.json"
import * as fallback2_MixedFactorGraphData from "./stores/fallback2_M3500_solved_MixedFactorGraphData.json"


// set store: if no data, use fallback data
setMixedFactorGraphData( window.MixedFactorGraphData == null ?
  fallback0_unsolved_MixedFactorGraphData : window.MixedFactorGraphData
)

setTimeout(()=>setMixedFactorGraphData(fallback0_MixedFactorGraphData),3000);

// setInterval(
//   ()=>{
//     console.log("[Interval tests] new data t1");
//     setMixedFactorGraphData(fallback1_MixedFactorGraphData)
//     setTimeout(()=>{
//       console.log("[Interval tests] new data t2");
//       setMixedFactorGraphData(fallback0_MixedFactorGraphData)
//     },5000)
//   }
//   ,10000
// ) 

render(() => <SlamViz />, document.getElementById('root'));
