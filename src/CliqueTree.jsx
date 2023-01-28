import * as d3 from "d3"
import { createMemo, createEffect, onCleanup, onMount } from 'solid-js'
// import { SlamData } from "./stores/SlamDataStore"
import { MixedFactorGraphData } from "./stores/MixedFactorGraphData"
import './CliqueTree.css'   

function CliqueTree(){

  // svg viewBox dimensions 
  // (preserveAspectRatio will trigger with 'meet xMidYMid', 
  //   hence by default it doesn't mean that your view will be 
  //   off if your viewport isn't 1600x900)
  const svg_w = 2400;
  const svg_h = 1350;

  const forces = {
    charge: d3.forceManyBody(),
    links: d3.forceLink().id(d=>d.id),
    centrifuge: d3.forceCenter(svg_w/2,svg_h/2)
  }

  //------------------------------------------------------------------//
  //                 deepcopy of the data and massage                 //
  //        Motivation the deepcopy is that d3 will modify the        //
  //         "target" and "source" fields of the elements in          //
  //         the "links" array. Even tough we only the getter         //
  //         for the data, experience has shown that the data         //
  //                           gets mutated                           //
  //------------------------------------------------------------------//
  // anybody that call CopiedSlamData will in turn get reactivity
  const CopiedSlamData = createMemo( () => {
    // adds the 'sepset' field in each link (element of 'links')
    console.log("massaging data (get the store and make a deep copy)")
    return JSON.parse(JSON.stringify(MixedFactorGraphData().cliques))
    // return MassageLinks(
    //   DeepCopiedSlamData
    // )
  })

  //------------------------------------------------------------------//
  //                           Reactive UI                            //
  //------------------------------------------------------------------//
  createEffect(() =>{
    forces.charge.distanceMax(800).strength(-5000);
    forces.links.distance(350).strength(1.5);
    forces.centrifuge.strength(1);
    console.log("Reactive CliqueTree: new UI data.")
  })


  // define a drag behavior
  const drag = (a_simulation) => {
    function dragstarted(event) {
      if (!event.active) a_simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) a_simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };


  // some empty selections (placeholders global to components)
  // they will be filled onMount
  const d3selections = new Object();

  // declare simulation
  const simulation = d3.forceSimulation()
                    .force("link", forces.links)
                    .force("charge" , forces.charge)
                    .force("center",forces.centrifuge)
                    .stop();

  // // callback for simulation events
  // simulation.on("tick", ticked);
  simulation.on("end",() => 
    console.log("CliqueTree d3-force simulation stopped")
  )

  onMount(() =>{
    // overide the empty selections
    d3selections.svg = d3.select("svg.clique-tree-graph");
    d3selections.separators = d3selections.svg.select(".gseparators")
    d3selections.cliques = d3selections.svg.select(".gcliques");
    console.log("Clique tree svg mounted.")

    // zoom
    d3selections.svg.call(d3.zoom().on("zoom",zoomed))
    function zoomed( { transform } ){
      // console.log(transform)
      // const viewbox = d3selections.svg.attr("viewBox").split(",").map(s=>parseInt(s));
      // acting on the viewBox is actually more difficult
      d3.select('g.gCliqueTree').attr("transform", transform)
    }

    const ticked=function(){
      // update links
      const separators = d3selections.separators.selectAll(".gseparator");
      separators.select("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)
      separators
        .select("text")
        .attr("x", (d) => .5*(d.source.x+d.target.x))
        .attr("y", (d) => .5*(d.source.y+d.target.y))
      // change also the position of the underlying rect that improves 
      // readability of the text
      separators
        .select("rect.readable_sepset")
            .attr("x", 
              function(d,i,n) { 
                // console.log(n[i].getAttribute("width"))
                return .5*(d.source.x+d.target.x)
                  - n[i].getAttribute("width")/2
              })
            .attr("y", 
              function(d,i,n) { 
                return .5*(d.source.y+d.target.y) 
                  - n[i].getAttribute("height")/2
              })
      // update nodes
      d3selections.cliques
        .selectAll(".gclique")
        .style("transform", (d) => `translate(${d.x}px,${d.y}px)`);
    }
    // register ticked to simulation
    simulation.on("tick",ticked);
    

    //------------------------------------------------------------------//
    //                  Reactive to data (nodes,links)                  //
    //------------------------------------------------------------------//
    createEffect(() => {

      simulation.stop()
      const MutableSlamData = JSON.parse(JSON.stringify(CopiedSlamData()));

      console.log("Fresh SLAM data (without simulation)");
      console.log(MutableSlamData.nodes)

      // source : observablehq.com/@d3/modifying-a-force-directed-graph
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      const old = new Map(
        d3selections.cliques.selectAll(".gclique").data().map(d => [d.id, d])
      );
      MutableSlamData.nodes = MutableSlamData.nodes.map(d => Object.assign(old.get(d.id) || {}, d));
      MutableSlamData.links = MutableSlamData.links.map(d => Object.assign({}, d));

      // data reactive
      // copy/replace forces.links
      // this step modify the data 
      // -it adds vx,vy,x,y to each element of "nodes" AND add pointers to these nodes in "links"
      // -if the node data has already those vx,vy,x,y quadruple (cf recycle step), then it does not
      simulation.nodes(MutableSlamData.nodes);
      simulation.force("link").links(MutableSlamData.links);
      simulation.restart();

      // forces.links = forces.links.ForceLink(links).id((d) => d.id);
        // .force("center", d3.forceCenter(width / 2, height / 2)) // strength default to 1

      // enter-update pattern on links (separators)
      d3selections.separators
        .selectAll(".gseparator")
        .data(MutableSlamData.links, (d)=> `${d.source.id}\t${d.target.id}`)
        .join(
          (enter) => {
            return enter.append("g")
            .classed("gseparator", true)
            .attr("id", (d) => d.id)
            .each( function(d){
              d3.select(this)
                .append("line")
                .attr("id",d.id)
                // .attr("x1", (d) => d.source.x)
                // .attr("y1", (d) => d.source.y)
                // .attr("x2", (d) => d.target.x)
                // .attr("y2", (d) => d.target.y);

              const septext = d3.select(this)
                .append("text")
                .text(_ => `${d.id}: `)
                .attr("id", _ => d.id)
                // .attr("x", (d) => .5*(d.source.x+d.target.x))
                // .attr("y", (d) => .5*(d.source.y+d.target.y))
                .call(function(d3t){
                  // opening bracket
                  d3t.append("tspan").text("{")

                  // TODO: put that in update, not enter
                  // compute the sepset, we use the insightful fact that 
                  // the target and source fields have been replaced by d3
                  // at this stage (under the hood) by the reference node objects
                  // (was originally the string of the node id)
                  // sauce : https://github.com/d3/d3-force#link_links
                  d.sepset = d.target.content.filter(x_var => d.source.content.includes(x_var));
                  // TODO: keep the above in update

                  // const source_clique = MutableSlamData.nodes.filter(node => node.id == d.source)[0];
                  // const target_clique = MutableSlamData.nodes.filter(node => node.id == d.target)[0];
                  // d.sepset = target_clique.content.filter(x_var => source_clique.content.includes(x_var));

                  // console.log(`[${d.id}]: source is ${source_clique}, target is ${target_clique} `)
                  d.sepset.forEach( function(sep_var_id,i,dsepset) // (element, idx, array)
                    {
                    d3t.append("tspan")
                      .attr("id",sep_var_id)
                      .text(`${sep_var_id}${i===dsepset.length-1? "":","}`)
                      .on("mouseover", (_) => {
                        d3.selectAll(`tspan#${sep_var_id}`)
                          .classed("hovering",true)
                      })
                      .on("mouseout", 
                        ()=>{
                        d3.selectAll(`tspan#${sep_var_id}`)
                          .classed("hovering",false)
                        }
                      )
                  })
                  // closing bracket
                  d3t.append("tspan").text("}")
                })
              // rect support for sepset text (readability)
              const bbox_septext = septext.node().getBBox();
              d3.select(this)
                .append("rect")
                .classed("readable_sepset", true)
                .attr("x",bbox_septext.x-bbox_septext.width/2)
                .attr("y",bbox_septext.y-bbox_septext.height/2)
                .attr("height",bbox_septext.height)
                .attr("width",bbox_septext.width)
              // raise text (the rect is supposed to be 'under' the text)
              septext.raise()



              // TODO: on hover, affect a class "hovering"
            });
            // .call(function(sel){
            //   console.log("[enter] data on separator selection");
            //   console.log(sel.data())
            //   // forces.links= d3.forceLink(sel.data())
            //   //                 .distance(forces.links.distance())
            //   //                 .strength(forces.links.strength())
            // });
          }
        );

      // enter-update pattern on nodes (cliques)
      d3selections.cliques// = d3selections.cliques
        .selectAll(".gclique")
        .data(MutableSlamData.nodes, (d)=> d.id)
        .join((enter) => {
          return enter
            .append("g")
            .classed("gclique", true)
            .attr("id", (d) => d.id)
            // .style("transform", (d) => `translate(${d.x}px,${d.y}px)`)
            .each(function (d) {
              // 0. compute text layout (cols)
              const totalFields = d.content.length + d.factors.length;
              // const cols = Math.max(1,Math.floor(Math.sqrt(totalFields)))
              const cols = 6

              let d3textgroup = d3.select(this)
                .append("g")
                .classed("cliquetext",true)

              // 0.5 add text clique id
              let d3text_cliqueid = d3textgroup
                .append("text")
                .classed("id_cliquetext",true)
                .text(`${d.id}`)

              // 1. add text variables id
              let d3text_vars = d3textgroup
                .append("text")
                .classed("vars_cliquetext",true)
                .attr("y", 16)
                .call(function(d3t) {
                  // const cols = Math.ceil(Math.sqrt(d.content.length))
                  // console.log(`${d.content.length} -> ${cols}`)
                  for (let i=0;i<d.content.length; i++){
                    d3t.append("tspan")
                    .attr("id",`${d.content[i]}`)
                    .attr("dy", _ => i%cols==0? 16:0)
                    .attr("x",_ => i%cols==0? 0:null)
                    .attr("dx",0)
                    .text(`${d.content[i]}${i==d.content.length-1?"":","}`)
                    .on("mouseover", (_) => {
                      d3.selectAll(`tspan#${d.content[i]}`)
                        .classed("hovering",true)
                      // console.log(d.content[i])
                    })
                    .on("mouseout", 
                      ()=>{
                      d3.selectAll(`tspan#${d.content[i]}`)
                        .classed("hovering",false)
                      }
                    )
                  }
                })
              // 2. add text factors id
              let d3text_factors = d3textgroup
                .append("text")
                .classed("factors_cliquetext",true)
                .attr("y", 16*2 + d.content.length/cols*16)
                .call(function(d3t){
                  for (let i=0;i<d.factors.length; i++){
                    d3t.append("tspan")
                    .attr("id",`${d.factors[i]}`)
                    .attr("dy", _ => i%cols==0? 16:0)
                    .attr("x",_ => i%cols==0? 0:null)
                    .attr("dx",0)
                    .text(`${d.factors[i]}${i==d.factors.length-1?"":","}`)
                  }
                })

              const bboxtext =  d3textgroup.node().getBBox()
              // console.log(`${d.id} :  
              //   ${bboxtext.width}, ${bboxtext.height}`)

              // 3. add a line to split variables & factors id
              const pad_addon=20;
              d3textgroup.append("line")
                .classed("cliqueid_var_split",true)
                .attr("y1", 16)
                .attr("y2", 16)
                .attr("x1", -bboxtext.width/2-pad_addon/2)
                .attr("x2", bboxtext.width/2+pad_addon/2);
              d3textgroup.append("line")
                .classed("var_factor_split",true)
                .attr("y1", 16*2 + d.content.length/cols*16)
                .attr("y2", 16*2 + d.content.length/cols*16)
                .attr("x1", -bboxtext.width/2-pad_addon/2)
                .attr("x2", bboxtext.width/2+pad_addon/2);
                
            
              // let d3text_factors = d3.select(this)
              // .append("text")
              // .text(d=> JSON.stringify(d.factors) )


              // apply transform on text
              d3textgroup
                .attr("transform",
                  `translate(0,${-bboxtext.height/2.5})`) // TODO: solve 2.5

              // 3. add the rectangle outlines the clique  
              const rectw=bboxtext.width+pad_addon;
              const recth=bboxtext.height+pad_addon;
              d3.select(this).append("rect")
              .attr("width", rectw)
              .attr("height",recth)
              .attr("x", `${-rectw/2}`)
              .attr("y", `${-recth/2}`)
              .attr("rx", `${pad_addon}`)
              .attr("ry", `${pad_addon}`)
              .lower(); // become the first child of its parent
              // otherwise rectangle conceals the text,
              // and rectangle needed text bbox

            })
          },
          (update) => { 
            return update;
          }
          // TODO: update
          // TODO: remove
        )
        .call(drag(simulation));

      // console.log("slam data AFTER merge with simu");
      // console.log(MutableSlamData.nodes[0])

      // console.log(".")
      // simulation.on("tick", ticked);
      // console.log(CopiedSlamData())
    })
  })

  // onCleanUp , stop the simulation
  onCleanup(()=>{
    console.log("CleanUp of component CliqueTree. Stopping simulation.")
    simulation.stop();  // doesn't trigger event "end"
  })


  return (
    <svg class="clique-tree-graph" viewBox={`0 0 ${svg_w} ${svg_h}`}>

      <g class="gCliqueTree">

        <g class="gseparators">
        </g>

        <g class="gcliques" >
        </g>

      </g>

    </svg>
  );
}

export default CliqueTree;

