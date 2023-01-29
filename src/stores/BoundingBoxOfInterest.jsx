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

import { createSignal } from "solid-js";

const [ boundingBoxOfInterest, setBoundingBoxOfInterest ] = createSignal([]);

// util function
const bounding_box_centering_view_transform= function(bounding_box, w_svg, h_svg){
  const [mx,Mx,my,My] = bounding_box;
  // center
  const xc = (Mx+mx)/2;
  const yc = (My+my)/2;
  // margins
  const xmargin = (Mx-mx)*.2; // 20% margin on top & bot (both)
  const ymargin = (My-my)*.2; // 20% margin on L&R (both)
  const [x,X,y,Y] = [mx-xmargin,Mx+xmargin,my-ymargin,My+ymargin];
  // scale
  const ratio_svg = w_svg/h_svg;
  const ratio_bb = (Mx-mx)/(My-my);
  // if ratio graph smaller than ratio svg => scale on Y axis (otherwise we will overflow on Y)
  // if ratio graph bigger than ratio svg  => scale on X axis (otherwise we will overflow on X)
  if ( ratio_bb < ratio_svg ) return {x: xc, y: yc, k: h_svg/(Y-y)}; 
  else return {x: xc, y: yc, k: w_svg/(X-x)};
}

export { boundingBoxOfInterest, setBoundingBoxOfInterest, bounding_box_centering_view_transform } 
