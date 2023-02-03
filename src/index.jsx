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
// import fallback data: M27 is the dataset of the first 27 steps of M3500
import * as fallbackData_M27_unsolved from "./stores/fallbackData_M27_unsolved.json"
import * as fallbackData_M27_solved from "./stores/fallbackData_M27_solved.json"
import * as fallbackData_M27_madeup from "./stores/fallbackData_M27_madeup.json"
import * as fallbackData_M3500_unsolved from "./stores/fallbackData_M3500_unsolved.json"
import * as fallbackData_M3500_solved from "./stores/fallbackData_M3500_solved.json"


// set store: if no data, use fallback data
setMixedFactorGraphData( window.MixedFactorGraphData == null ?
  // fallbackData_M27_unsolved : window.MixedFactorGraphData
  fallbackData_M3500_unsolved : window.MixedFactorGraphData
)

setTimeout(()=>setMixedFactorGraphData(fallbackData_M3500_solved),5000);

// setTimeout(()=>setMixedFactorGraphData(fallbackData_M27_unsolved),3000);
// setTimeout(()=>setMixedFactorGraphData(fallbackData_M27_solved),8000);
// setTimeout(()=>setMixedFactorGraphData(fallbackData_M27_unsolved),13000);
// setTimeout(()=>setMixedFactorGraphData(fallbackData_M27_solved),18000);
// setTimeout(()=>setMixedFactorGraphData(fallbackData_M27_madeup),23000);

// setInterval(
//   ()=>{
//     console.log("[Interval tests] new data : M27 unsolved");
//     setMixedFactorGraphData(fallbackData_M27_unsolved)
//     setTimeout(()=>{
//       console.log("[Interval tests] new data : M27 solved");
//       setMixedFactorGraphData(fallbackData_M27_solved)
//     },3500)
//     // setTimeout(()=>{
//     //   console.log("[Interval tests] new data t3");
//     //   setMixedFactorGraphData(fallback1_MixedFactorGraphData)
//     // },5000)
//   }
//   ,7000
// ) 

render(() => <SlamViz />, document.getElementById('root'));
