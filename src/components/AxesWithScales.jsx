import * as d3 from "d3"
import { createEffect, onMount } from "solid-js"

// dep: scales x&y and svg size w&h
//      also UI (show or not show etc..)
function AxesWithScales(props){

  onMount(()=>{
    const elTop = d3.select(".Xaxis-top");
    const elBottom = d3.select(".Xaxis-bottom");
    const elLeft = d3.select(".Yaxis-left");
    const elRight = d3.select(".Yaxis-right");

    createEffect(()=>{
      const sc_x = props.adjustedScales.x;
      const sc_y = props.adjustedScales.y;
      const h=props.svgSize.h;
      const w=props.svgSize.w;
      // define, using the scales, the d3 objects that have the tooling to generate the axes 
      const xaxis_bot = d3.axisBottom(sc_x); // .tickSizeInner(h); cheap grid lol
      const yaxis_right = d3.axisRight(sc_y);
      const yaxis_left = d3.axisLeft(sc_y);
      const xaxis_top = d3.axisTop(sc_x);
      // call those d3 objects to populate existing axes group elements (note that top <-> bot)
      elTop.call(xaxis_bot);
      elBottom.call(xaxis_top).attr("transform",`translate(0,${h})`);
      elRight.call(yaxis_right);
      elLeft.call(yaxis_left).attr("transform",`translate(${w},0)`);
    })
  })

  return (
    <g class="axes-scales">
      <g class="Xaxis-top"></g>
      <g class="Xaxis-bottom"></g>
      <g class="Yaxis-left"></g>
      <g class="Yaxis-right"></g>
    </g>
  )
}

export default AxesWithScales;
