import * as d3 from "d3"

const join_enter_factor = function(radius){
  return function(enter){
      // Imho best way to avoid to define those transitions everywhere is to
    // transform those functions in classes of which the transitions are members
    const t_factor_entry = d3.transition().duration(400);
    const t_graph_motion = d3.transition().duration(1000).ease(d3.easeCubicInOut);

    return enter
      .append("g")
      .classed("factor", true)
      .classed((d) => d.factor_id,true)
      .each(function (d) {
        d3.select(this)
          .style("opacity", 0)
          .transition(t_factor_entry) // ugly (im interest in the child opacity not this node) but necessary to run concurrent transitions on the line (which doesnt work if I place it below)
          .style("opacity", null)
          .selection()
          .call(function (g) {
            if (d.vars.length > 1) {
              // bi-factor, tri-factor etc...
              d.vars.forEach((v) =>
                g
                  .append("line")
                  .attr("x1", d.dot_factor_position.x)
                  .attr("y1", d.dot_factor_position.y)
                  .attr("x2", 0.2 * v.mean.x + 0.8 * d.dot_factor_position.x)
                  .attr("y2", 0.2 * v.mean.y + 0.8 * d.dot_factor_position.y)
                  .classed(v.var_id, true)
                  .transition(t_graph_motion)
                  .attr("x1", d.dot_factor_position.x)
                  .attr("y1", d.dot_factor_position.y)
                  .attr("x2", v.mean.x)
                  .attr("y2", v.mean.y)
              );
            } else {
              // unifactor
              g.append("line")
                .attr("x1", d.dot_factor_position.x)
                .attr("y1", d.dot_factor_position.y)
                .attr("x2", d.dot_factor_position.x)
                .attr("y2", d.dot_factor_position.y)
                .transition(t_graph_motion)
                .attr("x1", d.vars[0].mean.x)
                .attr("y1", d.vars[0].mean.y)
                .attr("x2", d.dot_factor_position.x)
                .attr("y2", d.dot_factor_position.y);
            }

            g.append("circle")
              .attr( "cx", (d) => d.dot_factor_position.x)
              .attr( "cy", (d) => d.dot_factor_position.y)
              .attr("stroke","none")
              .attr( "r", 2 * radius) // *2 is transitory
              // on hover, dot-circle of factor grows and tooltip displays
              // define remotely for clarity
              .call(factor_hover)
              .transition("fc")
              .duration(2200)
              .attr("r",radius);
          });
      });
  }
}

const join_update_factor = function(update){
  // TODO:
  // Imho best way to avoid to define those transitions everywhere is to
  // transform those functions in classes of which the transitions are members
  const t_graph_motion = d3.transition().duration(1000).ease(d3.easeCubicInOut);

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
  });
  // the little factor circle (to visually differentiate from with MRF)
  update
    .select("circle")
    .transition(t_graph_motion)
    .attr("cx", (d) => d.dot_factor_position.x)
    .attr("cy", (d) => d.dot_factor_position.y);

}
const join_exit_factor = function(exit){
  return (
    exit
      .call(function (ex) {
        ex.selectAll("line").style("stroke", "brown");
        ex.select("circle").style("fill", "brown");
      })
      .transition("exit_factor") // TODO: Define outside
      .duration(1000)
      .style("opacity", 0)
      .remove()
  );
}

export { join_enter_factor, join_update_factor, join_exit_factor }






function factor_hover(factor_dot){

}
