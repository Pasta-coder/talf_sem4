// ===== INTERACTIVE STATE GRAPH VISUALIZATION =====

class GraphVisualization {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.svg = null;
    this.nodes = [];
    this.edges = [];
    this.dragging = null;
    this.dragOffset = { x: 0, y: 0 };
    this.currentState = null;
    this.lastTransition = null;
    this.globalLearningMode = true;
    this.machine = null;
    this.expandedEdges = new Set();
    // Compact spacing: reduced virtual canvas to bring nodes closer
    this.vWidth = 1000;
    this.vHeight = 480;
    this.pan = { x: 0, y: 0 };
    this.scale = 1;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this._init();
  }

  _init() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', `0 0 ${this.vWidth} ${this.vHeight}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.style.cursor = 'grab';
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    this.container.appendChild(this.svg);

    // Defs for markers and filters
    const defs = this._createDefs();
    this.svg.appendChild(defs);

    // Main group for pan/zoom
    this.mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.mainGroup.setAttribute('id', 'graph-main');
    this.svg.appendChild(this.mainGroup);

    // Edge group (behind nodes)
    this.edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.mainGroup.appendChild(this.edgeGroup);

    // Node group
    this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.mainGroup.appendChild(this.nodeGroup);

    // Leader line group (connector lines from cards to edge anchors)
    this.leaderGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.mainGroup.appendChild(this.leaderGroup);

    // Callout layer via SVG foreignObject (participates in pan/zoom transform)
    this.calloutFO = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    this.calloutFO.setAttribute('x', '0');
    this.calloutFO.setAttribute('y', '0');
    this.calloutFO.setAttribute('width', this.vWidth);
    this.calloutFO.setAttribute('height', this.vHeight);
    this.calloutFO.setAttribute('pointer-events', 'none');
    this.calloutFO.style.overflow = 'visible';

    this.calloutContainer = document.createElement('div');
    this.calloutContainer.className = 'callout-layer';
    this.calloutFO.appendChild(this.calloutContainer);
    this.mainGroup.appendChild(this.calloutFO);

    this._setupEvents();
  }

  _createDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Arrow marker (dim)
    defs.appendChild(this._makeArrowMarker('arrow', '#94a3b8'));
    // Arrow marker (active/bright)
    defs.appendChild(this._makeArrowMarker('arrow-active', '#10b981'));
    // Arrow marker (initial)
    defs.appendChild(this._makeArrowMarker('arrow-init', '#064e3b'));

    // Glow filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'glow');
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    const feGaussian = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussian.setAttribute('stdDeviation', '5');
    feGaussian.setAttribute('result', 'coloredBlur');
    filter.appendChild(feGaussian);
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    ['coloredBlur', 'SourceGraphic'].forEach(src => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      node.setAttribute('in', src);
      feMerge.appendChild(node);
    });
    filter.appendChild(feMerge);
    defs.appendChild(filter);

    // Active gradient (forest green → mint green)
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'activeGrad');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    [['0%', '#10b981'], ['100%', '#064e3b']].forEach(([off, col]) => {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s.setAttribute('offset', off);
      s.setAttribute('stop-color', col);
      grad.appendChild(s);
    });
    defs.appendChild(grad);

    return defs;
  }

  _makeArrowMarker(id, color) {
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', id);
    marker.setAttribute('viewBox', '0 0 10 6');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M 0 0 L 10 3 L 0 6 z');
    p.setAttribute('fill', color);
    marker.appendChild(p);
    return marker;
  }

  _setupEvents() {
    // Pan via mouse drag on background
    this.svg.addEventListener('mousedown', (e) => {
      if (e.target === this.svg || e.target.closest('#graph-main') === this.mainGroup && !e.target.closest('.node-group')) {
        if (!this.dragging) {
          this.isPanning = true;
          this.panStart = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
          this.svg.style.cursor = 'grabbing';
        }
      }
    });

    // Background click: collapse any expanded callout cards
    this.svg.addEventListener('click', (e) => {
      if (e.target === this.svg || (e.target.closest('#graph-main') === this.mainGroup
          && !e.target.closest('.node-group'))) {
        if (this.expandedEdges.size > 0) {
          this.expandedEdges.clear();
          this._renderCallouts();
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning && !this.dragging) {
        this.pan.x = e.clientX - this.panStart.x;
        this.pan.y = e.clientY - this.panStart.y;
        this._applyTransform();
        return;
      }
      if (this.dragging) {
        // Convert screen coords to SVG virtual coords
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(this.mainGroup.getScreenCTM().inverse());
        this.dragging.x = svgPt.x - this.dragOffset.x;
        this.dragging.y = svgPt.y - this.dragOffset.y;
        this._render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.dragging = null;
      this.svg.style.cursor = 'grab';
    });

    // Zoom via scroll — max zoom capped to prevent blurry single-node graphs
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      this.scale = Math.max(0.25, Math.min(this.MAX_ZOOM, this.scale * delta));
      this._applyTransform();
    }, { passive: false });
  }

  _applyTransform() {
    const cx = this.vWidth / 2;
    const cy = this.vHeight / 2;
    this.mainGroup.setAttribute('transform',
      `translate(${cx + this.pan.x}, ${cy + this.pan.y}) scale(${this.scale}) translate(${-cx}, ${-cy})`
    );
  }

  // ===== AUTO-FIT: Zoom & pan so all nodes fill the container =====
  // MAX_ZOOM prevents a 1-node graph from scaling into a giant blurry circle
  get MAX_ZOOM() { return 1.6; }

  fitToView() {
    if (this.nodes.length === 0) return;

    // 1. Compute the bounding box of all node centres
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of this.nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    }

    // 2. Inflate the bbox to account for node radii, callout cards, and self-loop arcs
    //    — self-loops extend ~80px above a node; callouts hang ~60px beyond edges
    const INFLATE = 100; // generous margin for label cards
    minX -= INFLATE;
    minY -= INFLATE;
    maxX += INFLATE;
    maxY += INFLATE;

    const bboxW = maxX - minX;
    const bboxH = maxY - minY;

    // 3. Determine the optimal scale
    //    Scale to fill the virtual canvas with 10% padding on each side
    const padFrac = 0.10;                      // 10 % padding
    const usableW = this.vWidth  * (1 - 2 * padFrac);
    const usableH = this.vHeight * (1 - 2 * padFrac);

    // Pick the smaller axis ratio so everything fits
    let newScale = Math.min(usableW / bboxW, usableH / bboxH);

    // 4. Clamp: never zoom in beyond MAX_ZOOM (avoids giant blurry nodes)
    //           never zoom out beyond 0.25 (avoids tiny speck graphs)
    newScale = Math.max(0.25, Math.min(this.MAX_ZOOM, newScale));

    // 5. Centre the bbox midpoint on the canvas midpoint
    //    _applyTransform: translate(cx+panX, cy+panY) scale(s) translate(-cx,-cy)
    //    For world-point bboxC to map to canvasC:
    //      panX = -(bboxCx - canvasCx) * scale
    const bboxCx  = (minX + maxX) / 2;
    const bboxCy  = (minY + maxY) / 2;
    const canvasCx = this.vWidth  / 2;
    const canvasCy = this.vHeight / 2;

    this.scale = newScale;
    this.pan.x = -(bboxCx - canvasCx) * newScale;
    this.pan.y = -(bboxCy - canvasCy) * newScale;

    this._applyTransform();
  }

  // ===== BUILD GRAPH FROM MACHINE =====
  buildGraph(machine) {
    const states = machine.getAllStates();
    const config = machine.config;
    const W = this.vWidth;
    const H = this.vHeight;
    const NODE_R = 30;

    this.nodes = [];

    // Layout: horizontal for ≤ 8, circular otherwise
    // Compact spacing: nodes 180-200 apart so callout cards have some room without excess empty space
    if (states.length <= 8) {
      const spacing = Math.min(180, (W - 200) / Math.max(states.length - 1, 1));
      const startX = W / 2 - ((states.length - 1) * spacing) / 2;
      states.forEach((state, i) => {
        this.nodes.push({
          id: state,
          x: startX + i * spacing,
          y: H / 2 + (states.length > 3 ? (i % 2 === 0 ? 40 : -40) : 0),
          radius: NODE_R,
          isAccept: config.acceptStates.includes(state),
          isReject: config.rejectStates?.includes(state) || false,
          isInitial: state === config.initialState,
          label: state,
          description: config.stateDescriptions?.[state] || ''
        });
      });
    } else {
      const radius = Math.min(W, H) * 0.33;
      states.forEach((state, i) => {
        const angle = (2 * Math.PI * i) / states.length - Math.PI / 2;
        this.nodes.push({
          id: state,
          x: W / 2 + radius * Math.cos(angle),
          y: H / 2 + radius * Math.sin(angle),
          radius: NODE_R,
          isAccept: config.acceptStates.includes(state),
          isReject: config.rejectStates?.includes(state) || false,
          isInitial: state === config.initialState,
          label: state,
          description: config.stateDescriptions?.[state] || ''
        });
      });
    }

    // Build edges (group by from→to pair)
    this.edges = [];
    const edgeMap = new Map();
    for (const t of config.transitions) {
      const key = `${t.from}->${t.to}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { from: t.from, to: t.to, transitions: [], isSelfLoop: t.from === t.to });
      }
      edgeMap.get(key).transitions.push(t);
    }
    this.edges = Array.from(edgeMap.values());
    for (const edge of this.edges) {
      edge.hasBidirectional = edgeMap.has(`${edge.to}->${edge.from}`) && edge.from !== edge.to;
    }

    this.currentState = config.initialState;
    this.lastTransition = null;
    this.machine = machine;
    this.expandedEdges.clear();
    this.pan = { x: 0, y: 0 };
    this.scale = 1;
    this._render();
    // Auto-fit: zoom & pan to show all nodes with 10% padding
    this.fitToView();
  }

  _getNode(id) {
    return this.nodes.find(n => n.id === id);
  }

  // ===== RENDERING =====
  _render() {
    this.edgeGroup.innerHTML = '';
    this.nodeGroup.innerHTML = '';
    this.leaderGroup.innerHTML = '';
    for (const edge of this.edges) this._renderEdge(edge);
    for (const node of this.nodes) this._renderNode(node);
    this._renderCallouts();
  }

  _renderEdge(edge) {
    const from = this._getNode(edge.from);
    const to = this._getNode(edge.to);
    if (!from || !to) return;

    const isActive = this.lastTransition &&
      this.lastTransition.from === edge.from &&
      this.lastTransition.to === edge.to;

    const isRelevant = edge.from === this.currentState;
    const isDimmed = !this.globalLearningMode && !isRelevant && !isActive;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('edge-group');
    // Store edge identity on the SVG group for anchor lookup
    g.dataset.edgeId = `${edge.from}->${edge.to}`;
    // Dim non-relevant edges slightly but NEVER hide them
    if (isDimmed) g.style.opacity = '0.40';

    if (edge.isSelfLoop) {
      edge._mid = this._drawSelfLoop(g, from, edge, isActive);
    } else {
      edge._mid = this._drawArrow(g, from, to, edge, isActive);
    }

    // Native SVG title tooltip on hover (fallback)
    const rules = edge.transitions.map(t => {
      if (this.machine) return this.machine.formatLinzDelta(t);
      return this._compactLabel(t);
    });
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${edge.from} → ${edge.to}\n${rules.join('\n')}`;
    g.appendChild(title);

    this.edgeGroup.appendChild(g);
  }

  // ===== FLOATING CALLOUT CARDS WITH COLLISION RESOLUTION =====
  _renderCallouts() {
    this.calloutContainer.innerHTML = '';
    this.leaderGroup.innerHTML = '';
    const cardData = [];

    for (const edge of this.edges) {
      if (!edge._path) continue;

      const isActive = this.lastTransition &&
        this.lastTransition.from === edge.from &&
        this.lastTransition.to === edge.to;
      const isRelevant = edge.from === this.currentState;
      const shouldShow = this.globalLearningMode || isRelevant || isActive;
      if (!shouldShow) continue;

      const edgeId = `${edge.from}->${edge.to}`;
      const isExpanded = this.expandedEdges.has(edgeId);
      const MAX_RULES = 2;
      const allRules = edge.transitions;
      const hasOverflow = allRules.length > MAX_RULES;
      const visibleRules = isExpanded ? allRules : allRules.slice(0, MAX_RULES);

      // Build callout card
      const card = document.createElement('div');
      card.className = 'edge-callout';
      if (isActive) card.classList.add('callout-active');
      else if (isRelevant) card.classList.add('callout-relevant');

      let html = '';
      for (const t of visibleRules) {
        // Precise firing match: compare from/to AND every read symbol
        let isThisFiring = false;
        if (isActive && this.lastTransition) {
          isThisFiring = t.from === this.lastTransition.from &&
            t.to === this.lastTransition.to &&
            t.read.length === this.lastTransition.read.length &&
            t.read.every((r, i) => r === this.lastTransition.read[i]) &&
            t.write.length === this.lastTransition.write.length &&
            t.write.every((w, i) => w === this.lastTransition.write[i]);
        }
        html += `<div class="callout-rule${isThisFiring ? ' rule-firing' : ''}">${this._formatCompactDelta(t)}</div>`;
      }
      if (hasOverflow && !isExpanded) {
        html += `<div class="callout-more">+ ${allRules.length - MAX_RULES} more</div>`;
      } else if (hasOverflow && isExpanded) {
        html += `<div class="callout-more callout-collapse">▲ collapse</div>`;
      }
      card.innerHTML = html;

      if (hasOverflow) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.expandedEdges.has(edgeId)) {
            this.expandedEdges.delete(edgeId);
          } else {
            this.expandedEdges.add(edgeId);
          }
          this._renderCallouts();
        });
      }

      // Sliding anchor: vary t position along the edge path
      // Bidirectional pairs get offset t values to stack vertically
      let pathT = 0.5;
      if (edge.hasBidirectional) {
        pathT = (edge.from < edge.to) ? 0.35 : 0.65;
      }

      // Compute position on path + perpendicular offset
      const pathPt = this._evalPath(edge._path, pathT);
      const tangent = this._evalTangent(edge._path, pathT);
      
      let x, y;
      if (edge.isSelfLoop) {
        // Push straight UP from loop apex
        x = pathPt.x;
        y = pathPt.y - 50;
      } else {
        const PERP = 42;
        // Anchor Correction: use the stored _curveOff sign to push the card
        // to the SAME side as the actual arc curvature, preventing label swaps
        // on bidirectional edges like q1→q2 vs q2→q1.
        const curveSign = (edge._curveOff || 0) >= 0 ? 1 : -1;
        const perpSign = edge.hasBidirectional ? curveSign : 1;
        x = pathPt.x - tangent.dy * PERP * perpSign;
        y = pathPt.y + tangent.dx * PERP * perpSign;
      }

      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      this.calloutContainer.appendChild(card);

      cardData.push({
        edge, pathT, x, y,
        anchorX: pathPt.x, anchorY: pathPt.y,
        el: card, w: 0, h: 0,
        priority: isActive ? 2 : (isRelevant ? 1 : 0)
      });
    }

    // Measure actual card dimensions (DOM is now laid out)
    for (const c of cardData) {
      c.w = c.el.offsetWidth || 80;
      c.h = c.el.offsetHeight || 40;
    }

    // Run label repulsion simulation (mini-physics)
    this._runRepulsion(cardData, 10);

    // Apply final positions and draw leader lines where needed
    for (const c of cardData) {
      c.el.style.left = `${c.x}px`;
      c.el.style.top = `${c.y}px`;

      // Leader line if card drifted > 50 SVG units from its edge anchor
      const dist = Math.sqrt(
        (c.x - c.anchorX) ** 2 + (c.y - c.anchorY) ** 2
      );
      if (dist > 50) {
        this._drawLeaderLine(c.anchorX, c.anchorY, c.x, c.y);
      }
    }
  }

  // ===== PARAMETRIC PATH EVALUATION (sliding anchor) =====
  _evalPath(path, t) {
    if (path.type === 'line') {
      return {
        x: path.p0.x + t * (path.p1.x - path.p0.x),
        y: path.p0.y + t * (path.p1.y - path.p0.y)
      };
    } else if (path.type === 'quad') {
      const u = 1 - t;
      return {
        x: u * u * path.p0.x + 2 * u * t * path.p1.x + t * t * path.p2.x,
        y: u * u * path.p0.y + 2 * u * t * path.p1.y + t * t * path.p2.y
      };
    } else if (path.type === 'cubic') {
      const u = 1 - t;
      return {
        x: u*u*u * path.p0.x + 3*u*u*t * path.p1.x + 3*u*t*t * path.p2.x + t*t*t * path.p3.x,
        y: u*u*u * path.p0.y + 3*u*u*t * path.p1.y + 3*u*t*t * path.p2.y + t*t*t * path.p3.y
      };
    }
    return { x: 0, y: 0 };
  }

  _evalTangent(path, t) {
    const dt = 0.01;
    const a = this._evalPath(path, Math.max(0, t - dt));
    const b = this._evalPath(path, Math.min(1, t + dt));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { dx: dx / len, dy: dy / len };
  }

  // ===== LABEL REPULSION — SIMULATED ANNEALING =====
  _runRepulsion(cards, iterations) {
    const PAD = 6;

    for (let iter = 0; iter < iterations; iter++) {
      // Card-to-card repulsion
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const a = cards[i];
          const b = cards[j];

          // AABB overlap test with padding
          const aL = a.x - a.w / 2 - PAD, aR = a.x + a.w / 2 + PAD;
          const aT = a.y - a.h / 2 - PAD, aB = a.y + a.h / 2 + PAD;
          const bL = b.x - b.w / 2 - PAD, bR = b.x + b.w / 2 + PAD;
          const bT = b.y - b.h / 2 - PAD, bB = b.y + b.h / 2 + PAD;

          if (aR > bL && aL < bR && aB > bT && aT < bB) {
            // Overlap detected — push apart along axis of least overlap
            const overlapX = Math.min(aR - bL, bR - aL);
            const overlapY = Math.min(aB - bT, bB - aT);

            // Higher-priority cards (active/relevant) move less
            const aShare = a.priority >= b.priority ? 0.3 : 0.7;

            if (overlapX < overlapY) {
              const push = overlapX / 2 + 3;
              const sign = a.x <= b.x ? -1 : 1;
              a.x += sign * push * aShare;
              b.x -= sign * push * (1 - aShare);
            } else {
              const push = overlapY / 2 + 3;
              const sign = a.y <= b.y ? -1 : 1;
              a.y += sign * push * aShare;
              b.y -= sign * push * (1 - aShare);
            }
          }
        }
      }

      // Card-to-node repulsion (keep labels away from state circles)
      for (const card of cards) {
        for (const node of this.nodes) {
          const dx = card.x - node.x;
          const dy = card.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = node.radius + Math.max(card.w, card.h) / 2 + 12;

          if (dist < minDist) {
            const push = (minDist - dist) + 5;
            card.x += (dx / dist) * push;
            card.y += (dy / dist) * push;
          }
        }
      }
    }
  }

  // ===== LEADER LINES (faint connector from card to edge anchor) =====
  _drawLeaderLine(ax, ay, cx, cy) {
    const line = this._svgEl('line');
    line.setAttribute('x1', ax);
    line.setAttribute('y1', ay);
    line.setAttribute('x2', cx);
    line.setAttribute('y2', cy);
    line.setAttribute('stroke', '#cbd5e1');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '4 3');
    line.setAttribute('opacity', '0.45');
    this.leaderGroup.appendChild(line);
  }

  // Ultra-compact 3-line 'Micro-Linz' delta (tall & thin, not wide)
  _formatCompactDelta(t) {
    const sym = (s) => s === 'B' ? '□' : s;
    const reads = t.read.map(sym).join(', ');
    const writes = t.write.map(sym).join(', ');
    const moves = t.move.join(', ');
    return `<span class="cl-state">δ(${t.from}, ${reads})</span><span class="cl-arrow">→</span><span class="cl-action">(${t.to}, ${writes}, ${moves})</span>`;
  }

  // ===== EDGE DRAWING =====
  _drawSelfLoop(g, node, edge, isActive) {
    const r = node.radius;
    const cx = node.x;
    const topY = node.y - r;

    // Bezier loop above node
    const sx = cx - 14;
    const sy = topY + 2;
    const ex = cx + 14;
    const ey = topY + 2;
    const cp1x = cx - 48;
    const cp1y = topY - 65;
    const cp2x = cx + 48;
    const cp2y = topY - 65;

    const path = this._svgEl('path');
    path.setAttribute('d', `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', isActive ? '#10b981' : '#cbd5e1');
    path.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
    path.setAttribute('marker-end', `url(#${isActive ? 'arrow-active' : 'arrow'})`);
    if (isActive) path.classList.add('edge-pulse');
    g.appendChild(path);

    // Hitbox for easier hover interaction
    const hitPath = path.cloneNode();
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '25');
    hitPath.removeAttribute('marker-end');
    if (isActive) hitPath.classList.remove('edge-pulse');
    g.appendChild(hitPath);

    // Store parametric path data for sliding anchor positions
    edge._path = {
      type: 'cubic',
      p0: { x: sx, y: sy }, p1: { x: cp1x, y: cp1y },
      p2: { x: cp2x, y: cp2y }, p3: { x: ex, y: ey }
    };
    // Return midpoint for initial callout anchor
    return { x: cx, y: topY - 85 };
  }

  _drawArrow(g, from, to, edge, isActive) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    const startPad = from.radius + 2;
    const endPad = to.radius + 2;
    const sx = from.x + nx * startPad;
    const sy = from.y + ny * startPad;
    const ex = to.x - nx * endPad;
    const ey = to.y - ny * endPad;

    // Anchor Correction: Deterministic curve direction for bidirectional edges.
    // The lexicographically "lesser" from-state always curves +30 (left),
    // the other always curves -30 (right). This ensures q1→q2 and q2→q1
    // arcs never collide, and their callout cards anchor to the correct arc.
    let curveOff = 0;
    if (edge.hasBidirectional) {
      curveOff = (edge.from < edge.to) ? 30 : -30;
    }
    // Store curveOff on the edge for callout anchor resolution
    edge._curveOff = curveOff;

    const absCurveOff = Math.abs(curveOff);
    const mx = (sx + ex) / 2 - ny * curveOff;
    const my = (sy + ey) / 2 + nx * curveOff;

    const path = this._svgEl('path');
    path.setAttribute('d', absCurveOff ? `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}` : `M ${sx} ${sy} L ${ex} ${ey}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', isActive ? '#10b981' : '#cbd5e1');
    path.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
    path.setAttribute('marker-end', `url(#${isActive ? 'arrow-active' : 'arrow'})`);
    if (isActive) path.classList.add('edge-pulse');
    g.appendChild(path);

    // Hitbox for easier hover interaction
    const hitPath = path.cloneNode();
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '25');
    hitPath.removeAttribute('marker-end');
    if (isActive) hitPath.classList.remove('edge-pulse');
    g.appendChild(hitPath);

    // Store parametric path data for sliding anchor positions
    if (absCurveOff) {
      edge._path = {
        type: 'quad',
        p0: { x: sx, y: sy }, p1: { x: mx, y: my }, p2: { x: ex, y: ey }
      };
    } else {
      edge._path = {
        type: 'line',
        p0: { x: sx, y: sy }, p1: { x: ex, y: ey }
      };
    }
    // Return midpoint with perpendicular offset for initial anchor
    const PERP_OFFSET = absCurveOff ? 25 : 50;
    return { x: mx + ny * PERP_OFFSET, y: my - nx * PERP_OFFSET };
  }

  // ===== NODE RENDERING =====
  _renderNode(node) {
    const isActive = node.id === this.currentState;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node-group');
    g.style.cursor = 'pointer';

    // Initial state arrow
    if (node.isInitial) {
      const line = this._svgEl('line');
      line.setAttribute('x1', node.x - node.radius - 32);
      line.setAttribute('y1', node.y);
      line.setAttribute('x2', node.x - node.radius - 3);
      line.setAttribute('y2', node.y);
      line.setAttribute('stroke', '#064e3b');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrow-init)');
      g.appendChild(line);

      g.appendChild(this._svgText(node.x - node.radius - 36, node.y - 8, 'START', '#064e3b', '7.6', 'end'));
    }

    // Accept state: double circle
    if (node.isAccept) {
      const outer = this._svgEl('circle');
      outer.setAttribute('cx', node.x);
      outer.setAttribute('cy', node.y);
      outer.setAttribute('r', node.radius + 5);
      outer.setAttribute('fill', 'none');
      outer.setAttribute('stroke', isActive ? '#10b981' : '#047857');
      outer.setAttribute('stroke-width', '2');
      outer.setAttribute('stroke-dasharray', '4 2');
      if (isActive) outer.setAttribute('filter', 'url(#glow)');
      g.appendChild(outer);
    }

    // Reject state: X-marked outer ring
    if (node.isReject) {
      const outer = this._svgEl('circle');
      outer.setAttribute('cx', node.x);
      outer.setAttribute('cy', node.y);
      outer.setAttribute('r', node.radius + 5);
      outer.setAttribute('fill', 'none');
      outer.setAttribute('stroke', isActive ? '#ef4444' : '#cbd5e1');
      outer.setAttribute('stroke-width', '2');
      if (isActive) outer.setAttribute('filter', 'url(#glow)');
      g.appendChild(outer);
    }

    // Main circle
    const circle = this._svgEl('circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.radius);
    if (isActive && node.isReject) {
      circle.setAttribute('fill', 'rgba(239, 68, 68, 0.15)');
      circle.setAttribute('stroke', '#ef4444');
      circle.setAttribute('stroke-width', '2.5');
      circle.setAttribute('filter', 'url(#glow)');
    } else if (isActive) {
      circle.setAttribute('fill', 'url(#activeGrad)');
      circle.setAttribute('stroke', '#10b981');
      circle.setAttribute('stroke-width', '2.5');
      circle.setAttribute('filter', 'url(#glow)');
    } else if (node.isAccept) {
      circle.setAttribute('fill', 'rgba(16, 185, 129, 0.1)');
      circle.setAttribute('stroke', '#047857');
      circle.setAttribute('stroke-width', '1.5');
    } else if (node.isReject) {
      circle.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
      circle.setAttribute('stroke', '#cbd5e1');
      circle.setAttribute('stroke-width', '1.5');
    } else {
      circle.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
      circle.setAttribute('stroke', '#cbd5e1');
      circle.setAttribute('stroke-width', '1.5');
    }
    g.appendChild(circle);

    // State label
    const label = this._svgText(node.x, node.y + 1, node.label,
      isActive ? '#fff' : (node.isAccept ? '#064e3b' : '#1e293b'), '10.8');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('font-weight', 'bold');
    g.appendChild(label);

    // Type label below
    if (node.isAccept) {
      g.appendChild(this._svgText(node.x, node.y + node.radius + 16, 'ACCEPT', '#047857', '7.2'));
    } else if (node.isReject) {
      g.appendChild(this._svgText(node.x, node.y + node.radius + 16, 'REJECT', '#ef4444', '7.2'));
    }

    // Tooltip
    if (node.description) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${node.label}: ${node.description}`;
      g.appendChild(title);
    }

    // Drag handler
    g.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(this.mainGroup.getScreenCTM().inverse());
      this.dragging = node;
      this.dragOffset = { x: svgPt.x - node.x, y: svgPt.y - node.y };
      this.svg.style.cursor = 'grabbing';
    });

    this.nodeGroup.appendChild(g);
  }

  // ===== HELPERS =====
  _svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  _svgText(x, y, text, fill, size, anchor) {
    const el = this._svgEl('text');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('text-anchor', anchor || 'middle');
    el.setAttribute('font-family', 'JetBrains Mono, monospace');
    el.setAttribute('font-size', size);
    el.setAttribute('fill', fill);
    el.textContent = text;
    return el;
  }

  _compactLabel(t) {
    if (this.machine) return this.machine.formatLinzDelta(t);
    const sym = (s) => s === 'B' ? '□' : s;
    const reads = t.read.map(sym).join(', ');
    const writes = t.write.map(sym).join(', ');
    const moves = t.move.join(', ');
    return `δ(${t.from}, ${reads}) = (${t.to}, ${writes}, ${moves})`;
  }

  // ===== PUBLIC API =====
  updateState(currentState, lastTransition) {
    this.currentState = currentState;
    this.lastTransition = lastTransition;
    this._render();
  }

  highlightTransition(t) {
    this.lastTransition = t;
    this._render();
  }

  resetHighlight() {
    this.lastTransition = null;
    this._render();
  }

  setGlobalLearningMode(enabled) {
    this.globalLearningMode = enabled;
    this._render();
  }
}
