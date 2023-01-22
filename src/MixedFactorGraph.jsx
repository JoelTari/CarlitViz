import * as d3 from "d3"
import { createMemo, createEffect, onMount, createSignal } from "solid-js"
import { MixedFactorGraphData } from "./stores/MixedFactorGraphData"
import './MixedFactorGraph.css'
import { join_enter_covariance, join_update_covariance } from "./update_patterns/covariances"
import { join_enter_vertex, join_update_vertex } from "./update_patterns/vertices"
import { join_enter_factor, join_update_factor, join_exit_factor } from "./update_patterns/factors"
import {  objectify_marginals, objectify_factors, compute_factor_set,  estimation_data_massage } from "./update_patterns/graph_massage"
import { get_graph_bbox, graph_center_transform, infer_base_unit_graph, mean_distance_neighbours} from "./update_patterns/graph_analysis"
import AxesWithScales from "./components/AxesWithScales"
import TicksGrid from "./components/TicksGrid"
import { SlamVizUI_opts, setSlamVizUI_opts } from "./stores/SlamVizUI"
import { DummyTurnkeyVertices, DummyTurnkeyFactors, DummyTurnkeyCovariances } from "./stores/dummy_turnkey_graph"

function MixedFactorGraph(){
  // define & initialize some signals
  const initSvgSize = { w: 1000, h: 1000 };
  const [ svgSize, setSvgSize ] = createSignal(initSvgSize);
  const [Scales, setScales] = createSignal(
      { x: d3.scaleLinear().range([0, svgSize().w]).domain([0,svgSize().w]),
        y: d3.scaleLinear().range([0, svgSize().h]).domain([0,svgSize().h]) });
  const [ ZoomTransform, setZoomTransform ] = createSignal(d3.zoomIdentity);
  const [ graphZoomTransform, setGraphZoomTransform ] = createSignal(d3.zoomIdentity); // graph specific
  const [adjustedScales, setAdjustedScales] = createSignal( { });

  // reactive memo on the graph data
  const CopiedMixedFactorGraphData = createMemo(() =>{
    // TODO: perhaps massage the data here ?
    return JSON.parse(JSON.stringify(MixedFactorGraphData()))
  })

  // base unit graph:
  // - Basis for elements dimension, is different for every graph
  //  A graph (A - B) where space between A and B is 100m while not have same "base_unit_graph"
  //  as a graph (A - B) where that space is 1m.
  //  That is why we use the data in the graph to infer a value (if a value is not given)
  // - When we are zoomed however, the user might want to declutter, i.e. compute a new value
  // for the base_unit_graph wrt ztransform scale and initial "base_unit_graph" value, this is
  // what I call the unified scaling coefficient
  const [baseUnitGraph, setBaseUnitGraph] = createSignal(1); // 0.15
  const [appliedUnitGraph, setAppliedUnitGraph] = createSignal(1);


  // UI input to change base unit (increment/decrement by 10% of baseline)
  d3.select("body").on("keydown",(e)=>{
    console.log(`keypress: ${e.key}`);
    if (e.key === "Backspace"){
      setAppliedUnitGraph(appliedUnitGraph()/1.5);
      // change for d3
      d3.selectAll(".factor circle").attr("r",0.3*appliedUnitGraph());
    }
    else if(e.key === "s"){
      setAppliedUnitGraph(appliedUnitGraph()*1.5);
      // change for d3
      d3.selectAll(".factor circle").attr("r",0.3*appliedUnitGraph());
    }
    else if(e.key === " "){
      // reset
      setAppliedUnitGraph(baseUnitGraph());
      // change for d3
      d3.selectAll(".factor circle").attr("r",0.3*appliedUnitGraph());
    }
  })


  const d3selections = new Object();

  onMount(() =>{
    // register d3 selections (those element contents will be under d3 jurisdiction, not solidjs)
    d3selections.svg = d3.select("svg#MixedFactorGraph");
    // d3selections.grid = d3.select("svg#MixedFactorGraph g.grid");
    // d3selections.axesScales = d3.select("svg#MixedFactorGraph g.axes-scales");
    d3selections.graph= d3.select("svg#MixedFactorGraph g.gMixedFactorGraph");

    // register svg size
    setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    // re-register svg size values whenever client gets resized
    window.addEventListener("resize",()=>{
      setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    })


    // Observe: svgSize  &  Impact: Scales
    createEffect(()=>{
      // reactive variables
      const h=svgSize().h;
      const w=svgSize().w;
      setScales({x: d3.scaleLinear().range([0, w]).domain([0,w]),
                 y: d3.scaleLinear().range([0, h]).domain([0,h])})
    })
    // Observe:  Scales and Ztransform  &  Impact: AdjustedScales
    createEffect(()=>{
      const ztransform = ZoomTransform();
      const sc_x = Scales().x;
      const sc_y = Scales().y;
      setAdjustedScales(
        {
          x: ztransform.rescaleX(sc_x),
          y: ztransform.rescaleY(sc_y)
        });
    });

    let {h,w} = svgSize();
    // I do
    createEffect(()=> {
      h= svgSize().h;
      w= svgSize().w;
    });

    // // zoom (with initial value)
    d3selections.svg.call(d3.zoom().on("zoom",zoomed));
    // zoom callback
    function zoomed({transform, hasTransition}){
      // console.log(transform);
      // the zoom transform is applied to factor graph group (not the whole svg)
      if (hasTransition){
        d3.select('g.gMixedFactorGraph')
          .transition().duration(1500)
          .attr("transform",transform);
      }
      else d3.select('g.gMixedFactorGraph').attr("transform",transform);
      setZoomTransform(transform);
    }
    // set an initial zoom transform centered (before any graph data)
    // because it makes it so much easy to reason about when moving graph
    const zero_center_transform = d3.zoomIdentity.translate(w/2,h/2);
    d3selections.svg.call(
      d3.zoom().on("zoom",zoomed).transform,
      zero_center_transform);


    // reactive to graph data (only data, I dont want to repeat this costly routine whenever svg size changes)
    createEffect(()=>{
      console.log("new data:")
      console.log(CopiedMixedFactorGraphData());
      const graph = CopiedMixedFactorGraphData();

      // get the spatial bounding box of this graph
      const [mx, Mx, my, My] = get_graph_bbox(graph);
      console.log(`Graph Bounding box is 
        [${mx.toFixed(2)}, ${my.toFixed(2)}, ${Mx.toFixed(2)}, ${My.toFixed(2)}]`);
      
      // zoom-in to this graph: takes the 0-center transform (a pure translation transform)
      //   and translate and scale according to the graph bbox
      const graph_zoom_transform = graph_center_transform([mx, Mx, my, My],w,h);
      setGraphZoomTransform(graph_zoom_transform);
      // d3selections.svg.transition().duration(1000).call(
      //   d3.zoom().on("zoom",zoomed).transform,
      //   graph_zoom_transform);
      d3selections.svg
        .transition("b").duration(200)
        .call(d3.zoom().on("zoom",zoomed).translateTo,graph_zoom_transform.x,graph_zoom_transform.y)
        .transition("a").duration(700)
        .call(d3.zoom().on("zoom",zoomed).scaleTo,graph_zoom_transform.k)
        ;

      // compute the base unit given the mean euclidian distance between connected nodes in
      // the graph
      const canonical_base_unit = mean_distance_neighbours(graph)/6;
      setBaseUnitGraph(canonical_base_unit);
      console.log(`base graph unit set to : ${canonical_base_unit}`);
      // initially the applied base unit is the canonical
      setAppliedUnitGraph(canonical_base_unit);


      // massage data
      console.log("[Data Massage]: start");
      graph.obj_marginals = objectify_marginals(graph.marginals);
      graph.obj_factors = objectify_factors(graph.factors);
      compute_factor_set(graph);
      estimation_data_massage(graph, canonical_base_unit);
      console.log("[Data Massage]: done");

      // graph 
      // (d3's infamous general update pattern)
      // first the covariances
      // then the factors (therefore on top of the cov)
      // then the vertices (therefore on top of the factors)
      // 
      if (graph.header.exclude == null || ! graph.header.exclude.includes('covariance'))
      {
        d3selections.graph
          .select("g.covariances-group")
          .selectAll(".covariance")
          .data(graph.marginals)
          .join(join_enter_covariance, join_update_covariance); // TODO: exit covariance
      }
      d3selections.graph
        .select("g.factors-group")
        .selectAll(".factor")
        .data(graph.factors, (d) => d.factor_id)
        .join(join_enter_factor(0.3*canonical_base_unit), join_update_factor, join_exit_factor);
      d3selections.graph
        .select("g.vertices-group")
        .selectAll(".vertex")
        .data(graph.marginals, (d)=> d.var_id)
        .join(join_enter_vertex,join_update_vertex);
    })

  })

  // reactive to UI: (UI options not yet imported)
  // d3.selectAll(circle).attr(r, HERE )
  createEffect(()=>{})

  return (
  <svg id="MixedFactorGraph" >
    <TicksGrid adjustedScales={adjustedScales()} svgSize={svgSize()}/>
    <g class="gMixedFactorGraph">
      <g class="covariances-group">
      </g>
      <g class="factors-group"
        stroke="grey"
        stroke-width={0.3*appliedUnitGraph()}
        fill="#333">
      </g>
      <g class="vertiices-group">
      </g>
      <g class="covariiances-group" 
        style="display: inherit;"
        stroke-width={0.03*appliedUnitGraph()} 
        stroke="black" 
        fill="none">
        <DummyTurnkeyCovariances/>
      </g>
      <g class="factoors-group" 
        display="none"
        stroke="grey"
        stroke-width={0.3*appliedUnitGraph()}
        fill="#333">
        <DummyTurnkeyFactors r={0.3*appliedUnitGraph()}/>
      </g>
      <g class="vertiices-group"
        font-size={0.75*appliedUnitGraph()} 
        stroke-width={0.12*appliedUnitGraph()} 
        stroke="grey" 
        style="text-anchor: middle;font-family: monospace;dominant-baseline: middle;"
        fill="#f9f5d7">
        <DummyTurnkeyVertices r={appliedUnitGraph()}/>
      </g>
    </g>
    <AxesWithScales adjustedScales={adjustedScales()} svgSize={svgSize()}/>
  </svg>
  )
}

