# SlamViz

A visualization system of graphical models for back-end SLAM applications.

## Upcoming features/fixes:

- doc on the `.json` compatible structure

- make it an Electron app (or Tauri but later):
  - graph comes as file argument or fed via stdin
  - graph spawns an MQTT listener with the argument `--listen`

- router:
  - spy matrices
  - dual page: with synchronized hover effect (hover on x1 in the FG highlights
    x1 in clique tree as well)

- UI: right-side retractable panel
  - General: have MQTT options
  - FG:
    - covariance on/off
    - grid on/off
    - axes on/off
    - export-svg button
    - reset graph-centric pan/zoom
    - agent graph selection (if several graphs): GoI
  - Clique tree:
    - force
    - stop mouse drag
    - change alpha/freeze simu (by setting restarting alpha to 0)
    - export-svg button
    - button to display directed arrow with message passing cost instead of separator (difficult)
    - agent selection (at first only displays one)

- Features:
  - FG:
    - PDAG
    - multi edges (factors that have the same scope), they are curren
    - additional info in factor tootip: residual, measure value (when available)
    - multiple graphs (multi agents systems)
  - Clique Tree:
    - click to set a clique as root with a red stroke (then message passing
      informations gets displayed on hover)
    - factors highlights
    - update effect
    - multiple cliques trees in multi agents system (? not sure if this is a good idea)
    - clique hover tooltip (1): text on: sizes, message passing cost ect...
    - clique hover tooltip (2): mini induced-factor graph Would be fun, but
      build it lazily because that would require to query the data in the
      "factors" and "marginals" part. Also, it would be a force graph. Fill-in
      edges would be lazily computed and added on the mini factor graph.
    - clique hover tooltip (3): matrix of the clique (if under a threshold size)
    - more info in variable tooltip: list of cliques it intervenes in, related
      factors (also highlight those in a another color)
    - more info in factor tooltip: variables, possible cliques it could be in (would be interesting)
    - tooltip: introduce a delay on hover before showing all informations

- history chart (involve the UI)

- sticky notify receding tooltips when new data (all displayed)

- GPU for really big graphs (difficult, needs knowledge in webgpu)

- katex

- drag and drop data

- loading scenario for timecut

## Known bugs

- if data missing in `cliques`, can't open the menu to leave the `/cliquetree` url
- fix interrupted transitions (when time between new data is smaller than d3 transitions)
