/*
 * Copyright 2023 AKKA Technologies (joel.tari@akka.eu)
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
import { setCausalGraphData } from './stores/CausalGraphData'
// import the component
import CarlitViz from './CarlitViz';
// import fallback data: M27 is the dataset of the first 27 steps of M3500
import * as fallbackData_M27_unsolved from "./stores/fallbackData_M27_unsolved.json"
import * as fallbackData_M27_solved from "./stores/fallbackData_M27_solved.json"
import * as fallbackData_M27_madeup from "./stores/fallbackData_M27_madeup.json"
import * as fallbackData_M3500_odom_only_unsolved from "./stores/fallbackData_M3500_odom_only_unsolved.json"
import * as fallbackData_M3500_unsolved from "./stores/fallbackData_M3500_unsolved.json"
import * as fallbackData_M3500_solved from "./stores/fallbackData_M3500_solved.json"
import * as fallbackData_M3500_solved_left from "./stores/fallbackData_M3500_solved_left.json"
import * as fallbackData_M3500_solved_right from "./stores/fallbackData_M3500_solved_right.json"
import * as fallbackData_M3500_unsolved_left from "./stores/fallbackData_M3500_unsolved_left.json"
import * as fallbackData_M3500_unsolved_right from "./stores/fallbackData_M3500_unsolved_right.json"
import * as fallbackData_M3500_odom_only_unsolved_left from "./stores/fallbackData_M3500_odom_only_unsolved_left.json"
import * as fallbackData_M3500_odom_only_unsolved_right from "./stores/fallbackData_M3500_odom_only_unsolved_right.json"
import * as fallbackData_M30_solved from "./stores/fallbackData_M30_solved.json"


// update time (temporary, will be deprecated)
const dt = 4000;

const fallback_dataset = "M27";

if (!window.CausalGraphData == null){  // given dataset
  setCausalGraphData( window.CausalGraphData )
}
else{
  if (fallback_dataset == "M27"){ // M27
    setCausalGraphData(fallbackData_M27_unsolved);
    setTimeout(()=>setCausalGraphData(fallbackData_M27_solved),dt);
    // setTimeout(()=>setCausalGraphData(fallbackData_M27_unsolved),2*dt);
    // setTimeout(()=>setCausalGraphData(fallbackData_M27_solved),3*dt);
    // setTimeout(()=>setCausalGraphData(fallbackData_M27_madeup),4*dt);
  }
  else if (fallback_dataset == "M30") {
    setCausalGraphData(fallbackData_M30_solved);
  }
  else if (fallback_dataset == "M3500_left"){
    setCausalGraphData(fallbackData_M3500_odom_only_unsolved_left);
    setTimeout(()=>setCausalGraphData(fallbackData_M3500_unsolved_left), dt/2);
    setTimeout(()=>setCausalGraphData(fallbackData_M3500_solved_left), 3/2*dt);
  } 
  else if (fallback_dataset == "M3500_right"){
    setCausalGraphData(fallbackData_M3500_odom_only_unsolved_right);
    setTimeout(()=>setCausalGraphData(fallbackData_M3500_unsolved_right), dt/2);
    setTimeout(()=>setCausalGraphData(fallbackData_M3500_solved_right), 3/2*dt);
  } 
  else{ // M3500
    setCausalGraphData(fallbackData_M3500_odom_only_unsolved);
    setTimeout(()=>setCausalGraphData(fallbackData_M3500_unsolved),2*dt);
    setTimeout(()=>setCausalGraphData(fallbackData_M3500_solved),4*dt);
  }
}


// setInterval(
//   ()=>{
//     console.log("[Interval tests] new data : M27 unsolved");
//     setCausalGraphData(fallbackData_M27_unsolved)
//     setTimeout(()=>{
//       console.log("[Interval tests] new data : M27 solved");
//       setCausalGraphData(fallbackData_M27_solved)
//     },3500)
//     // setTimeout(()=>{
//     //   console.log("[Interval tests] new data t3");
//     //   setCausalGraphData(fallback1_CausalGraphData)
//     // },5000)
//   }
//   ,7000
// ) 

render(() => <CarlitViz dt={dt}/>, document.getElementById('root'));
