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

const join_enter_factor = function(radius,elDivTooltip, time_transition_entry){
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
            if (d.vars.length > 1) {
              // bi-factor, tri-factor etc...
              d.vars.forEach((v) =>
                g
                  .append("line")
                  .attr("x1", d.dot_factor_position.x)
                  .attr("y1", d.dot_factor_position.y)
                  .attr("x2", v.mean.x)
                  .attr("y2", v.mean.y)
              );
            } else {
              // unifactor
              g.append("line")
                .attr("x1", d.vars[0].mean.x)
                .attr("y1", d.vars[0].mean.y)
                .attr("x2", d.dot_factor_position.x)
                .attr("y2", d.dot_factor_position.y);
            }

            g.append("circle")
              .attr( "cx", (d) => d.dot_factor_position.x)
              .attr( "cy", (d) => d.dot_factor_position.y)
              .attr("stroke","none")
              // on hover, dot-circle of factor grows and tooltip displays
              // define remotely for clarity
              .call(factor_hover(elDivTooltip))
              // .attr( "r", 2 * radius) // *2 is transitory
              // .transition("fc")
              // .duration(time_transition_entry)
              .attr("r",radius);
          });
      });
  }
}

const join_update_factor = function(radius,time_transition_update){
  return function(update){
    // TODO:
    // Imho best way to avoid to define those transitions everywhere is to
    // transform those functions in classes of which the transitions are members
    const t_graph_motion = d3.transition().duration(time_transition_update);

    update.each(function (d) {
      d3.select(this)
        .selectAll("line")
        .each(function (_, i, n) {
          if (d.vars.length > 1) {
            // line
            d3.select(n[i])
              .transition(t_graph_motion)
              .attr("x1", d.dot_factor_position.x)
              .attr("y1", d.dot_factor_position.y)
              .attr("x2", d.vars[i].mean.x)
              .attr("y2", d.vars[i].mean.y);
          } else {
            // update unary factor
            d3.select(n[i])
              .transition(t_graph_motion)
              .attr("x1", d.vars[0].mean.x)
              .attr("y1", d.vars[0].mean.y)
              .attr("x2", d.dot_factor_position.x)
              .attr("y2", d.dot_factor_position.y);
          }
        });
      // update radius factor dot
      d3.select(this)
       .select("circle")
       .attr("r",radius);
    });
    // the little factor circle (to visually differentiate from with MRF)
    update
      .select("circle")
      .transition(t_graph_motion)
      .attr("cx", (d) => d.dot_factor_position.x)
      .attr("cy", (d) => d.dot_factor_position.y);

  }
}
const join_exit_factor = function(exit,time_transition_exit){
  return (
    exit
      .call(function (ex) {
        ex.selectAll("line").style("stroke", "brown");
        ex.select("circle").style("fill", "brown");
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
