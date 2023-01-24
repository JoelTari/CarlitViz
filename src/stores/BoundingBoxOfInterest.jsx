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
