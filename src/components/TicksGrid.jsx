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
                .style("stroke","grey")
                .style("stroke-width","1px")
                .style("opacity","30%")
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
                .style("stroke","grey")
                .style("stroke-width","1px")
                .style("opacity","30%")
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
  
  return (
    <g class="TicksGrid"></g>
  )
}

export default TicksGrid;
