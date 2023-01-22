import * as d3 from "d3"

const join_enter_vertex = function(radius,elDivTooltip){
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
          "translate(" + d.mean.x + "," + d.mean.y + ")")
          .call(vertex_hover(elDivTooltip));
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
        // d3.select(this)
        //   .append("circle")
        //   .classed("hover_transparent_circle", true)
        //   .style("opacity", 0)
        //   .attr( "r", radius)
          // hover methods (defined remotely for clarity)
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

function vertex_hover(elDivTooltip){
  return function(vertex){
    vertex
    // on hover, the texts and circles of .vertex will grow in size by 1.4
    .on("mouseover", (e, d) => {
      // grow the vertex circle, raise the element
      vertex
        .select("circle") 
        .attr("r",
          function(d,i,n){
            return d3.select(this).attr("r")*1.4
          }
        );
      // stroke-width & text should grow as well
      // since they are defined at the vertices-group  level (aka parent node of vertex)
      // we pick them from there, grow them, and affect them to our vertex overiding
      // the inheritance from vertices-group
      vertex.attr(
          "stroke-width",
          function(d,i,n){
            return d3.select(this.parentNode).attr("stroke-width")*1.4
          }
        )
        .attr(
          "font-size",
          function(d,i,n){
            return d3.select(this.parentNode).attr("font-size")*1.4
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
        .select("circle")
        .attr( "r", function(d,i,n){ return d3.select(this).attr("r")/1.4 });
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
// compute the separator set of a marginal
function compute_separator(d_marginal){
  const separator_set=[];
  d_marginal.factor_set.forEach(
    factor_id => 
    separator_set.push(
      d3.select(`.factor.${factor_id}`)
        .datum()
        .vars_id
        .filter(node_id => node_id !== d_marginal.var_id )
    )
  )
  return separator_set;
}

