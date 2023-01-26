import { createSignal } from "solid-js";
import MixedFactorGraph from "./MixedFactorGraph";

function SlamViz(){

  const [sideMenuDisplayed, setSideMenuDisplayed] = createSignal("none");

  const open = ()=>{
    // document.getElementById("sidemenu").style.display = "block";
    setSideMenuDisplayed("block");
    console.log("open")
  };
  const close = ()=>{
    // document.getElementById("sidemenu").style.display = "none";
    setSideMenuDisplayed("none");
    console.log("close")
  };

  return ( 
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
      <div class="menu" style={{display: sideMenuDisplayed() }} id="sidemenu">
        <div class="sidemenu-content">
          <button onClick={close} class="close-menu-button">Close &times;</button>
          <a href="#" class="w3-bar-item w3-button">Link 1</a>
          <a href="#" class="w3-bar-item w3-button">Link 2</a>
          <a href="#" class="w3-bar-item w3-button">Link 3</a>
        </div>
      </div>
      
    <div class="content" style={{width:"100%",height:"100%", position:"relative"}}>
      <MixedFactorGraph/> 
      <button style="position: absolute; top: 0px; left: 0px;" class="open-menu-button" onClick={open}>☰</button>
    </div>
    </>
  )
}

export default SlamViz


// <!-- Page Content -->
// <div class="w3-teal">
//   <button class="w3-button w3-teal w3-xlarge" onclick="w3_open()">☰</button>
//   <div class="w3-container">
//     <h1>My Page</h1>
//   </div>
// </div>
//
// <img src="img_car.jpg" alt="Car" style="width:100%">
//
// <div class="w3-container">
// <p>This sidebar is hidden by default, (style="display:none")</p>
// <p>You must click on the "hamburger" icon (top left) to open it.</p>
// <p>The sidebar will hide a part of the page content.</p>
// </div>
//
// <script>
// function w3_open() {
//   document.getElementById("mySidebar").style.display = "block";
// }
//
// function w3_close() {
//   document.getElementById("mySidebar").style.display = "none";
// }
// </script>
