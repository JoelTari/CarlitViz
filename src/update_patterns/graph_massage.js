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


// transform the array of marginals in an object where
// the key is the var_id
// Perf: one loop over "marginals" array
const objectify_marginals = function(marginals){
  // Expected result: object where the 'var_id' are the keys
  // Input array of where each element is an object.
  //  'var_id' is one field of each element
  
  // Procedure: isolate the var_id of each object using
  // the spread/rest operator
  return marginals
          .reduce(
            (acc,marginal)=>
              {
                const {var_id, ...rest_of_object} = marginal;
                acc[var_id]=rest_of_object;
                return acc;
              }
          ,{}
          );
}


// transform the array of factors in an object where
// the key is the factor_id
// Perf: one loop over "factors" array
const objectify_factors = function(factors){
  // Expected result: object where the 'factor_id' are the keys
  // Input array of where each element is an object.
  //  'factor_id' is one field of each element
  
  // Procedure: isolate the factor_id of each object using
  // the spread/rest operator
  return factors
          .reduce(
            (acc,factor)=>
              {
                const {factor_id, ...rest_of_object} = factor;
                acc[factor_id]=rest_of_object;
                return acc;
              }
          ,{}
          );
}

// Add a field "factor_set" for each marginal (element in the array "marginals" and entries in obj_marginals)
// It allows to have access easily to the list of factor_id a given marginal is connected with
// Perf: one loop over factors, one loop over marginals, + many access by key to obj_marginals object
// In-place method.
const compute_factor_set = function({marginals, obj_marginals, factors}){
  factors.forEach(
    f=> f.vars_id.forEach(
      node_id=> {
        // initialise empty array if field 'factor_set' doesnt exist yet
        if(obj_marginals[node_id].factor_set == undefined){
          obj_marginals[node_id].factor_set= [];
        }
        obj_marginals[node_id].factor_set.push(f.factor_id)
      }
    )
  )
  // we added the 'factor_set' in the object representation of marginals
  // now add it to the array marginals
  marginals.forEach(node => node.factor_set=obj_marginals[node.var_id].factor_set);
}

// only possible once factor_set is computed
// perf: one big loop, and one access by key inside each iteration
const compute_separator_set = function({marginals, obj_marginals, obj_factors}){
  marginals.forEach(m=>{
    const separator_set_with_duplicates=[];
    // fill separator set (duplicates possible)
    m.factor_set.forEach((factor_id)=>{
      obj_factors[factor_id].vars_id
        .filter((var_id)=>{
          return var_id !== m.var_id
        })
        .forEach((var_id)=>{
          separator_set_with_duplicates.push(var_id);
        });
    })
    // remove duplicates
    m.separator_set = [...new Set(separator_set_with_duplicates)];
    // add the separator_set in obj_marginals
    obj_marginals[m.var_id].separator_set = m.separator_set;
  })
}

