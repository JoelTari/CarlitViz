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
import DummyTurnkeyGraph from "./stores/dummy_turnkey_graph"

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
  const [unifiedScalingCoefficient, setUnifiedScalingCoefficient] = createSignal(1);

  // change unified scaling coefficient (i.e. on declutter button push)
  const change_usc = function(){
    // TODO: make it only triggered via UI button push
    setUnifiedScalingCoefficient(baseUnitGraph()*ZoomTransform().k/graphZoomTransform().k);
    console.log(`usc: ${unifiedScalingCoefficient()}`);
  }


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
      console.log(transform);
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
      const canonical_base_unit = mean_distance_neighbours(graph)/9;
      // canonical base unit is also the max unit value (in the graph domain metric, ie not the viewport)
      // But when we zoom we want to declutter (only after pushing a button, it is too costly to do otherwise)
      // // the biggest/ideal base unit (ignoring )
      // const ideal_base_unit = Math.sqrt((Mx-mx)**2+[My-my]**2)/5;
      setBaseUnitGraph(canonical_base_unit); // change
      console.log(`base graph unit set to : ${canonical_base_unit}`);


      // massage data
      console.log("[Data Massage]: start");
      graph.obj_marginals = objectify_marginals(graph.marginals);
      graph.obj_factors = objectify_factors(graph.factors);
      compute_factor_set(graph);
      estimation_data_massage(graph);
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
  // d3.selectAll(circle).attr(r, HERE )
  createEffect(()=>{})

  // TODO: UI solid-if opts on grid and axes-scales
  return (
  <svg id="MixedFactorGraph" >
    <TicksGrid adjustedScales={adjustedScales()} svgSize={svgSize()}/>
    <g class="gMixedFactorGraph">
      <g class="covariances_group"/>
      <g class="factors_group"/>
      <g class="vertices_group"/>
      <rect x="800" y="500" width="100" height="100"/>
      <circle cx="6" cy="4" r={baseUnitGraph()} fill="red"/>
      <g class="chold" stroke="silver" stroke-width="5">
        <circle r={3*unifiedScalingCoefficient()} fill="blue" stroke="none"/>
        <circle cx="125" r={0.1*Math.sqrt(svgSize().h**2 + svgSize().w**2)/2} fill="blue" />
      </g>
      <circle cx="300" cy="300" r="25" fill="black" stroke="green"/>
      <g class="dummies" font-size="0.1" stroke-width="0.018" stroke="grey" fill="#f9f5d7">
        <DummyTurnkeyGraph r={baseUnitGraph()}/>
      </g>
    </g>
    <AxesWithScales adjustedScales={adjustedScales()} svgSize={svgSize()}/>
  </svg>
  )
}

export default MixedFactorGraph;
