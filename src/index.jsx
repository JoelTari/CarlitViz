/*
 * Copyright 2023 AKKA Technologies and LAAS-CNRS (joel.tari@akka.eu)
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
import { setGraphData } from './stores/GraphData'
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
import * as ut3_path1_round1_batch_matrix_odom from "./stores/ut3_path1_round1_batch_matrix_odom.json"
import * as ut3_path1_round1_batch_matrix_full from "./stores/ut3_path1_round1_batch_matrix_full.json"
import * as fallbackData_M30_solved from "./stores/fallbackData_M30_solved.json"

import * as ut3_pAr1      from "./stores/fallbackMixedFG/ut3pres/ut3_CBN_pathA_round1.json"
import * as ut3_pAr1_odom from "./stores/fallbackMixedFG/ut3pres/ut3_Odometry_pathA_round1.json"
import * as ut3_pAr2      from "./stores/fallbackMixedFG/ut3pres/ut3_CBN_pathA_round2.json"
import * as ut3_pAr2_odom from "./stores/fallbackMixedFG/ut3pres/ut3_Odometry_pathA_round2.json"
import * as ut3_pBr1      from "./stores/fallbackMixedFG/ut3pres/ut3_CBN_pathB_round1.json"
import * as ut3_pBr1_odom from "./stores/fallbackMixedFG/ut3pres/ut3_Odometry_pathB_round1.json"
import * as ut3_pBr2      from "./stores/fallbackMixedFG/ut3pres/ut3_CBN_pathB_round2.json"
import * as ut3_pBr2_odom from "./stores/fallbackMixedFG/ut3pres/ut3_Odometry_pathB_round2.json"

// TODO: pass here a profil of colors/thickness in corresponding stores
//       target: TrajectoryUI_opts


// update time in ms (used to transition, time between change of graph)
const dt = 5000;
// const dt = 14667;

let declCoefTraj=1; // declutter Coefficient for the trajectory, i.e. how much 'thickness' the elements displayed have
const autoMoveCameraTraj=true;

const fallback_dataset = "ut3_pAr1";
// const fallback_dataset = "M3500_left";

if (!window.GraphData == null){  // given dataset
  setGraphData( window.GraphData )
}
else{
  if (fallback_dataset == "M27"){ // M27
    setGraphData(fallbackData_M27_unsolved);
    setTimeout(()=>setGraphData(fallbackData_M27_solved),dt);
    // setTimeout(()=>setGraphData(fallbackData_M27_unsolved),2*dt);
    // setTimeout(()=>setGraphData(fallbackData_M27_solved),3*dt);
    // setTimeout(()=>setGraphData(fallbackData_M27_madeup),4*dt);
  }
  else if (fallback_dataset == "M30") {
    setGraphData(fallbackData_M30_solved);
  }
  else if (fallback_dataset == "M3500_left"){
    setGraphData(fallbackData_M3500_odom_only_unsolved_left);
    setTimeout(()=>setGraphData(fallbackData_M3500_unsolved_left), dt/2);
    setTimeout(()=>setGraphData(fallbackData_M3500_solved_left), 3/2*dt);
  } 
  else if (fallback_dataset == "M3500_right"){
    setGraphData(fallbackData_M3500_odom_only_unsolved_right);
    setTimeout(()=>setGraphData(fallbackData_M3500_unsolved_right), dt/2);
    setTimeout(()=>setGraphData(fallbackData_M3500_solved_right), 3/2*dt);
  } 
  else if (fallback_dataset == "ut3_path1_round1_batch_matrix_odom"){
    setGraphData(ut3_path1_round1_batch_matrix_odom);
    setTimeout(()=>setGraphData(ut3_path1_round1_batch_matrix_full), dt);
  }
  else if (fallback_dataset == "ut3_pAr1"){
    setGraphData(ut3_pAr1_odom);
    setTimeout(()=>setGraphData(ut3_pAr1), dt);
    declCoefTraj=150;
  }
  else if (fallback_dataset == "ut3_pAr2"){
    setGraphData(ut3_pAr2_odom);
    setTimeout(()=>setGraphData(ut3_pAr2), dt);
    declCoefTraj=150;
  }
  else if (fallback_dataset == "ut3_pBr1"){
    setGraphData(ut3_pBr1_odom);
    setTimeout(()=>setGraphData(ut3_pBr1), dt);
    declCoefTraj=150;
  }
  else if (fallback_dataset == "ut3_pBr2"){
    setGraphData(ut3_pBr2_odom);
    setTimeout(()=>setGraphData(ut3_pBr2), dt);
    declCoefTraj=150;
  }
  else{ // M3500
    setGraphData(fallbackData_M3500_odom_only_unsolved);
    setTimeout(()=>setGraphData(fallbackData_M3500_unsolved),dt/2);
    setTimeout(()=>setGraphData(fallbackData_M3500_solved),3/2*dt);
  }
}

// TODO: setDeclutter coefficient here
render(() => <CarlitViz dt={dt} declutterCoefficientTraj={declCoefTraj} autoMoveCameraTraj={autoMoveCameraTraj}/>, document.getElementById('root'));
