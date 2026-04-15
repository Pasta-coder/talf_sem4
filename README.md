# TuringAtheneum

TuringAtheneum is a web-based **Multi-Tape Turing Machine Visualizer** built using HTML, CSS, and JavaScript.

## University Submission Details
- **Name:** Jayant Chauhan
- **Student Roll Number:** `2024UCS1552
- **Course Name:** TAFL

## Live Project
- **Deployed URL:**

## Project Overview
This project simulates a multi-tape Turing Machine in an interactive visual environment.
It helps learners understand how machine states, tape heads, transition rules, and execution flow interact in real time.

The interface is split into three major areas:
- **Left Panel:** Algorithm selection, tape configuration, machine metadata, and controls
- **Center Panel:** Transition graph + live tape visualization
- **Right Panel:** Analytics graph, execution trace, and transition table

## Objectives
- Build an intuitive visual simulator for Turing Machine behavior
- Compare execution behavior across different algorithm presets
- Demonstrate stepwise computational transitions clearly
- Provide a practical learning tool for core theory concepts

## Features
- Interactive transition graph visualization with draggable states
- Live memory tapes with active head highlighting
- Current machine node/state tracking in real time
- Step-by-step execution and continuous run mode
- Execution trace panel for transition-level debugging
- Multiple preset algorithms and configurations
- Right sidebar collapse/expand support
- Left and right panel drag-resize support with saved width
- Efficiency chart plotting input size (`n`) vs steps
- Algorithm-specific analytics reset behavior

## Controls & Interaction
- **Space:** Play / Pause execution
- **→ (Right Arrow):** Single-step execution
- **R:** Reset machine
- **Mouse Drag:** Move graph nodes
- **Mouse Scroll:** Zoom graph

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Visualization:** SVG-based custom graph rendering
- **Deployment:** GitHub Pages

## Project Structure
```text
TuringAtheneum/
├── index.html
├── css/
│   └── styles.css
└── js/
	├── app.js
	├── graph-viz.js
	├── presets.js
	└── turing-engine.js
```

## Module Description
- `index.html` → Main UI structure and layout containers
- `css/styles.css` → Complete visual styling and responsive behavior
- `js/app.js` → Core app controller, UI binding, execution flow, analytics
- `js/turing-engine.js` → Turing Machine logic (state transitions, tape operations)
- `js/graph-viz.js` → State graph rendering and interaction logic
- `js/presets.js` → Predefined machine presets and algorithm configurations

## How to Run Locally
Since this is a static web project, you can run it directly in a browser:

1. Clone/download the repository
2. Open `index.html` in your browser

For better behavior during development, use a local server (optional).

## Deployment
The project is deployed using **GitHub Pages** from the `main` branch.

Live deployment:


## Educational Value
TuringAtheneum converts abstract theoretical concepts into an interactive simulation, making it easier to:
- visualize transition functions,
- understand tape head movement,
- analyze execution complexity, and
- connect formal automata theory to practical computation.

## Future Improvements
- Add export/import for custom machine definitions
- Add step-back debugging timeline view
- Add more advanced preset problem categories
- Add dark/light theme toggle and accessibility options

