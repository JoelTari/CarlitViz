/*
 * Copyright 2023 AKKA Technologies (joel.tari@akkodis.eu)
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

const path_pose = function(radius){
  const basis=1.1; //.96
  const triangleLen = 1.9;
  // Viz X=horizontal and Y=vertical
  // triangle is dominant in x-axis
  // Path goes from top to point to bot
  return `M ${-radius},${basis*radius} L ${triangleLen*radius} 0 L ${-radius},${-basis*radius} Z`;
}

const join_enter_vertex = function(radius,elDivTooltip,time_transition_entry){
  return function(enter){
    // TODO:
    // Imho best way to avoid to define those transitions everywhere is to
    // transform those functions in classes of which the transitions are members
    const t_vertex_entry = d3.transition().duration(time_transition_entry);

    return enter
      .append("g")
      .attr("class", (d) => `vertex ${d.var_id}`)
      .attr("transform", "rotate(0)")
      .each(function (d) {
        d3.select(this).attr(
          "transform",
          "translate(" + d.mean.x + "," + d.mean.y + ")")
          .call(vertex_hover(elDivTooltip));
        // circle or pose ? if it has an orientation -> pose
        if (d.mean.th!=null){
          d3.select(this)
            .append("path")
            .classed("vertex-shape",true)
            .attr("transform",`rotate(${d.mean.th*180/Math.PI})`)
            .style("opacity", "40%")
            .style("stroke-width", 0.12*radius*2)
            .style("fill","green")
            .attr("r",10*radius)
            .attr("d",path_pose(6*radius))
            .transition(t_vertex_entry)
            .attr("d",path_pose(radius))
            .attr("r",radius)
            .style("stroke-width", null)
            .style("fill",null)
            .style("opacity", null);
        }else
        {
          d3.select(this)
            .append("circle")
            .classed("vertex-shape",true)
            .attr("r",6 * radius) 
            .style("opacity", 0)
            .style("fill","green")
            .transition(t_vertex_entry)
            .attr( "r", radius)
            .style("fill",null)
            .style("opacity", null);
        }

        // text: variable name inside the circle
        d3.select(this)
          .append("text")
          .attr("stroke","none")
          .attr("fill","black")
          .text((d) => d.var_id)
          .style("opacity", "40%")
          // .style("font-size",radius*0.75*6)
          .transition(t_vertex_entry)
          // .style("font-size",null)
          .style("opacity", null);
        // d3.select(this)
        //   .append("circle")
        //   .classed("hover_transparent_circle", true)
        //   .style("opacity", 0)
        //   .attr( "r", radius)
          // hover methods (defined remotely for clarity)
      });
  }
}

const join_update_vertex = function(radius){
  return function(update){
    const t_graph_motion = d3.transition().duration(600).ease(d3.easeCubicInOut);
    update
      .each(function(dd,i,n){
        // get current transform, 
        // if it translate OR rotate significantly, applies transition
        const this_vertex = d3.select(this);
        const prev_xy = {x: n[i].transform.baseVal.getItem(0).matrix.e,
                          y: n[i].transform.baseVal.getItem(0).matrix.f};
        const euclidian_move = ((prev_xy.x-dd.mean.x)**2+(prev_xy.y-dd.mean.y)**2);
        const prev_angle = d3.select(n[i])
                              .select("path.vertex-shape")
                              .node()
                              .transform.baseVal
                              .getItem(0)
                              .angle;
        // console.log(prev_angle);
        if (
          // euclidian distance move condition
          //    TODO: threshold should depend on base_unit
          euclidian_move > 0.1 
          ||
          // OR rotation move condition (1deg)
          Math.abs(prev_angle-dd.mean.th*180/Math.PI) > 1.
        ){
          this_vertex
            .style("fill","steelblue")
            .transition(t_graph_motion)
            .attr("transform", (d) => `translate(${d.mean.x}, ${d.mean.y})`)
            .style("fill",null);
          this_vertex.select("path.vertex-shape")
                     .transition(t_graph_motion)
                     .attr("transform", (d)=> `rotate(${d.mean.th*180/Math.PI})`);
        }
        // else, (move not significant, dont bother with transition) 
        else{
          this_vertex
            .attr("transform", (d) => `translate(${d.mean.x}, ${d.mean.y})`)
            .select("path.vertex-shape")
            .attr("transform", (d)=> `rotate(${d.mean.th*180/Math.PI})`);
        }

        // now update the shape's radius (might have changed)
        if (dd.mean.th!=null ){ // triangle shape (pose)
          this_vertex.select("path.vertex-shape")
            .attr("d",path_pose(radius))
            .attr("r",radius);
        }
        else{ // circle shape (2d position)
          this_vertex.select("path.vertex-shape")
            .attr("r",radius);
        }
      });
  }
}

const join_exit_vertex = function(exit){
  // TODO:
  return exit;
}

export { join_enter_vertex, join_update_vertex, path_pose }

function vertex_hover(elDivTooltip){
  const spatial_growth_value=1.7;
  return function(vertex){
    vertex
    // on hover, the texts and circles of .vertex will grow in size by spatial_growth_value
    .on("mouseover", (e, d) => {
      // grow the vertex shape, raise the element
      vertex
        .select(".vertex-shape")  // if its a circle
        .attr("r",
          function(d,i,n){
            return d3.select(this).attr("r")*spatial_growth_value
          }
        )
        .attr("d",function(){
          return path_pose(d3.select(this).attr("r"))}
        );
      
      // stroke-width & text should grow as well
      // since they are defined at the vertices-group  level (aka parent node of vertex)
      // we pick them from there, grow them, and affect them to our vertex overiding
      // the inheritance from vertices-group
      vertex.attr(
          "stroke-width",
          function(d,i,n){
            return d3.select(this.parentNode).attr("stroke-width")*spatial_growth_value
          }
        )
        .attr(
          "font-size",
          function(d,i,n){
            return d3.select(this.parentNode).attr("font-size")*spatial_growth_value
          }
        );
      // fill the covariance
      d3.select(`.covariance.${d.var_id}`).style('visibility','visible');
      d3.select(`.covariance.${d.var_id}`).classed("highlight", true);
      // highlights on the factor and separator set
      d.factor_set.forEach(factor_id => 
        {
          d3.select(`.factor.${factor_id}`).classed("link_highlight", true).raise();
          d3.select(`.factor.${factor_id}`).datum().vars_id.forEach((var_str) =>
            d3.select(`.vertex.${var_str}`).classed("link_highlight", true).raise()
          );
        }
      )
      // raise the hovered vertex at the top
      d3.select(`.vertex.${d.var_id}`)
        .raise()
      // the tooltip
      elDivTooltip
        .style("left", `${e.pageX}px`)
        .style("top", `${e.pageY - 6}px`)
        .style("visibility", "visible").html(`<p class="tooltip-title">
                          <strong><em>${d.var_id}</em></strong>
                         </p>
                         <br>
                         <span class="tooltip-field"><strong>Mean</strong></span>: 
                         <span class="tooltip-value">${JSON.stringify(
                           d.mean,
                           (k, v) => (v.toPrecision ? v.toPrecision(4) : v),
                           "\t"
                         )}</span>
                         <br>
                         <span class="tooltip-field"><strong>Separator</strong></span>: 
                         <span class="tooltip-value">${d.separator_set}</span>
                         <br>
                         <span class="tooltip-field"><strong>Factors</strong></span>: 
                         <span class="tooltip-value">${d.factor_set}</span>
                         `);
      // // change the pointer
      // d3.select(`.vertex.${d.var_id}`).style("cursor", "pointer");
    })
    .on("mousemove", (e) =>
      elDivTooltip.style("top", e.pageY + "px").style("left", e.pageX + "px")
    )
    // on hover out, rebase to default
    .on("mouseout", (e, d) => {
      vertex
        .select(".vertex-shape")
        .attr("r",
          function(d,i,n){
            return d3.select(this).attr("r")/spatial_growth_value
          }
        )
        .attr("d",function(){
          return path_pose(d3.select(this).attr("r"))}
        );
      // stroke-width & font-size defaults value
      // are defined at vertices-group level, remove those attributes for this
      // vertex so that we inherit the defaults again
      vertex
        .attr("stroke-width", null)
        .attr("font-size",null);
      // remove the highlight on the factor and separator
      d.factor_set.forEach(factor_id => 
        {
          d3.select(`.factor.${factor_id}`).classed("link_highlight", false);
          d3.select(`.factor.${factor_id}`).datum().vars_id.forEach((var_str) =>
            d3.select(`.vertex.${var_str}`).classed("link_highlight", false)
          );
        }
      )
      // remove covariance highlight
      d3.select(`.${d.var_id}.covariance`).classed("highlight", false);
      // hide the tooltip
      d3.select(`.vertex.${d.var_id}`)
      elDivTooltip.style("visibility", "hidden");
    });
  }
}
