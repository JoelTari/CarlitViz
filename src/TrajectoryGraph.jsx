/*
 * Copyright 2023 AKKA Technologies and LAAS-CNRS (joel.tari@akka.eu)
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
import './TrajectoryGraph.css'
import { createMemo, createEffect, onMount, createSignal, untrack } from "solid-js"
// REFACTOR_SEVERAL_GRAPHS: these imports stays (mind the name of css file)

import { GraphData } from "./stores/GraphData"
import AxesWithScales from "./components/AxesWithScales"
import TicksGrid from "./components/TicksGrid"
import { boundingBoxOfInterest, setBoundingBoxOfInterest, bounding_box_centering_view_transform } from "./stores/BoundingBoxOfInterest"
import { CarlitVizUI_opts, setCarlitVizUI_opts } from "./stores/CarlitVizUI"
// REFACTOR_SEVERAL_GRAPHS: these imports stays

// import { DummyTurnkeyVertices, DummyTurnkeyFactors, DummyTurnkeyCovariances } from "./stores/dummy_turnkey_graph"
import { join_enter_covariance, join_update_covariance } from "./update_patterns/covariances"
import { get_graph_bbox, mean_distance_neighbours, median_distance_neighbours} from "./update_patterns/graph_analysis"
import { join_enter_vertex, join_update_vertex, path_pose } from "./update_patterns/vertices"
import { join_enter_factor as join_enter_arrow, join_update_factor as join_update_arrow, join_exit_factor as join_exit_arrow } from "./update_patterns/arrows"
import {  objectify_marginals, objectify_factors, compute_separator_set, compute_factor_set,  estimation_data_massage } from "./update_patterns/graph_massage"
// REFACTOR_SEVERAL_GRAPHS: these import goes in graph-group
import toast from 'solid-toast';
// chroma-js for some color effect
import chroma from "chroma-js";

//------------------------------------------------------------------//
//                            component                             //
//------------------------------------------------------------------//
function TrajectoryGraph(props){
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
    const graph = JSON.parse(JSON.stringify(GraphData()));
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
    const canonical_base_unit = median_distance_neighbours(graph)/10;
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

  // ********
  // Start definition of UI values
  // ********
  // the basic dimension around which all other are defined
  const appliedUnitGraph = createMemo(()=>{
    const {unit_base} = processGraphData();
    // console.log(`unit base: ${unit_base}`);
    // console.log(`declutter coefficient: ${declutterCoefficient()}`)
    return declutterCoefficient()*unit_base*2.4;
  });
  // REFACTOR_SEVERAL_GRAPHS: this goes in graph-group but GoI might be needed (or do the GoI condition in the prop)
  //                          i.e. we just want to declutter the GoI graph not the others
  // TODO: 
  const appliedUnitGraphCoef=1;
  const vertexStrokeCoef=0.12;
  const vertexFontSizeCoef=0.75;
  const vertexStrokeColor= ()=> "#222"; // "#212F3C";
  const vertexFill=()=> "#CDC7A3"; 
  const edgeStrokeWidthCoef=0.4;
  const edgeStrokeColor=()=> "#5B6F92";  // "black" for videos
  const covarianceStrokeWidthCoef=0.04
  // ********
  // End: definition of UI values
  // ********

  // stroke
  const vertexStrokeWidth = () => appliedUnitGraph()*vertexStrokeCoef; // TODO: memo
  const vertexFontSize = () => appliedUnitGraph()*vertexFontSizeCoef;
  // edge
  const edgeWidth = ()=> appliedUnitGraph()*edgeStrokeWidthCoef; // TODO: worth it to make it a memo ?
  // marker (using chroma)
  const chromaMarkerScale= ()=> chroma.scale([edgeStrokeColor(),vertexStrokeColor()]).mode('lch').colors(10)[3];
  // covariance
  const covarianceStrokeWidth = () => appliedUnitGraph()*covarianceStrokeWidthCoef;
  // extended vertex radius
  const extendedVertexRadius = () => vertexStrokeWidth()/2+appliedUnitGraph();


  onMount(() =>{
    // register d3 selections (those element contents will be under d3 jurisdiction, not solidjs)
    d3selections.svg = d3.select("svg.trajectory-graph");
    // d3selections.grid = d3.select("svg#TrajectoryGraph g.grid");
    // d3selections.axesScales = d3.select("svg#TrajectoryGraph g.axes-scales");
    d3selections.graph= d3.select("svg.trajectory-graph g.gTrajectoryGraph");
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
      //   d3.select('g.gTrajectoryGraph')
      //     .transition().duration(1500)
      //     .attr("transform",transform);
      // }
      // else 
      d3.select('g.gTrajectoryGraph').attr("transform",e.transform);
      // record current transform for scales/axes/grid reactivity
      setZoomTransform(e.transform);
    }
    // REFACTOR_SEVERAL_GRAPHS: this paragraph stays here, mind the .gTrajectoryGraph name

    
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
      // const gzt = graphZoomTransform();  // TODO: make that choice (automove/dont) an option from props
      const gzt = untrack(graphZoomTransform); // only on init, camera doesn't move automatically afterwards

      const {w, h} = untrack(svgSize);;
      const [mx, Mx, my, My] = untrack(boundingBoxOfInterest);
      // console.log(`bbox:      [${[mx, Mx, my, My]}]`)

      d3selections.svg
        .transition("zt").duration(firstMountTime? 0:props.dt).ease(d3.easeLinear)
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
      const duration_entry = props.dt/3;  // TODO: this is a UI option (should be untracked
                                    // so as to not trigger reactivity)
      const duration_update = props.dt*2/3;
      // // TODO: replace this covariance condition by UI option (untracked as well)
      // //       going forward, the data header will no longer have an 'exclude' field
      // // if (false)
      // if (graph.header.exclude == null || ! graph.header.exclude.includes('covariance'))
      // {
      //   d3selections.graph
      //     .select("g.covariances-group")
      //     .selectAll(".covariance")
      //     .data(graph.marginals, (d)=> d.var_id)
      //     .join(join_enter_covariance(duration_entry), join_update_covariance(duration_update)); // TODO: exit covariance
      // }

      d3selections.graph
        .select("g.directed-edges-group")
        .selectAll(".factor")
        .data(graph.factors, (d) => d.factor_id)
      // quirk if the appliedUnitGraph change (ie due to UI input to declutter), the proper
      // way to resize existing node is to do it through the update selection function
        .join(join_enter_arrow(extendedVertexRadius(),edgeWidth(),d3selections.tooltip,duration_entry), join_update_arrow(extendedVertexRadius(),edgeWidth(),duration_update) /* join_exit_factor */);
      d3selections.graph
        .select("g.vertices-group")
        .selectAll(".vertex")
        .data(graph.marginals, (d)=> d.var_id)
        .join(join_enter_vertex(appliedUnitGraph(),vertexStrokeWidth(),d3selections.tooltip,duration_entry),join_update_vertex(appliedUnitGraph(),vertexStrokeWidth(),duration_update));
      // REFACTOR_SEVERAL_GRAPHS: move this paragraph to graph-group
    });

  })

  // style="transform: matrix(1, 0, 0, -1, 0, 0);" equiv to scaleY(-1)
  // console.log(`appliedUnitGraph:  ${appliedUnitGraph()}`)



  // markers
  const markerHeight =()=> edgeWidth()*3;           // (same as width perpendicular to the 'line' direction)
  const markerWidth =()=> markerHeight()*(1+Math.sqrt(5))/2; // golden ratio
  const markerRefX =()=> appliedUnitGraph() + markerWidth() + 0.06*appliedUnitGraph();// vertexStrokeWidth()/2);
  const markerRefY =()=> markerHeight()/2;

  // REFACTOR_SEVERAL_GRAPHS: solidjs control flow depending on data + calls to graph group components
  const displayGrids = true;
  return (
  <svg class="trajectory-graph" id={props.id}>
    <defs>
      <marker id="arrowVee" 
        markerUnits="strokeWidth"
        markerWidth={3*1.618}  
        markerHeight="3" 
        refX="0" 
        refY="1.5" 
        orient="auto" 
        fill={chromaMarkerScale()}>
          <polygon
            points={`0 0, ${3*1.618} 1.5, 0 3`} 
          />
      </marker>
      <marker id="arrowmark" 
        markerUnits="userSpaceOnUse"
        markerWidth={markerWidth()} 
        markerHeight={markerHeight()}
        // refX={markerRefX()}
        refX="0" 
        refY={markerRefY()} 
        orient="auto" >
          <polygon
            points={`0 0, ${markerWidth()} ${markerHeight()/2}, 0 ${markerHeight()}`} 
          />
      </marker>
    </defs>
    <Show when={displayGrids}>
      <TicksGrid 
        svgClass={"trajectory-graph"}
        adjustedScales={adjustedScales()} 
        svgId={props.id}
        svgSize={svgSize()} 
        invertText={true}
        gridOpacity={"50%"}
      />
    </Show>
    <g class="gTrajectoryGraph">
      <g class="covariances-group"
        style="display: inherit"
        stroke-width={covarianceStrokeWidth()}
        stroke="#aaa"
        fill="none">
      </g>
      <g class="directed-edges-group"
        stroke={edgeStrokeColor()}
        stroke-width={edgeWidth()}
        fill="grey">
      </g>
      <g class="vertices-group"
        font-size={vertexFontSize()} 
        stroke-width={vertexStrokeWidth()} 
        stroke={vertexStrokeColor()}
        style={`text-anchor: middle;font-family: monospace;dominant-baseline: middle; cursor: pointer;fill: ${vertexFill()}`}
        >
      </g>
    </g>
    <Show when={displayGrids}>
      <AxesWithScales 
        svgClass={"trajectory-graph"}
        svgId={props.id}
        adjustedScales={adjustedScales()} 
        svgSize={svgSize()}/>
    </Show>
  </svg>
  )
}

export default TrajectoryGraph;
