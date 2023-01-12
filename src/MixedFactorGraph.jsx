import * as d3 from "d3"
import { createMemo, createEffect, onCleanup, onMount } from "solid-js"
import { MixedFactorGraphData } from "./stores/MixedFactorGraphData"
import './MixedFactorGraph.css'

function MixedFactorGraph(){
  const svg_w = 2400;
  const svg_h = 1350;

  // reactive memo on the graph data
  const CopiedMixedFactorGraphData = createMemo(() =>{
    // TODO: perhaps massage the data here ?
    return JSON.parse(JSON.stringify(MixedFactorGraphData()))
  })

  // on mount: 
    // - affect to d3selections variable to the mounted elements
    // - zoom
    // - probably axis too
    // - simulation (irrelevant here ??) 
  const d3selections = new Object();
  onMount(() =>{
    d3selections.svg = d3.select("svg#MixedFactorGraph");

    // zoom
    d3selections.svg.call(d3.zoom().on("zoom",zoomed))
    function zoomed({transform}){
      d3.select('g.gMixedFactorGraph').attr("transform",transform)
    }
  })

  // reactive to UI: (UI options not yet imported)
  createEffect(()=>{})

  // reactive to data: CopiedMixedFactorGraphData()
  createEffect(()=>{})

  return <svg id="MixedFactorGraph" viewBox={`0 0 ${svg_w} ${svg_h}`}>
      <g class="gMixedFactorGraph">
        <rect x="50%" y="50%" width="100" height="100"/>
        <circle cx="0" cy="0" r="100"/>
      </g>
    </svg>
}

export default MixedFactorGraph;
