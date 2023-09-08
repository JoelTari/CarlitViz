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

import { setSideMenuDisplayed } from "./stores/SideMenuDisplay";

function CarlitVizSideMenu(){

  const close = ()=>{
    // document.getElementById("sidemenu").style.display = "none";
    setSideMenuDisplayed(false);
    console.log("close")
  };

  return(
    <>
    <style>
    {`
      #sidemenu{
        height: 100%;
        width: 200px;
        position: fixed!important;
        background: #fff;
        border-right: 2px solid black;
        z-index: 1;
      }
      .sidemenu-content{
        display: flex;
        flex-direction: column;
      }
      `}
    </style>
      <div class="menu" id="sidemenu">
        <div class="sidemenu-content">
          <button onClick={close} class="close-menu-button">Close &times;</button>
          <a href="#trajectory-graph" class="trajectory-graph-button">Trajectory Graph</a>
          <a href="#clique-tree" class="clique-tree-button">Clique Tree</a>
          <a href="#trajectory-graph-and-clique" class="matrices-button">Both</a>
        </div>
      </div>
    </>
  )
}

export default CarlitVizSideMenu
