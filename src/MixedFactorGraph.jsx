import * as d3 from "d3"
import { createMemo, createEffect, onMount, createSignal } from "solid-js"
import { MixedFactorGraphData } from "./stores/MixedFactorGraphData"
import './MixedFactorGraph.css'
import { join_enter_covariance, join_update_covariance } from "./update_patterns/covariances"
import { join_enter_vertex, join_update_vertex } from "./update_patterns/vertices"
import { join_enter_factor, join_update_factor, join_exit_factor } from "./update_patterns/factors"
import { objectify_marginals, objectify_factors, compute_factor_set,  estimation_data_massage } 
from "./update_patterns/graph_massage"

function MixedFactorGraph(){
  const initSvgSize = { w: 1000, h: 1000 };
  const [ svgSize, setSvgSize ] = createSignal(initSvgSize);
  const [ ZoomTransform, setZoomTransform ] = createSignal(d3.zoomIdentity);

  // reactive memo on the graph data
  const CopiedMixedFactorGraphData = createMemo(() =>{
    // TODO: perhaps massage the data here ?
    return JSON.parse(JSON.stringify(MixedFactorGraphData()))
  })

  // on mount: 
    // - affect to d3selections variable to the mounted elements
    // - populate axes with d3 scales generation schemes
    // - zoom
    // - make axes scale and reach reactive to resize and drag/zoom
  const d3selections = new Object();
  onMount(() =>{
    // register d3 selections (those element contents will be under d3 jurisdiction, not solidjs)
    d3selections.svg = d3.select("svg#MixedFactorGraph");
    d3selections.grid = d3.select("svg#MixedFactorGraph g.grid");
    d3selections.axesScales = d3.select("svg#MixedFactorGraph g.axes-scales");
    d3selections.graph= d3.select("svg#MixedFactorGraph g.gMixedFactorGraph");

    // register svg size
    setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    // re-register svg size values whenever client gets resized
    window.addEventListener("resize",()=>{
      setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    })


    createEffect(()=>{
      // reactive variables
      const h=svgSize().h;
      const w=svgSize().w;
      let sc_x = d3.scaleLinear().range([0, w]).domain([0,w])
      let sc_y = d3.scaleLinear().range([0, h]).domain([0,h])
      // apply the drag/zoom transform
      const ztransform = ZoomTransform();
      sc_x = ztransform.rescaleX(sc_x);
      sc_y = ztransform.rescaleY(sc_y);
      // define, using the scales, the d3 objects that have the tooling to generate the axes 
      const xaxis_bot = d3.axisBottom(sc_x);
      const yaxis_right = d3.axisRight(sc_y);
      const yaxis_left = d3.axisLeft(sc_y);
      const xaxis_top = d3.axisTop(sc_x);
      // call those d3 objects to populate existing axes group elements (note that top <-> bot)
      d3selections.axesScales.select(".Xaxis-top").call(xaxis_bot);
      d3selections.axesScales.select(".Xaxis-bottom").call(xaxis_top).attr("transform",`translate(0,${h})`);
      d3selections.axesScales.select(".Yaxis-right").call(yaxis_right);
      d3selections.axesScales.select(".Yaxis-left").call(yaxis_left).attr("transform",`translate(${w},0)`);
      // grid
      d3selections.grid
        .call((g)=>
          g.selectAll(".x")
          .data(sc_x.ticks())
          .join(
            (enter) =>
              enter
                .append("line")
                .attr("class", "x")
                .attr("y1",0)
                .attr("y2", h)
                .attr("x1", (d) => sc_x(d))
                .attr("x2", (d) => sc_x(d))
                .style("stroke","grey")
                .style("stroke-width","1px")
                .style("opacity","30%")
            ,
            (update) => 
              update
                .attr("x1", (d) => sc_x(d))
                .attr("x2", (d) => sc_x(d))
                .attr("y2", h)
            ,
            (exit) => exit.remove()
          )
        )
        .call((g)=>
          g.selectAll(".y")
          .data(sc_y.ticks())
          .join(
            (enter) =>
              enter
                .append("line")
                .attr("class", "y")
                .attr("x1",0)
                .attr("x2", w)
                .attr("y1", (d) => sc_y(d))
                .attr("y2", (d) => sc_y(d))
                .style("stroke","grey")
                .style("stroke-width","1px")
                .style("opacity","30%")
            ,
            (update) => 
              update
                .attr("x2", w)
                .attr("y1", (d) => sc_y(d))
                .attr("y2", (d) => sc_y(d))
            ,
            (exit) => exit.remove()
          )
        )
    })

    // zoom
    d3selections.svg.call(d3.zoom().on("zoom",zoomed));
    // zoom callback
    function zoomed({transform, hasTransition}){
      console.log(transform)
      // the zoom transform is applied to factor graph group (not the whole svg)
      if (hasTransition){
        d3.select('g.gMixedFactorGraph')
          .transition().duration(1500)
          .attr("transform",transform);
      }
      else d3.select('g.gMixedFactorGraph').attr("transform",transform);
      setZoomTransform(transform);
    }

    // reactive to data: CopiedMixedFactorGraphData()
    createEffect(()=>{
      console.log("new data:")
      console.log(CopiedMixedFactorGraphData());
      const graph = CopiedMixedFactorGraphData();

      const GlobalUI = new Object(); // temporary

      // base unit graph is a coefficient to help size the components of the graph
      // different graphs requires different size of vertex circle, stroke-width etc..
      // The graph can have such a coefficient in the header, otherwise a value is computed
      if (graph.header.base_unit != null) {
        GlobalUI.base_unit_graph = graph.header.base_unit;
      } else {
        // compute the base unit graph based on the median calculation of all distances
        // between connected nodes
        const node_distances = graph.factors.map((f) => {
          if (f.type === "odometry") {
            return sqDist(
              graph.marginals.find((v) => v.var_id === f.vars_id[0]),
              graph.marginals.find((v) => v.var_id === f.vars_id[1])
            );
          }
        });
        node_distances.sort((a, b) => a - b);
        const half = Math.floor(node_distances.length / 2);
        const median = Math.sqrt(node_distances[half]);
        // for a median distance of 1 between nodes, 0.15 is the coefficient
        GlobalUI.base_unit_graph = 0.15 * median;
      }

      // This part define a zoom transform that is relevant, based on the new data,
      //        get, for this graph, the left/right/top/bottom-most values.
      const [mx, Mx, my, My] = graph.marginals.reduce(
        (tmp_bb, cur) => [
          Math.min(tmp_bb[0], cur.mean.x),
          Math.max(tmp_bb[1], cur.mean.x),
          Math.min(tmp_bb[2], cur.mean.y),
          Math.max(tmp_bb[3], cur.mean.y),
        ],
        [Infinity, -Infinity, Infinity, -Infinity] // initial extreme values
      );

      console.log(`Bounding box is [${mx.toFixed(2)}, ${my.toFixed(2)}, ${Mx.toFixed(2)}, ${My.toFixed(2)}]`)

      // // apply the zoom transform
      // // zoomed({transform: d3.zoomIdentity.translate(9.3, 25).scale(200), hasTransition: true});
      // // TODO: use svgSize and bounding box to compute correct translate&scale values
      // // do it like this (verified, except dont use these hard coded values of course)
      // DONT REMOVE
      // d3selections
      //   .svg
      //   .call(
      //     // this reset the zoom behavior
      //     d3.zoom().on("zoom",zoomed).transform,
      //     d3.zoomIdentity.translate(9.3, 25).scale(200));

      // massage data
      graph.obj_marginals = objectify_marginals(graph.marginals);
      graph.obj_factors = objectify_factors(graph.factors);
      compute_factor_set(graph);
      estimation_data_massage(graph);

      // graph 
      // (d3's infamous general update pattern)
      // first the covariances
      // then the factors (therefore on top of the cov)
      // then the vertices (therefore on top of the factors)
      // 
      if (graph.header.exclude == null || ! graph.header.exclude.includes('covariance'))
      {
        d3selections.graph
          .select("g.covariances_group")
          .selectAll(".covariance")
          .data(graph.marginals)
          .join(join_enter_covariance, join_update_covariance); // TODO: exit covariance
      }
      d3selections.graph
        .select("g.factors_group")
        .selectAll(".factor")
        .data(graph.factors, (d) => d.factor_id)
        .join(join_enter_factor, join_update_factor, join_exit_factor);
      d3selections.graph
        .select("g.vertices_group")
        .selectAll(".vertex")
        .data(graph.marginals, (d)=> d.var_id)
        .join(join_enter_vertex,join_update_vertex);
    })

  })

  // reactive to UI: (UI options not yet imported)
  createEffect(()=>{})


  // TODO: UI solid-if opts on grid and axes-scales
  return <svg id="MixedFactorGraph"
    >
    <g class="grid"></g>
    <g class="gMixedFactorGraph">
      <g class="covariances_group"/>
      <g class="factors_group"/>
      <g class="vertices_group"/>
      <rect x="800" y="500" width="100" height="100"/>
      <circle cx="0" cy="0" r="1000" fill="none" stroke="red"/>
      <circle cx="0" cy="0" r="100" fill="none" stroke="blue"/>
      <circle cx="300" cy="300" r="25" fill="black" stroke="green"/>
    </g>
    <g class="axes-scales">
      <g class="Xaxis-top"></g>
      <g class="Xaxis-bottom"></g>
      <g class="Yaxis-left"></g>
      <g class="Yaxis-right"></g>
    </g>
  </svg>
}

export default MixedFactorGraph;
