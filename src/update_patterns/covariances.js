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

export {join_enter_covariance, join_update_covariance}


function join_enter_covariance(enter) {
  return enter
    .append("ellipse")
    .attr("class", (d) =>`covariance ${d.var_id}`)
    .style("display",(d) => {
      if ( d.covariance == undefined ){
        return "none";
      } else{
        return "inherit";
      }
    })
    .each(function(dd){
      if (dd.covariance== undefined){
        d3.select(this)
        .attr(
          "transform",
            `translate(${dd.mean.x},${dd.mean.y}) rotate(0)`
        )
        .attr("rx", 0)
        .attr("ry", 0)
      } else{
        d3.select(this)
        .attr(
          "transform",
            `translate(${dd.mean.x},${dd.mean.y}) rotate(${
              (dd.covariance.rot * 180) / Math.PI})`
        )
        .attr("rx", dd.covariance.sigma[0] * Math.sqrt(9.21))
        .attr("ry", dd.covariance.sigma[1] * Math.sqrt(9.21))
      }
    })
}

const join_update_covariance = function(duration_transition_update){
  return function(update) {
    const t_graph_motion = d3.transition().duration(duration_transition_update);
    update
      .style("display",(d) => {
        if ( d.covariance == undefined ){
          return "none";
        } else{
          return "inherit";
        }
      })
      .each(function(dd){
        if (dd.covariance == undefined){
          d3.select(this)
            .transition(t_graph_motion)
            .attr(
              "transform",
              (d) =>
                `translate(${d.mean.x},${d.mean.y}) rotate(0)`
            )
            .attr("rx", 0)
            .attr("ry", 0);
        }
        else{
          d3.select(this)
            .transition(t_graph_motion)
            .attr(
              "transform",
              (d) =>
                `translate(${d.mean.x},${d.mean.y}) rotate(${
                  (d.covariance.rot * 180) / Math.PI
                })`
            )
            .attr("rx", (d) => d.covariance.sigma[0] * Math.sqrt(9.21))
            .attr("ry", (d) => d.covariance.sigma[1] * Math.sqrt(9.21));
        }
      })
  }
}

