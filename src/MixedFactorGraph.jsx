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
import './MixedFactorGraph.css'
import { createMemo, createEffect, onMount, createSignal, untrack } from "solid-js"
// REFACTOR_SEVERAL_GRAPHS: these imports stays (mind the name of css file)

import { MixedFactorGraphData } from "./stores/MixedFactorGraphData"
import AxesWithScales from "./components/AxesWithScales"
import TicksGrid from "./components/TicksGrid"
import { boundingBoxOfInterest, setBoundingBoxOfInterest, bounding_box_centering_view_transform } from "./stores/BoundingBoxOfInterest"
import { SlamVizUI_opts, setSlamVizUI_opts } from "./stores/SlamVizUI"
// REFACTOR_SEVERAL_GRAPHS: these imports stays

// import { DummyTurnkeyVertices, DummyTurnkeyFactors, DummyTurnkeyCovariances } from "./stores/dummy_turnkey_graph"
import { join_enter_covariance, join_update_covariance } from "./update_patterns/covariances"
import { get_graph_bbox, mean_distance_neighbours} from "./update_patterns/graph_analysis"
import { join_enter_vertex, join_update_vertex, path_pose } from "./update_patterns/vertices"
import { join_enter_factor, join_update_factor, join_exit_factor } from "./update_patterns/factors"
import {  objectify_marginals, objectify_factors, compute_separator_set, compute_factor_set,  estimation_data_massage } from "./update_patterns/graph_massage"
// REFACTOR_SEVERAL_GRAPHS: these import goes in graph-group
import toast from 'solid-toast';

