/*
 * Copyright 2023 AKKA Technologies (joel.tari@akka.eu)
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

function PoseSE2(props){

  return (
      <path 
        d={`M ${-props.r},${.76*props.r} L ${1.82*props.r} 0 L ${-props.r},${-.76*props.r} Z`} 
        stroke={props.stroke}
        stroke-width={props["stroke-width"]} 
        fill={props.fill}/>
  )
  
}

export default PoseSE2