export default MixedFactorGraph;


// canonical base unit is also the max unit value (in the graph domain metric, ie not the viewport)
// But when we zoom we want to declutter (only after pushing a button, it is too costly to do continously)
// the decluttered_base_unit is set so that:
//   1) close nodes are spatially distinguishable (declutter) 
//      => implies the size diminishes with the ratio graphZoomTransform.k/ZoomTransform().k
//   2) the unit need to be big enough so that it is readalbe 
//                 (which is not the objective of the canonical_base_unit)
//      E.g. we want the unit to not be smaller than x% of screen width
//      => implies the size diminishing of (1) is mitigated by a lower bound of the screen/viewport
//   3) but the dbu can't be greater than the canonical_base_unit. This overrule (2)
//      => implies a min(canonical_base_unit, declutter_base_unit) at the end
// Just doing an adjustment by zoom value isnt enough:
//  declutter_base_unit = canonical_base_unit * k_graph_zoom/k_current_zoom;
// Because on a large graph (eg M3500), the canonical_base_unit may be too small on the screen/viewport
const compute_declutter_base_unit = function(k_current_scale, k_graph_scale , base_unit,w,h){
const current_scale_adjusted_unit = baseUnitGraph()*k_graph_scale/k_current_scale;
console.log(`current_scale_adjusted_unit: ${current_scale_adjusted_unit}`)
const svg_span=Math.sqrt(w**2+h**2);
// point (2): min_unit = 5% of svgspan/scalespan
const big_enough_adjusted_unit = Math.max(current_scale_adjusted_unit, 0.05*svg_span/k_current_scale);
console.log(`big_enough_adjusted_unit: ${big_enough_adjusted_unit}`)
const final_declutter_unit = Math.min(base_unit, big_enough_adjusted_unit);
console.log(`final_declutter_unit: ${final_declutter_unit}`)
return final_declutter_unit
}
