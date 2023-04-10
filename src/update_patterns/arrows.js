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
import { descending } from "d3";

const phi = 1.618; // golden ratio (close enough)

// internal method: return the coordinate of the directed edge (an svg line)
//    given that: - space should be left for the arrow marker
//                - maybe there is not enough space between the pair of node
//                  so the line should be made thiner
const design_line_with_arrow = function(x1,y1,x2,y2,extendedVertexRadius, defaultEdgeWidth){
  const L = Math.sqrt((x1-x2)**2+(y1-y2)**2);
  let  x1f = x1;
  let  x2f = x2;
  let  y1f = y1;
  let  y2f = y2;
  const mW = 3*phi*defaultEdgeWidth;
  let edgeWidth=defaultEdgeWidth;
  // branch cases
  let drawMarker = true;
  // console.log(`L = ${L}; R = ${extendedVertexRadius}`)
  if (L > 2*extendedVertexRadius + 2*mW){ // there is ample room
    // length of the line: L minus the room taken by the arrow + the ext rad in the arrival
    const l = L - mW - extendedVertexRadius;
    const a = Math.atan2(y2-y1, x2-x1);
    x2f = x1f + l*Math.cos(a);
    y2f = y1f + l*Math.sin(a);
    drawMarker = true;
  } else if (L < 2*extendedVertexRadius){ // the 2 nodes overlap
    // dont draw the marker
    drawMarker = false;
    // the line goes from node to node 
    // (the line and the absence of arrows are not noticed because the nodes are 'on top')
  } 
  else{ // there is space between the nodes, but the line/arrow should be smaller
    // compute new edge width
    edgeWidth=(L-2*extendedVertexRadius)/(6*phi)
    // compute given that we impose l:=2R
    const l = (L-2*extendedVertexRadius)/2+extendedVertexRadius;
    const a = Math.atan2(y2-y1, x2-x1);
    x2f = x1f + l*Math.cos(a);
    y2f = y1f + l*Math.sin(a);
    drawMarker = true;
    // console.log("in between")
  }
  return [x1f,y1f,x2f,y2f,drawMarker,edgeWidth]; 
}

const join_enter_factor = function(extended_vertex_radius, edge_default_stroke_width ,elDivTooltip, time_transition_entry){
  return function(enter){
      // Imho best way to avoid to define those transitions everywhere is to
    // transform those functions in classes of which the transitions are members
    const t_factor_entry = d3.transition().duration(time_transition_entry);
    const t_graph_motion = d3.transition().duration(time_transition_entry);

    return enter
      .append("g")
      .attr("class",(d)=> `factor ${d.factor_id}`)
      .each(function (d) {
        d3.select(this)
          .style("opacity", "40%")
          .style("fill","green")
          .style("stroke","green")
          .transition(t_factor_entry) // ugly (im interest in the child opacity not this node) but necessary to run concurrent transitions on the line (which doesnt work if I place it below)
          .style("opacity", null)
          .style("fill",null)
          .style("stroke",null)
          .selection()
          .call(function (g) {
            // design the length of the line
            const x1=d.vars[0].mean.x
            const y1=d.vars[0].mean.y
            const x2=d.vars[1].mean.x
            const y2=d.vars[1].mean.y
            const [x1f,y1f,x2f,y2f,drawMarker,edgeWidth] 
              = design_line_with_arrow(x1,y1,x2,y2,extended_vertex_radius,edge_default_stroke_width);
            // console.log(d)
            g.append("line")
              // .attr("marker-end","url(#vee)")
              .attr("marker-end", drawMarker? "url(#arrowVee)":null)
              .attr("stroke-width",edgeWidth)
              .attr("x1", x1f)
              .attr("y1", y1f)
              .attr("x2", x2f)
              .attr("y2", y2f);
          });
      });
  }
}

const join_update_factor = function(extended_vertex_radius, edge_default_stroke_width, time_transition_update){
  return function(update){
    // TODO:
    // Imho best way to avoid to define those transitions everywhere is to
    // transform those functions in classes of which the transitions are members
    const t_graph_motion = d3.transition().duration(time_transition_update);

    update.each(function (d) {
      d3.select(this)
        .selectAll("line")
        .each(function (_, i, n) {
            // line
            const x1=d.vars[0].mean.x
            const y1=d.vars[0].mean.y
            const x2=d.vars[1].mean.x
            const y2=d.vars[1].mean.y
            const [x1f,y1f,x2f,y2f,drawMarker,edgeWidth] 
              = design_line_with_arrow(x1,y1,x2,y2,extended_vertex_radius,edge_default_stroke_width);
            // line
            d3.select(n[i])
              .transition(t_graph_motion)
              .attr("marker-end", drawMarker? "url(#arrowVee)":null)
              .attr("stroke-width",edgeWidth)
              .attr("x1", x1f)
              .attr("y1", y1f)
              .attr("x2", x2f)
              .attr("y2", y2f);
        });
    });
  }
}
const join_exit_factor = function(exit,time_transition_exit){
  return (
    exit
      .call(function (ex) {
        ex.selectAll("line").style("stroke", "brown");
      })
      .transition("exit_factor") // TODO: Define outside
      .duration(time_transition_exit)
      .style("opacity", 0)
      .remove()
  );
}

export { join_enter_factor, join_update_factor, join_exit_factor }





function factor_hover(elDivTooltip){
  return function(factor_dot){
    factor_dot
      .on("mouseover", (e, d) => {
        //circle first
        factor_dot
          .attr("r", function(d,i,n){
            return d3.select(this).attr("r")*1.4
          })
          .attr(
            "stroke-width",
            function(d,i,n){
              return d3.select(this.parentNode).attr("stroke-width")*1.4
            }
          );
        // highlight this factor group
        d3.select(factor_dot.node().parentNode).classed("link_highlight",true);
        // raise factor group
        d3.select(factor_dot.node().parentNode).raise();
        // raise connected vertices
        d.vars_id.forEach((var_str) =>
          d3.select(`.vertex.${var_str}`).classed("link_highlight", true).raise()
        );
        // the tooltip
        elDivTooltip
          .style("left", `${e.pageX}px`)
          .style("top", `${e.pageY - 6}px`) // TODO: residual
          .style("visibility", "visible").html(`<p class="tooltip-title">
                          <strong><em>${d.factor_id}</em></strong>
                         </p>
                         <br>
                         <span class="tooltip-field"><strong>Type</strong></span>: 
                         <span class="tooltip-value">${d.type}</span>
                         <br>
                         <span class="tooltip-field"><strong>Vars</strong></span>: 
                         <span class="tooltip-value">${d.vars_id}</span>
                         `);
        // cursor pointer
        d3.select(e.currentTarget).style("cursor", "pointer");
      })
      .on("mousemove", (e) =>
        elDivTooltip.style("top", e.pageY + "px").style("left", e.pageX + "px")
      )
      // on hover out, rebase to default
      .on("mouseout", (e, d) => {
        // retract the radius of the factor dot
        factor_dot
          .attr("r", function(d,i,n){
            return d3.select(this).attr("r")/1.4
          })
          .attr(
            "stroke-width",
            function(d,i,n){
              return d3.select(this.parentNode).attr("stroke-width")/1.4
            }
          );
        // remove the highlight the factor & on the connected vertices
        d3.select(factor_dot.node().parentNode).classed("link_highlight",false);
        d.vars_id.forEach((var_str) =>
          d3.select(`.vertex.${var_str}`).classed("link_highlight", false)
        );
        // hide the tooltip
        elDivTooltip.style("visibility", "hidden");
      });
  }
}
