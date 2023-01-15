import * as d3 from "d3"
import { createMemo, createEffect, onCleanup, onMount, createSignal } from "solid-js"
import { MixedFactorGraphData } from "./stores/MixedFactorGraphData"
import './MixedFactorGraph.css'

function MixedFactorGraph(){

  const initSvgSize = { w: 1000, h: 1000 };
  const [ svgSize, setSvgSize ] = createSignal(initSvgSize);
  window.addEventListener("resize",()=>{
    setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});
    console.log(`client svg resize: ${svgSize().w}x${svgSize().h}`)
  })

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
    d3selections.axesScales = d3.select("svg#MixedFactorGraph g.axes-scales");

    // set svg size
    setSvgSize({w: d3selections.svg.nodes()[0].clientWidth, h: d3selections.svg.nodes()[0].clientHeight});

    console.log(`client svg size: ${svgSize().w}x${svgSize().h}`)


    // define the scales
    let sc_x = d3.scaleLinear().range([0, svgSize().w]).domain([0,svgSize().w]);
    let sc_y = d3.scaleLinear().range([0, svgSize().h]).domain([0,svgSize().h]);

    // define axes objects, associated with the scales
    const xaxis_bot = d3.axisBottom(sc_x);
    const yaxis_right = d3.axisRight(sc_y);

    createEffect(()=>{
      sc_x = d3.scaleLinear().range([0, svgSize().w]).domain([0,svgSize().w])
      sc_y = d3.scaleLinear().range([0, svgSize().h]).domain([0,svgSize().h])
      xaxis_bot.scale(sc_x);
      yaxis_right.scale(sc_y);
      console.log(`effect triggered with w=${svgSize().w}`)
      d3selections.axesScales.select(".Xaxis-top").call(xaxis_bot);
      d3selections.axesScales.select(".Yaxis-right").call(yaxis_right);
    })

    // zoom
    d3selections.svg.call(d3.zoom().on("zoom",zoomed));
    // zoom callback
    function zoomed({transform}){
      // the zoom transform is applied to factor graph group (not the whole svg)
      d3.select('g.gMixedFactorGraph').attr("transform",transform);
      // // apply transform to the scales of the axes
      const sc_xz = transform.rescaleX(sc_x);
      d3selections.axesScales.select(".Xaxis-top").call(xaxis_bot.scale(sc_xz));
      d3selections.axesScales.select(".Yaxis-right").call(yaxis_right.scale(sc_xz));
    }

  })

  // reactive to UI: (UI options not yet imported)
  createEffect(()=>{})

  // reactive to data: CopiedMixedFactorGraphData()
  createEffect(()=>{})


  return <svg id="MixedFactorGraph"
    >
    <g class="axes-scales">
      <g class="Xaxis-top"></g>
      <g class="Xaxis-bottom"></g>
      <g class="Yaxis-left"></g>
      <g class="Yaxis-right"></g>
    </g>
    <g class="gMixedFactorGraph">
      <rect x="50%" y="50%" width="100" height="100"/>
      <circle cx="0" cy="0" r="1000" fill="none" stroke="red"/>
      <circle cx="0" cy="0" r="100" fill="none" stroke="blue"/>
    </g>
  </svg>
}

export default MixedFactorGraph;