// In-place method
// The graph json is supposed to have been augmented by obj_marginals, obj_factors & factor_set.
// This method comes up with spatial position for the factors, which is easy for a factor connecting
// 2 or more keys (just take the barycenter), but less trivial for a unifactor
// Perf: costly
const estimation_data_massage = function({factors: d_factors, marginals: d_marginals, obj_factors: d_obj_factors, obj_marginals: d_obj_marginals}, base_unit){
  // Data massage before integration: some data on the vertices array are needed
  // to position spatially the factors (1), and the other way around is also true (2)
  // (1) the factors need the position of the vertices (which is found in the marginals part of the data array)
  //     in order to draw the factor/edge at the right position (a line between fact-vertex)
  //     and the position of the full 'dot' representing the factor.
  d_factors.forEach((f) => {
    // put marginals data in the factors
    f.vars = f.vars_id.map((marginal_id)=> d_obj_marginals[marginal_id]);

    // automagically compute the factor position
    // For a factor involving several variables, the dot is positioned at the
    // barycenter of the variables mean position
    // Obviously (or not), for an unary factor, the factor dot position will reduce
    // to its unique associated node, which is suboptimal...
    if (f.vars_id.length > 1) {
      f.dot_factor_position = {
        x:
          f.vars_id.reduce((sum_acc, var_id) => sum_acc + d_obj_marginals[var_id].mean.x ,0 ) 
          /f.vars_id.length,// mean.x
          // f.vars.map((a_var) => a_var.mean.x).reduce((a, b) => a + b, 0) /
          // f.vars.length,
        y:
          f.vars_id.reduce((sum_acc, var_id) => sum_acc + d_obj_marginals[var_id].mean.y ,0 ) 
          /f.vars_id.length,// mean.x
          // f.vars.map((a_var) => a_var.mean.y).reduce((a, b) => a + b, 0) /
          // f.vars.length,
      };
    } else {
      // place in 5 xaxis units near the var_id (ie 5 units right of var_id in normal screen)
      f.dot_factor_position = {
        x: f.vars[0].mean.y,
        y: f.vars[0].mean.x + 5 * base_unit,
      };
    }
    // also add it in d_obj_factors
    d_obj_factors[f.factor_id].dot_factor_position=f.dot_factor_position;
  });

  // (2) This solves the problem on how to position the unary factor relative to it's
  //      (only) vertex.
  //      Assume this vertex is connected to other factors, we choose to position the unary
  //      factor in a free area around the vertex : in the center of the widest free angle
  //      available.
  //      the unary factors need the position of the neighbors of their associated node to position
  //      intuitively this factor
  //      So the proposed solution is to add a neighbors array to each vertex containing
  //      the vertices id of its neighbors.
  //      This rely on first step
  //      Seems that there is 2 cases, the node has neighbor(s) or has not (typically
  //      happens initially with the initial pose)
  d_factors
    .filter((f) => f.vars_id.length == 1) 
    // with an array of the unifactors
    .forEach((uf) => {
      // store the id of the node this unifactor connects to
      const unique_node = uf.vars_id[0];
      // subset array of factors: the other factors connected to this unique node
      // const f_neighbors_of_uf = d_factors.filter(
      //   // to be in the club of the neighbors of uf, a factor must not be uf itself AND must be connected to the 'unique node' of the unifactor
      //   (f) => (f.factor_id !== uf.factor_id) && f.vars_id.includes(unique_node)
      // ); 
      const f_neighbors_of_uf = d_obj_marginals[unique_node].factor_set.filter(fid => fid !== uf.factor_id); // and filter out the uf
      // main case: 
      if (f_neighbors_of_uf.length > 0) {
        // if there are neighbors factors, the unary factor position must be placed
        // at the biggest angle gap.

        // Get relative orientation of the neighbor factors (take the node as the center)
        // TODO: fix issue if neighbor has no dot_factor_position field
        const thetas = f_neighbors_of_uf
          .map((f_neighbor_id) =>
            Math.atan2(
              // f_neighbor.dot_factor_position.y - uf.vars[0].mean.y,
              // f_neighbor.dot_factor_position.x - uf.vars[0].mean.x
              d_obj_factors[f_neighbor_id].dot_factor_position.y - d_obj_marginals[uf.vars_id[0]].mean.y,
              d_obj_factors[f_neighbor_id].dot_factor_position.x - d_obj_marginals[uf.vars_id[0]].mean.x
            )
          )
          .sort((a, b) => a - b); // mandatory sorting

        // Find the biggest gap in the relative orientations disposition of the neighbor factors
        const thetas_2pi = thetas.map((t) => t - thetas[0]);
        const dthetas2 = thetas_2pi.map((n, i) => {
          if (i !== thetas_2pi.length - 1) {
            return thetas_2pi[i + 1] - n;
          } else return 2 * Math.PI - n;
        });
        // compute the unifactor orientation angle (wrt node) in the middle of the biggest gap
        const idx_max = indexOfMax(dthetas2);
        const theta_unary = ecpi(thetas[idx_max] + dthetas2[idx_max] / 2);

        // distance of the factor wrt the vertex.
        const squares_distances = f_neighbors_of_uf.map(
          (nf) =>
            // (nf.dot_factor_position.y - uf.vars[0].mean.y) ** 2 +
            // (nf.dot_factor_position.x - uf.vars[0].mean.x) ** 2
            (d_obj_factors[nf].dot_factor_position.y - d_obj_marginals[uf.vars_id[0]].mean.y) ** 2 +
            (d_obj_factors[nf].dot_factor_position.x - d_obj_marginals[uf.vars_id[0]].mean.x) ** 2
        );
        const u_distance = Math.sqrt(
          Math.min(25, Math.max(...squares_distances))
        );
        // TODO: place the hard-coded 5^2=25 in globalUI (same as the previous 5)

        // position of factor dot infered from polar coordinates
        const new_uf_position = {
          x: d_obj_marginals[uf.vars_id[0]].mean.x + u_distance * Math.cos(theta_unary),
          y: d_obj_marginals[uf.vars_id[0]].mean.y + u_distance * Math.sin(theta_unary),
        };
        // giving new position
        uf.dot_factor_position = new_uf_position;
      } else {
        // corner case if this unifactor's has no other factor connected
        // (= an isolated node with a single factor)
        const theta_unary = Math.PI / 2;
        const u_distance = 5;
        const new_uf_position = {
          x: d_obj_marginals[uf.vars_id[0]].mean.x + u_distance * Math.cos(theta_unary),
          y: d_obj_marginals[uf.vars_id[0]].mean.y + u_distance * Math.sin(theta_unary),
        };
        // giving new position
        uf.dot_factor_position = new_uf_position;
      }
      // also add it in d_obj_factors
      d_obj_factors[uf.factor_id].dot_factor_position=uf.dot_factor_position;
    });
}


export { objectify_marginals, objectify_factors, compute_factor_set,  estimation_data_massage, compute_separator_set}
/******************************************************************************
 *                            HELPER
 *****************************************************************************/
function arraytised(obj_or_array) {
  if (obj_or_array[Symbol.iterator] == null) {
    console.warn("received data is not an array: attempting to arraytised");
    return [obj_or_array];
  }
  // if already an array, all is gud
  else return obj_or_array;
}

function ecpi(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function indexOfMax(arr) {
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

