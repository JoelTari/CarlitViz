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

import { lazy } from "solid-js";
import { Router, Route, Routes, hashIntegration } from "@solidjs/router";
import CarlitVizSideMenu from "./CarlitVizSideMenu";

const CausalGraph = lazy(()=> import("./CausalGraph"));
const CliqueTree = lazy(()=> import("./CliqueTree"));
import { sideMenuDisplayed , setSideMenuDisplayed } from "./stores/SideMenuDisplay";
import { Toaster } from "solid-toast";

function CausalGraphAndClique(props){
  return (
      <div style="display: grid; grid-template-columns: 1fr 1fr;
                    grid-template-rows: 100vh;
                    grid-template-areas: 'fg ct';">
        <div style="grid-area: fg; border-right: 3px solid black;">
          <CausalGraph dt={props.dt} id="trajectory-graph-right-panel"/>
        </div>
        <div style="grid-area: ct;border-left: 3px solid black;">
          <CliqueTree/>
        </div>
      </div>
  )
}

function CarlitViz(props){

  const open = ()=>{
    // document.getElementById("sidemenu").style.display = "block";
    setSideMenuDisplayed(true);
    console.log("open")
  };

  return (
    <>
      <Show when={sideMenuDisplayed()}>
        <CarlitVizSideMenu/>
      </Show>
      <div class="content" style={{width:"100%",height:"100%", position:"relative"}}>
        <Router source={hashIntegration()}>
          <Routes>
            <Route path="/" element={<CausalGraph dt={props.dt} id="fg-0"/>}/>
            <Route path="trajectory-graph" element={<CausalGraph dt={props.dt} id="fg-0"/>}/>
            <Route path="clique-tree" component={CliqueTree}/>
            <Route path="trajectory-graph-and-clique" element={<CausalGraphAndClique dt={props.dt}/>}/>
          </Routes>
        </Router>
        <button 
          style="position: absolute; top: 0px; left: 0px;" 
          class="open-menu-button" 
          onClick={open}>
          ☰
        </button>
      </div>
      <Toaster/>
    </>
  )
}

export default CarlitViz
