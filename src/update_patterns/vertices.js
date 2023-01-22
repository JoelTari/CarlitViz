import * as d3 from "d3"

const join_enter_vertex = function(radius){
  return function(enter){
    // TODO:
    // Imho best way to avoid to define those transitions everywhere is to
    // transform those functions in classes of which the transitions are members
    const t_vertex_entry = d3.transition().duration(400);

    return enter
      .append("g")
      .attr("class", (d) => `vertex ${d.var_id}`)
      .attr("transform", "rotate(0)")
      .each(function (d) {
        d3.select(this).attr(
          "transform",
          "translate(" + d.mean.x + "," + d.mean.y + ")"
        );
        d3.select(this)
          .append("circle")
          .attr("r",10 * radius) 
          .style("opacity", 0)
          .transition(t_vertex_entry)
          .attr( "r", radius)
          .style("opacity", null);
        // text: variable name inside the circle
        d3.select(this)
          .append("text")
          .attr("stroke","none")
          .attr("fill","black")
          .text((d) => d.var_id)
          .style("opacity", 0)
          .transition(t_vertex_entry)
          .style("opacity", null);
        d3.select(this)
          .append("circle")
          .classed("hover_transparent_circle", true)
          .style("opacity", 0)
          .attr( "r", radius)
          // hover methods (defined remotely for clarity)
          .call(vertex_hover);
      });
  }
}

const join_update_vertex = function(update){
  const t_graph_motion = d3.transition().duration(1000).ease(d3.easeCubicInOut);
  update
    .transition(t_graph_motion)
    .attr("transform", (d) => `translate(${d.mean.x}, ${d.mean.y})`);
}

const join_exit_vertex = function(exit){
  // TODO:
  return exit;
}

export { join_enter_vertex, join_update_vertex }

function vertex_hover(){

}
