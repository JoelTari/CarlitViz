# SlamViz

A visualization system of graphical models for back-end SLAM applications.

## Upcoming features: 

- make it an electron app:
  - graph comes as file argument or fed via stdin
  - graph spawns an MQTT listener with the argument `--listen`

- router:
  - MFG 
  - clique tree
  - spy matrices
  - canvas of MFG ?

- UI: right-side retractable panel
  - covariance on/off
  - grid on/off
  - axes on/off
  - export-svg button
  - reset graph-centric pan/zoom
  - graph selection (if several graphs): GoI
  - router direction

- SE2 icons instead of circles keys (when relevant)

- additional in factor tootip: residual, measure value (when available)

- multiple graphs (multi agents systems)

- multi edges (factors that have the same scope)

- PDAG

- history chart (involve the UI)

- canvas simplified representation

- sticky notify receding tooltips when new data

- GPU for really big graphs (difficult)
