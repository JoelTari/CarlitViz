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

const get_graph_bbox = function(graph){
  return graph.marginals.reduce(
        (tmp_bb, cur) => [
          Math.min(tmp_bb[0], cur.mean.x),
          Math.max(tmp_bb[1], cur.mean.x),
          Math.min(tmp_bb[2], cur.mean.y),
          Math.max(tmp_bb[3], cur.mean.y),
        ],
        [Infinity, -Infinity, Infinity, -Infinity] // initial extreme values
      );
}

const mean_distance_neighbours= function(graph){
  // compute the mean distance (warning: odometry only)
  if (graph.factors.length > 1){
    let N=0;
    const sum_of_distances = graph.factors
      .filter((f)=>f.type==="odometry"||f.type==="EDGE_SE2")// perhaps widen to every pair factor, not just odometry
      .map((f) => {
        N++;
        return sqDist(
          graph.marginals.find((v) => v.var_id === f.vars_id[0]),
          graph.marginals.find((v) => v.var_id === f.vars_id[1])
        );
      })
      .reduce((acc, v) => acc + v, 0);
    // console.log("sum dist")
    // console.log(sum_of_distances)
    // mean
    const mean_dist = sum_of_distances/N;
    // console.log(`mean distance in this graph : ${mean_dist}`);
    // return m/s
    return mean_dist;
  }
  else return 1; // no neighbour: value is set to 1
}

// internal
function sqDist(v1, v2) {
  return (
    Math.pow(v1.mean.x - v2.mean.x, 2) + Math.pow(v1.mean.y - v2.mean.y, 2)
  );
}

export { get_graph_bbox, mean_distance_neighbours }
