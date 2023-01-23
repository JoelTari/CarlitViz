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