//------------------------------------------------------------------//
//                            component                             //
//------------------------------------------------------------------//
function MixedFactorGraph(props){
  // define & initialize some signals
  const initSvgSize = { w: 1000, h: 1000 };
  const [ svgSize, setSvgSize ] = createSignal(initSvgSize);
  // REFACTOR_SEVERAL_GRAPHS: this stays here (svg size)

  const [ ZoomTransform, setZoomTransform ] = createSignal(d3.zoomIdentity);
  // REFACTOR_SEVERAL_GRAPHS: ZoomTransform stays here but is not set here (set in graph-group)
  //                          Used to track the current transform (is modified by 'zoomed' callback)
  //                          So that the scales can react on it.

  const [declutterCoefficient, setDeclutterCoefficient] = createSignal(1);
  // REFACTOR_SEVERAL_GRAPHS: this stays here, but pass as props to graphs

  // UI input to change base unit (increment/decrement by 10% of baseline)
  d3.select("body").on("keydown",(e)=>{
    console.log(`keypress: ${e.key}`);
    if (e.key === "Backspace"){
      setDeclutterCoefficient((dc)=> dc/1.5);
    }
    else if(e.key === "s"){
      setDeclutterCoefficient((dc)=>dc*1.5);
    }
    else if(e.key === " "){
      // reset
      setDeclutterCoefficient(1);
    }
  })
  // REFACTOR_SEVERAL_GRAPHS: this paragraph stays
  // on UnitGraph (WARNING: test though !), this should only be triggered if GoI

  const computeScales = ()=>{
    const {w, h} = svgSize();
    return {x: d3.scaleLinear().range([0, w]).domain([0,w]),
               y: d3.scaleLinear().range([0, h]).domain([0,h])};
  };
  // Observe:  Scales and Ztransform  &  Impact: AdjustedScales
  const adjustedScales = createMemo(()=>{
    const ztransform = ZoomTransform();
    const sc = computeScales();
    // console.log("adjusting scale")
    const asc = {x: ztransform.rescaleX(sc.x), y: ztransform.rescaleY(sc.y)};
    // console.log(asc)
    return asc
  });
  // REFACTOR_SEVERAL_GRAPHS: this paragraph stays here

  const d3selections = new Object();
  // REFACTOR_SEVERAL_GRAPHS: this stays here, but the graph-group need one also

  // data massage
  const processGraphData = createMemo(()=>{

    // toast("Processing New Graph Data");

    // console.log("Processing new data:");
    const graph = JSON.parse(JSON.stringify(MixedFactorGraphData()));
    // console.log(graph);
    // REFACTOR_SEVERAL_GRAPHS: make it a larges objects of datas (and a Store rather than signal)
    //                          perhaps, it does not need to onMount
    //                          Then dispatch the data to group-graphs components that will render it.

    // get the spatial bounding box of this graph
    const [mx, Mx, my, My] = get_graph_bbox(graph);
    // console.log(`Graph Bounding box is 
    //   [${mx.toFixed(2)}, ${my.toFixed(2)}, ${Mx.toFixed(2)}, ${My.toFixed(2)}]`);
    // REFACTOR_SEVERAL_GRAPHS: move this paragraph to graph-group
    
    setBoundingBoxOfInterest([mx, Mx, my, My]); // goes to store
    // REFACTOR_SEVERAL_GRAPHS: goes in graph-group, but only do it if GoI (or UI ok)

    // compute the base unit given the mean euclidian distance between connected nodes in
    // the graph
    const canonical_base_unit = mean_distance_neighbours(graph)/10; // TODO: replace by median
    // console.log(`base graph unit set to : ${canonical_base_unit}`);
    // initially the applied base unit is the canonical
    // REFACTOR_SEVERAL_GRAPHS: move this paragraph to graph-group

    // massage data
    // console.log("[Data Massage]: start");
    graph.obj_marginals = objectify_marginals(graph.marginals);
    graph.obj_factors = objectify_factors(graph.factors);
    compute_factor_set(graph);
    compute_separator_set(graph);
    estimation_data_massage(graph, canonical_base_unit);
    // console.log("[Data Massage]: done");
    // console.log(graph)

    // toast.success("New Data Processed !");

    return {graph: graph, unit_base: canonical_base_unit}
    // REFACTOR_SEVERAL_GRAPHS: move this paragraph to graph-group
  });

  const appliedUnitGraph = createMemo(()=>{
    const {unit_base} = processGraphData();
    // console.log(`unit base: ${unit_base}`);
    // console.log(`declutter coefficient: ${declutterCoefficient()}`)
    return declutterCoefficient()*unit_base;
  });
  // REFACTOR_SEVERAL_GRAPHS: this goes in graph-group but GoI might be needed (or do the GoI condition in the prop)
  //                          i.e. we just want to declutter the GoI graph not the others

  onMount(() =>{
    // register d3 selections (those element contents will be under d3 jurisdiction, not solidjs)
    d3selections.svg = d3.select("svg.mixed-factor-graph");
    // d3selections.grid = d3.select("svg#MixedFactorGraph g.grid");
    // d3selections.axesScales = d3.select("svg#MixedFactorGraph g.axes-scales");
    d3selections.graph= d3.select("svg.mixed-factor-graph g.gMixedFactorGraph");
    // create a tooltip
    d3selections.tooltip = d3.select("body").append("div").classed("tooltip-factor-graph", true);
    // REFACTOR_SEVERAL_GRAPHS: this paragraph stays here, except the graph
    //                          also mind the consequences on the tooltip behavior


    // register svg size
    setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    // re-register svg size values whenever client gets resized
    window.addEventListener("resize",()=>{
      setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    })
    // REFACTOR_SEVERAL_GRAPHS: this paragraph stays here

    // // zoom (with initial value)
    d3selections.svg.call(d3.zoom().on("zoom",zoomed));
    // zoom callback
    function zoomed(e){
      // console.log("zoomed event")
      // console.log(e)
      // console.log(transform);
      // the zoom transform is applied to factor graph group (not the whole svg)
      // if (hasTransition){
      //   d3.select('g.gMixedFactorGraph')
      //     .transition().duration(1500)
      //     .attr("transform",transform);
      // }
      // else 
      d3.select('g.gMixedFactorGraph').attr("transform",e.transform);
      // record current transform for scales/axes/grid reactivity
      setZoomTransform(e.transform);
    }
    // REFACTOR_SEVERAL_GRAPHS: this paragraph stays here, mind the .gMixedFactorGraph name

    
    const graphZoomTransform = ()=>{
      const {w, h} = untrack(svgSize);
      if (boundingBoxOfInterest().length==4){ // length is 0 initially
        const xyk = bounding_box_centering_view_transform(boundingBoxOfInterest(),w,h);
        return xyk;
      }
      // initial transform to be centered around zero
      // TODO: remove that if/else: just set bbox initial value to something it has prolly no adverse consequences
      else return { x:w/2, y:h/2,k:1 };
    };
    // REFACTOR_SEVERAL_GRAPHS: stays here (inside onMount)

    // Be reactive on zoom transform changes (=> produce d3 pan/zoom)
    // the first run is necessarly the centering around 0,0
    // Note the reactive causal path: 
    //      bbox_oI -> zoomTransform -> d3 zoom effect
    let firstMountTime = true;
    createEffect(()=>{
      const gzt = graphZoomTransform();
      // const gzt = untrack(graphZoomTransform); // only on init

      const {w, h} = untrack(svgSize);;
      const [mx, Mx, my, My] = untrack(boundingBoxOfInterest);

      d3selections.svg
        .transition("zt").duration(firstMountTime? 0:9500).ease(d3.easeLinear)
        .call(
          d3.zoom().on("zoom",zoomed).transform,
          d3.zoomIdentity
          .translate(w/ 2, h/ 2)
          .scale( 0.9 / Math.max((Mx - mx) / w, (My - my) / h))
          .translate(-(mx + Mx) / 2, -(my + My) / 2)
        );
      firstMountTime = false;

    })
    // REFACTOR_SEVERAL_GRAPHS: this paragraph stays here

    // when data is ready & massaged
    // OR when new appliedUnitGraph() value (eg declutter)
    createEffect(()=>{
      // graph 
      // (d3's infamous general update pattern)
      // first the covariances
      // then the factors (therefore on top of the cov)
      // then the vertices (therefore on top of the factors)
      // console.log("Mounting new data/or updating data due to new applied unit for graph")
      const { graph } = processGraphData();
      console.log(graph)
      const duration_entry = 2500;  // TODO: this is a UI option (should be untracked
                                    // so as to not trigger reactivity)
      const duration_update = 10000;
      // TODO: replace this covariance condition by UI option (untracked as well)
      //       going forward, the data header will no longer have an 'exclude' field
      // if (false)
      if (graph.header.exclude == null || ! graph.header.exclude.includes('covariance'))
      {
        d3selections.graph
          .select("g.covariances-group")
          .selectAll(".covariance")
          .data(graph.marginals, (d)=> d.var_id)
          .join(join_enter_covariance(duration_entry), join_update_covariance(duration_update)); // TODO: exit covariance
      }
      d3selections.graph
        .select("g.factors-group")
        .selectAll(".factor")
        .data(graph.factors, (d) => d.factor_id)
      // quirk if the appliedUnitGraph change (ie due to UI input to declutter), the proper
      // way to resize existing node is to do it through the update selection function
        .join(join_enter_factor(0.6*appliedUnitGraph(),d3selections.tooltip,duration_entry), join_update_factor(0.6*appliedUnitGraph(),duration_update) /* join_exit_factor */);
      d3selections.graph
        .select("g.vertices-group")
        .selectAll(".vertex")
        .data(graph.marginals, (d)=> d.var_id)
        .join(join_enter_vertex(appliedUnitGraph(),d3selections.tooltip,duration_entry),join_update_vertex(appliedUnitGraph(),duration_update));
      // REFACTOR_SEVERAL_GRAPHS: move this paragraph to graph-group
    });

  })

  // style="transform: matrix(1, 0, 0, -1, 0, 0);" equiv to scaleY(-1)

  // REFACTOR_SEVERAL_GRAPHS: solidjs control flow depending on data + calls to graph group components
  const displayGrids = true;
  return (
  <svg class="mixed-factor-graph" id={props.id}>
    <Show when={displayGrids}>
      <TicksGrid 
        adjustedScales={adjustedScales()} 
        svgId={props.id}
        svgSize={svgSize()} 
        invertText={true}
        gridOpacity={"50%"}
      />
    </Show>
    <g class="gMixedFactorGraph">
      <g class="covariances-group"
        style="display: inherit"
        stroke-width={0.04*appliedUnitGraph()}
        stroke="#aaa"
        fill="none">
      </g>
      <g class="factors-group"
        stroke="grey"
        stroke-width={0.5*appliedUnitGraph()}
        fill="#333">
      </g>
      <g class="vertices-group"
        font-size={0.75*appliedUnitGraph()} 
        stroke-width={0.12*appliedUnitGraph()} 
        stroke="#212F3C" 
        style="text-anchor: middle;font-family: monospace;dominant-baseline: middle; cursor: pointer;fill: #fff"
        >
      </g>
    </g>
    <Show when={displayGrids}>
      <AxesWithScales 
        svgId={props.id}
        adjustedScales={adjustedScales()} 
        svgSize={svgSize()}/>
    </Show>
  </svg>
  )
}

export default MixedFactorGraph;
