import * as d3 from "d3"
import { createEffect, onMount } from "solid-js"

// dep: scales x&y and svg size w&h
//      also UI (show or not show etc..)
function TicksGrid(props){

  onMount(()=>{
    const elGrid = d3.select("svg#MixedFactorGraph g.TicksGrid");

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
    <g class="TicksGrid"
      stroke="grey"
      stroke-width="1px"
      stroke-opacity="10%">
    </g>
  )
}

export default TicksGrid;
