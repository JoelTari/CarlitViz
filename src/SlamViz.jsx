import { lazy } from "solid-js";
import { Router, Route, Routes } from "@solidjs/router";
import SlamVizSideMenu from "./SlamVizSideMenu";

const MixedFactorGraph = lazy(()=> import("./MixedFactorGraph"));
const CliqueTree = lazy(()=> import("./CliqueTree"));
import { sideMenuDisplayed , setSideMenuDisplayed } from "./stores/SideMenuDisplay";

function SlamViz(){

  const open = ()=>{
    // document.getElementById("sidemenu").style.display = "block";
    setSideMenuDisplayed(true);
    console.log("open")
  };

  return (
    <>
      <Show when={sideMenuDisplayed()}>
        <SlamVizSideMenu/>
      </Show>
      <div class="content" style={{width:"100%",height:"100%", position:"relative"}}>
        <Router>
          <Routes>
            <Route path="/" component={MixedFactorGraph}/>
            <Route path="/factor-graph" component={MixedFactorGraph}/>
            <Route path="/clique-tree" component={CliqueTree}/>
          </Routes>
        </Router>
        <button 
          style="position: absolute; top: 0px; left: 0px;" 
          class="open-menu-button" 
          onClick={open}>
          ☰
        </button>
      </div>
    </>
  )
}

export default SlamViz
