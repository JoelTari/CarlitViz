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

// whether or not it is a canvas

// whether auto rezoom on new data somewhere (or when changing the GoI)

// many more concerns multi graph behavior
//   hide or not the not-GoI graphs

// history chart for the GoI (some sort of bottom bar)

export { SlamVizUI_opts, setSlamVizUI_opts }
