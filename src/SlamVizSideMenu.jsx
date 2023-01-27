import { setSideMenuDisplayed } from "./stores/SideMenuDisplay";

function SlamVizSideMenu(){

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
          <a href="#" class="factor-graph-button">Factor Graph</a>
          <a href="#" class="cluster-graph-button">Cluster Graph</a>
          <a href="#" class="matrices-button">Matrices</a>
        </div>
      </div>
    </>
  )
}

export default SlamVizSideMenu
