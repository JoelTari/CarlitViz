import MixedFactorGraph from "./MixedFactorGraph";
import SlamVizSideMenu from "./SlamVizSideMenu";

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
        <MixedFactorGraph/> 
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
