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

import * as d3 from "d3"
import { createEffect, onMount } from "solid-js"

// dep: scales x&y and svg size w&h
//      also UI (show or not show etc..)
function AxesWithScales(props){


  onMount(()=>{
    // d3 selections
    const elTop = d3.select(`svg.${props.svgClass}#${props.svgId} .Xaxis-top`);
    const elBottom = d3.select(`svg.${props.svgClass}#${props.svgId} .Xaxis-bottom`);
    const elLeft = d3.select(`svg.${props.svgClass}#${props.svgId} .Yaxis-left`);
    const elRight = d3.select(`svg.${props.svgClass}#${props.svgId} .Yaxis-right`);

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
      elBottom.call(xaxis_bot).attr("transform",`translate(0,${h})`);
      elTop.call(xaxis_top);
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
