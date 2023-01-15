import * as d3 from "d3"
import { createMemo, createEffect, onCleanup, onMount, createSignal } from "solid-js"
import { MixedFactorGraphData } from "./stores/MixedFactorGraphData"
import './MixedFactorGraph.css'

function MixedFactorGraph(){
  const initSvgSize = { w: 1000, h: 1000 };
  const [ svgSize, setSvgSize ] = createSignal(initSvgSize);

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

    // register svg size
    setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    // re-register svg size values whenever client gets resized
    window.addEventListener("resize",()=>{
      setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    })

    const [ ZoomTransform, setZoomTransform ] = createSignal(d3.zoomIdentity);

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
    function zoomed({transform}){
      // the zoom transform is applied to factor graph group (not the whole svg)
      d3.select('g.gMixedFactorGraph').attr("transform",transform);
      setZoomTransform(transform);
    }

  })

  // reactive to UI: (UI options not yet imported)
  createEffect(()=>{})

  // reactive to data: CopiedMixedFactorGraphData()
  createEffect(()=>{})


  return <svg id="MixedFactorGraph"
    >
    <g class="grid"></g>
    <g class="axes-scales">
      <g class="Xaxis-top"></g>
      <g class="Xaxis-bottom"></g>
      <g class="Yaxis-left"></g>
      <g class="Yaxis-right"></g>
    </g>
    <g class="gMixedFactorGraph">
      <rect x="800" y="500" width="100" height="100"/>
      <circle cx="0" cy="0" r="1000" fill="none" stroke="red"/>
      <circle cx="0" cy="0" r="100" fill="none" stroke="blue"/>
    </g>
  </svg>
}

export default MixedFactorGraph;
