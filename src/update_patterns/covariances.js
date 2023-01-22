import * as d3 from "d3"

export {join_enter_covariance, join_update_covariance}


function join_enter_covariance(enter) {
    return enter
      .append("ellipse")
      .attr("class", (d) =>`covariance ${d.var_id}`)
      .attr(
        "transform",
        (d) =>
          `translate(${d.mean.x},${d.mean.y}) rotate(${
            (d.covariance.rot * 180) / Math.PI
          })`
      )
      .attr("rx", (d) => d.covariance.sigma[0] * Math.sqrt(9.21))
      .attr("ry", (d) => d.covariance.sigma[1] * Math.sqrt(9.21))
}

function join_update_covariance(update) {
  const t_graph_motion = d3.transition().duration(1000).ease(d3.easeCubicInOut);
  update
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

