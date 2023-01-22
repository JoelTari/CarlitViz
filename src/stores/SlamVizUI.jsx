// component not yet used
import { createStore } from "solid-js/store";

const [SlamVizUI_opts, setSlamVizUI_opts] = createStore(
  {
    ellipse: {
      "stroke-width": 0.03,
    },
    vertex: {
      circle_radius:1,
      circle_stroke_width:0.12,
    },
    factor: {
      line_stroke_width:0.3,
      dot_radius: 0.3,
    },
  }
)

// covariance on/off
// grid on/off
// axes on/off
// export svg button
// reset graph-centric pan/zoom

// graph selection (if several)
// reset all-graph-centric pan/zoom

// router FG/clique tree/matrices (A & H)

export { SlamVizUI_opts, setSlamVizUI_opts }
