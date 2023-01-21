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

// const get_spatial_density_coefficient = function(graph, graph_bbox){
//   // compute the mean distance (warning: odometry only)
//   if (graph.factors.length > 1){
//     let N=0;
//     const sum_of_distances = graph.factors
//       .filter((f)=>f.type==="odometry")// perhaps widen to every pair factor, not just odometry
//       .map((f) => {
//         N++;
//         return sqDist(
//           graph.marginals.find((v) => v.var_id === f.vars_id[0]),
//           graph.marginals.find((v) => v.var_id === f.vars_id[1])
//         );
//       })
//       .reduce((acc, v) => acc + v, 0);
//     // console.log("sum dist")
//     // console.log(sum_of_distances)
//     // mean
//     const mean_dist = sum_of_distances/N;
//     console.log(`mean distance in this graph : ${mean_dist}`);
//     // span
//     const [mx,Mx,my,My] = graph_bbox;
//     const graph_span = Math.sqrt((Mx-mx)**2+(My-my)**2);
//     // return m/s
//     return mean_dist/graph_span;
//   }
//   else return 1; // no density value is set to 1
// }

const mean_distance_neighbours= function(graph){
  // compute the mean distance (warning: odometry only)
  if (graph.factors.length > 1){
    let N=0;
    const sum_of_distances = graph.factors
      .filter((f)=>f.type==="odometry")// perhaps widen to every pair factor, not just odometry
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
    console.log(`mean distance in this graph : ${mean_dist}`);
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
const infer_base_unit_graph = function(graph, svgSize){
  // ideal value is when 
  // return 0.15;
  return 1;
}

// compute the transform to center the graph given:
// - the zero transform (ie the transform that makes 0 appear at the center of svg)
// - the bounding box
const graph_center_transform = function(graph_bbox, w_svg, h_svg){
  const [mx,Mx,my,My] = graph_bbox;
  const xc = (Mx-mx)/2;
  const yc = (My-my)/2;
  const xmargin = (Mx-mx)*1.2; // 10% margin on top & bot
  const ymargin = (My-my)*1.2; // 10% margin on L&R
  const [x,y,X,Y] = [mx-xmargin,Mx+xmargin,my-ymargin,My+ymargin];
  // scale
  const graph_span = Math.sqrt((X-x)**2+(Y-y)**2); // 10% margin
  const svg_span=Math.sqrt(w_svg**2+h_svg**2);
  return {x: xc, y: yc, k: svg_span/graph_span};
}

export { get_graph_bbox, mean_distance_neighbours, infer_base_unit_graph, graph_center_transform}
