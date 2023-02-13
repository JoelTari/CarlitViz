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

import * as d3 from "d3"
import { createEffect, onMount } from "solid-js"

// dep: scales x&y and svg size w&h
//      also UI (show or not show etc..)
function TicksGrid(props){

  onMount(()=>{
    const elGrid = d3.select(`svg.mixed-factor-graph#${props.svgId} g.TicksGrid`);

    createEffect(()=>{
      const sc_x = props.adjustedScales.x;
      const sc_y = props.adjustedScales.y;
      const h=props.svgSize.h;
      const w=props.svgSize.w;

      elGrid
        .call((g)=>
          g.selectAll(".x")
          .data(sc_x.ticks())
          .join(
            (enter) =>
              enter
                .append("line")
                .attr("class", "x")
                .attr("y1",0)
                .attr("y2", h)
            ,
            (update) =>
              update
                .attr("y2", h)
            ,
            (exit) => exit.remove()
          )
          .attr("x1", (d) => sc_x(d))
          .attr("x2", (d) => sc_x(d))
        )
        .call((g)=>
          g.selectAll(".y")
          .data(sc_y.ticks())
          .join(
            (enter) =>
              enter
                .append("line")
                .attr("class", "y")
                .attr("x1",0)
                .attr("x2", w)
            ,
            (update) =>
              update
                .attr("x2", w)
            ,
            (exit) => exit.remove()
          )
          .attr("y1", (d) => sc_y(d))
          .attr("y2", (d) => sc_y(d))
        )
    })

  })

  // trick: define some attribute at the group level, the lines inside the group
  // will inherit
  return (
    <>
      <g class="TicksGrid"
        stroke="#bbb"
        stroke-width="1px"
        stroke-opacity={props.gridOpacity}>
      </g>
    </>
  )
}

export default TicksGrid;
