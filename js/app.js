// ===== MAIN APPLICATION CONTROLLER =====

class App {
  constructor() {
    this.machine = null;
    this.graph = null;
    this.playInterval = null;
    this.speed = 500; // ms per step
    this.isPlaying = false;
    this.currentPresetKey = null;
    this.currentAlgoKey = null;
    this.currentTapeConfig = null;
    this.historyStack = [];
    this.isSandboxMode = false;
    this.complexityDataPoints = []; // {n, steps} for chart
    this.analyticsHistory = []; // persistent across resets: {n, steps, result, algo, timestamp}
    this.leftSidebarWidth = this._loadLeftSidebarWidth();
    this.isRightSidebarCollapsed = false;
    this.rightSidebarExpandedWidth = this._loadRightSidebarWidth();

    this._initGraph();
    this._populateAlgorithmDropdown();
    this._bindEvents();
    this._applyLeftSidebarWidth(this.leftSidebarWidth, false);
    this._applyRightSidebarWidth(this.rightSidebarExpandedWidth, false);
    this._loadAlgorithm('palindrome');
  }

  _initGraph() {
    this.graph = new GraphVisualization('graph-container');
  }

  // ===== DYNAMIC ALGORITHM DROPDOWN WITH OPTGROUPS =====
  _populateAlgorithmDropdown() {
    const select = document.getElementById('algo-select');
    select.innerHTML = '';

    ALGORITHM_CATEGORIES.forEach(cat => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = cat.label;
      cat.algorithms.forEach(algoKey => {
        const algoData = ALGORITHM_MAP[algoKey];
        if (!algoData) return;
        const opt = document.createElement('option');
        opt.value = algoKey;
        opt.textContent = algoData.name;
        optgroup.appendChild(opt);
      });
      select.appendChild(optgroup);
    });
  }

  // ===== ALGORITHM & PRESET LOADING =====
  _loadAlgorithm(algoKey) {
    const previousAlgoKey = this.currentAlgoKey;
    this.currentAlgoKey = algoKey;
    const algoData = ALGORITHM_MAP[algoKey];
    if (!algoData) return;

    if (previousAlgoKey && previousAlgoKey !== algoKey) {
      this._resetAnalyticsForAlgorithmChange();
    }

    document.getElementById('algo-select').value = algoKey;

    this.isSandboxMode = !!algoData.isSandbox;

    // Update complexity info card
    this._updateComplexityCard(algoData);

    // Update context-aware input labels
    this._updateInputLabels(algoData);

    // Show/hide sandbox-specific UI
    this._toggleSandboxUI(this.isSandboxMode);

    // Update both tape-count inputs with the default tape count
    const tapeCountEl = document.getElementById('tape-count');
    const playgroundTapeCountEl = document.getElementById('playground-tape-count');
    const defaultConfig = algoData.tapes[algoData.tapes.length - 1];

    tapeCountEl.value = defaultConfig.count;
    if (playgroundTapeCountEl) playgroundTapeCountEl.value = defaultConfig.count;

    // For non-sandbox: set min/max to valid range
    if (!this.isSandboxMode) {
      const counts = algoData.tapes.map(t => t.count);
      tapeCountEl.min = Math.min(...counts);
      tapeCountEl.max = Math.max(...counts);
      if (playgroundTapeCountEl) {
        playgroundTapeCountEl.min = Math.min(...counts);
        playgroundTapeCountEl.max = Math.max(...counts);
      }
    } else {
      tapeCountEl.min = 1;
      tapeCountEl.max = 99;
      if (playgroundTapeCountEl) {
        playgroundTapeCountEl.min = 1;
        playgroundTapeCountEl.max = 99;
      }
    }

    this._onTapeChange(parseInt(tapeCountEl.value));
  }

  _resetAnalyticsForAlgorithmChange() {
    this.analyticsHistory = [];
    this.complexityDataPoints = [];
    this._cachedFit = null;
    this._renderAnalyticsHistory();
    this._renderAnalyticsChart();
  }

  _setRightSidebarCollapsed(collapsed) {
    this.isRightSidebarCollapsed = !!collapsed;
    const sidebar = document.getElementById('right-sidebar');
    const icon = document.getElementById('right-sidebar-collapse-icon');
    if (!sidebar) return;

    if (this.isRightSidebarCollapsed) {
      const currentWidth = parseInt(sidebar.style.width, 10) || sidebar.getBoundingClientRect().width || this.rightSidebarExpandedWidth;
      this.rightSidebarExpandedWidth = currentWidth;
    }

    sidebar.classList.toggle('right-sidebar-collapsed', this.isRightSidebarCollapsed);
    if (icon) {
      icon.textContent = this.isRightSidebarCollapsed
        ? 'keyboard_double_arrow_left'
        : 'keyboard_double_arrow_right';
    }

    if (!this.isRightSidebarCollapsed) {
      this._applyRightSidebarWidth(this.rightSidebarExpandedWidth, false);
    }
  }

  _loadRightSidebarWidth() {
    try {
      const saved = window.localStorage.getItem('turing-atheneum-right-sidebar-width');
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return Number.isFinite(parsed) ? parsed : 340;
    } catch {
      return 340;
    }
  }

  _loadLeftSidebarWidth() {
    try {
      const saved = window.localStorage.getItem('turing-atheneum-left-sidebar-width');
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return Number.isFinite(parsed) ? parsed : 275;
    } catch {
      return 275;
    }
  }

  _saveLeftSidebarWidth(width) {
    try {
      window.localStorage.setItem('turing-atheneum-left-sidebar-width', String(width));
    } catch {
      // ignore storage errors
    }
  }

  _clampLeftSidebarWidth(width) {
    const minWidth = 220;
    const maxWidth = 420;
    return Math.max(minWidth, Math.min(maxWidth, Math.round(width)));
  }

  _applyLeftSidebarWidth(width, persist = true) {
    const sidebar = document.querySelector('.left-sidebar');
    if (!sidebar) return;

    const clampedWidth = this._clampLeftSidebarWidth(width);
    this.leftSidebarWidth = clampedWidth;
    sidebar.style.width = `${clampedWidth}px`;
    sidebar.style.minWidth = `${clampedWidth}px`;

    if (persist) {
      this._saveLeftSidebarWidth(clampedWidth);
    }
  }

  _saveRightSidebarWidth(width) {
    try {
      window.localStorage.setItem('turing-atheneum-right-sidebar-width', String(width));
    } catch {
      // ignore storage errors
    }
  }

  _clampRightSidebarWidth(width) {
    const minWidth = 280;
    const maxWidth = 620;
    return Math.max(minWidth, Math.min(maxWidth, Math.round(width)));
  }

  _applyRightSidebarWidth(width, persist = true) {
    const sidebar = document.getElementById('right-sidebar');
    if (!sidebar) return;

    const clampedWidth = this._clampRightSidebarWidth(width);
    this.rightSidebarExpandedWidth = clampedWidth;

    if (!this.isRightSidebarCollapsed) {
      sidebar.style.width = `${clampedWidth}px`;
      sidebar.style.minWidth = `${clampedWidth}px`;
    }

    if (persist) {
      this._saveRightSidebarWidth(clampedWidth);
    }
  }

  _onTapeChange(count) {
    if (count < 1) count = 1;
    const algoData = ALGORITHM_MAP[this.currentAlgoKey];
    let tapeConfig = algoData.tapes.find(t => t.count === count);

    // For sandbox or if no exact match, generate a dynamic config
    if (!tapeConfig && this.isSandboxMode) {
      tapeConfig = {
        count,
        presetKey: `sandbox-${count}tape`,
        timeComplexity: 'Custom',
        tcExplanation: `Custom ${count}-tape Turing Machine`
      };
      // Dynamically generate a sandbox preset if it doesn't exist
      if (!PRESETS[tapeConfig.presetKey]) {
        PRESETS[tapeConfig.presetKey] = {
          name: `Research Laboratory (${count}-Tape)`,
          description: `A blank ${count}-tape Turing Machine. Define your own transition function δ.`,
          numTapes: count,
          timeComplexity: 'Custom',
          inputAlphabet: ['0', '1'],
          tapeAlphabet: ['0', '1', 'X', 'B'],
          blankSymbol: 'B',
          states: ['q0', 'q_acc', 'q_rej'],
          initialState: 'q0',
          acceptStates: ['q_acc'],
          rejectStates: ['q_rej'],
          defaultInput: '',
          isSandbox: true,
          stateDescriptions: {
            'q0': 'Initial state — define your transitions',
            'q_acc': 'Accept state',
            'q_rej': 'Reject state'
          },
          transitions: []
        };
      }
    } else if (!tapeConfig) {
      // Non-sandbox: clamp to closest valid tape config
      const sorted = [...algoData.tapes].sort((a, b) => Math.abs(a.count - count) - Math.abs(b.count - count));
      tapeConfig = sorted[0];
    }

    // Sync both UI inputs
    document.getElementById('tape-count').value = tapeConfig.count;
    if (document.getElementById('playground-tape-count')) {
      document.getElementById('playground-tape-count').value = tapeConfig.count;
    }

    this.currentTapeConfig = tapeConfig;
    this._updateComplexityDisplay(tapeConfig, algoData);
    this._updateEfficiencyBadge(tapeConfig, algoData);
    this._updateTopologyLabel(tapeConfig, algoData);
    this._loadPreset(tapeConfig.presetKey);
  }

  // ===== CONTEXT-AWARE INPUT LABELS =====
  _updateInputLabels(algoData) {
    const tape1Label = document.getElementById('tape1-label');
    const tape2Label = document.getElementById('tape2-label');

    if (tape1Label) {
      tape1Label.textContent = algoData.inputLabels?.tape1 || 'Tape 1 Input';
    }
    if (tape2Label) {
      tape2Label.textContent = algoData.inputLabels?.tape2 || 'Tape 2 Input (optional)';
    }
  }

  // ===== COMPLEXITY INFO CARD =====
  _updateComplexityCard(algoData) {
    const card = document.getElementById('complexity-card');
    const summaryEl = document.getElementById('complexity-card-summary');
    const benefitTextEl = document.getElementById('complexity-card-benefit-text');
    const benefitEl = document.getElementById('complexity-card-benefit');

    if (!card) return;

    if (algoData.complexityCard) {
      card.classList.remove('hidden');
      summaryEl.textContent = algoData.complexityCard.summary;
      benefitTextEl.textContent = algoData.complexityCard.benefit;
      benefitEl.style.display = 'flex';
    } else {
      card.classList.add('hidden');
    }
  }

  // ===== TIME COMPLEXITY & EFFICIENCY BADGE =====
  _updateComplexityDisplay(tapeConfig, algoData) {
    const tcEl = document.getElementById('machine-tc');
    const explanationEl = document.getElementById('tc-explanation');

    if (tcEl) {
      tcEl.textContent = `Time Complexity: ${tapeConfig.timeComplexity}`;
      tcEl.style.display = 'block';
    }
    if (explanationEl && tapeConfig.tcExplanation) {
      explanationEl.textContent = tapeConfig.tcExplanation;
      explanationEl.style.display = 'block';
    } else if (explanationEl) {
      explanationEl.style.display = 'none';
    }
  }

  _updateEfficiencyBadge(tapeConfig, algoData) {
    const badge = document.getElementById('efficiency-badge');
    const badgeText = document.getElementById('efficiency-badge-text');
    if (!badge || !badgeText) return;

    if (algoData.tapes.length <= 1) {
      badge.classList.add('hidden');
      return;
    }

    const worstTC = algoData.tapes[0].timeComplexity;
    const currentTC = tapeConfig.timeComplexity;

    if (worstTC === 'O(n²)' && currentTC === 'O(n)') {
      badge.classList.remove('hidden');
      badgeText.textContent = 'Quadratic Speedup Achieved!';
      badge.className = 'efficiency-badge efficiency-badge-quadratic';
    } else if (worstTC !== currentTC) {
      badge.classList.remove('hidden');
      badgeText.textContent = 'Improved Efficiency!';
      badge.className = 'efficiency-badge efficiency-badge-improved';
    } else {
      const bestTC = algoData.tapes[algoData.tapes.length - 1].timeComplexity;
      if (bestTC !== currentTC && algoData.tapes.length > 1) {
        badge.classList.remove('hidden');
        badgeText.textContent = 'Faster option available ↓';
        badge.className = 'efficiency-badge efficiency-badge-hint';
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  _updateTopologyLabel(tapeConfig, algoData) {
    const topologyEl = document.getElementById('graph-topology');
    if (!topologyEl) return;

    if (algoData.isMultiHead) {
      topologyEl.textContent = `Automaton Topology: Multi-Head (1 Tape, ${tapeConfig.heads || 2} Heads)`;
    } else if (tapeConfig.count === 1) {
      topologyEl.textContent = 'Automaton Topology: Single-Tape';
    } else {
      topologyEl.textContent = `Automaton Topology: ${tapeConfig.count}-Tape`;
    }
  }

  _loadPreset(key) {
    this.currentPresetKey = key;
    this._cachedFit = null; // Reset regression for new preset
    const preset = PRESETS[key];
    if (!preset) return;

    this.stop();
    this.machine = new TuringMachine(preset);

    const algoData = ALGORITHM_MAP[this.currentAlgoKey];

    // Update UI
    document.getElementById('machine-title').textContent = preset.name;
    document.getElementById('machine-desc').textContent = preset.description;

    // Guide Card logic
    const guideCard = document.getElementById('guide-card');
    const guideText = document.getElementById('guide-card-text');
    if (preset.guideText) {
      guideText.innerHTML = preset.guideText;
      guideCard.style.display = 'block';
    } else {
      guideCard.style.display = 'none';
    }

    // Handle dynamic tape input fields
    this._buildDynamicTapeInputs(preset, algoData);

    // Update editor hint for sandbox
    if (this.isSandboxMode) {
      const hintEl = document.getElementById('editor-tape-count');
      if (hintEl) hintEl.textContent = preset.numTapes;
      this._updateEditorHint(preset.numTapes);
      this._renderEditorRulesList();
      this._renderEditorStatesList();
    }

    this._resetMachine();
    this._buildRuleTable();
    this._updateStateInfo();
  }

  // ===== DYNAMIC TAPE INPUT FIELDS =====
  _buildDynamicTapeInputs(preset, algoData) {
    const container = document.getElementById('dynamic-tape-inputs');
    container.innerHTML = '';

    const numTapes = preset.numTapes;

    for (let t = 0; t < numTapes; t++) {
      const group = document.createElement('div');
      group.className = 'config-group';

      const label = document.createElement('label');
      label.className = 'config-label';
      label.setAttribute('for', `tape-input-${t}`);

      // Use algo-specific labels for tape 1 and 2 if available
      if (t === 0 && algoData?.inputLabels?.tape1) {
        label.textContent = algoData.inputLabels.tape1;
      } else if (t === 1 && algoData?.inputLabels?.tape2) {
        label.textContent = algoData.inputLabels.tape2;
      } else {
        label.textContent = `Tape ${t + 1} Input`;
      }

      const input = document.createElement('input');
      input.className = 'config-input';
      input.id = `tape-input-${t}`;
      input.type = 'text';
      input.spellcheck = false;

      // Set default values
      if (t === 0) {
        input.value = preset.defaultInput || '';
        input.placeholder = 'e.g. 10101';
      } else if (t === 1 && preset.tape2Init) {
        input.value = preset.tape2Init;
        input.placeholder = 'Enter value';
      } else {
        input.value = '';
        input.placeholder = 'Leave blank for empty';
      }

      // Hide tape2 input if it's a disabled/work tape
      if (t === 1 && algoData?.tape2Disabled) {
        group.style.display = 'none';
      }
      // Hide tapes beyond 2 if tape2Disabled (work tapes)
      if (t >= 2 && algoData?.tape2Disabled) {
        group.style.display = 'none';
      }

      // Enter key triggers reset
      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.reset();
      });

      group.appendChild(label);
      group.appendChild(input);
      container.appendChild(group);
    }
  }

  _resetMachine() {
    const numTapes = this.machine.config.numTapes;
    const algoData = ALGORITHM_MAP[this.currentAlgoKey];

    // Collect all tape inputs from dynamic fields
    const tapeInputs = [];
    for (let t = 0; t < numTapes; t++) {
      const el = document.getElementById(`tape-input-${t}`);
      tapeInputs.push(el ? el.value : '');
    }

    // Explicitly purge tape 2 input if it's considered disabled/work tape
    if (algoData && algoData.tape2Disabled && tapeInputs.length > 1) {
      tapeInputs[1] = '';
    }

    // Substring Search: build combined tape with § delimiter
    if (this.currentPresetKey === 'substring-search-multihead') {
      const fullInput = tapeInputs[0] + '§' + (tapeInputs[1] || '');
      this.machine.reset([fullInput, '']);
      this.historyStack = [];
      this.machine.heads[0] = 1;
      this.machine.heads[1] = 1;

    // Synchronized Parity: H2 at last character
    } else if (this.currentPresetKey === 'sync-parity-multihead') {
      this.machine.reset(tapeInputs);
      this.historyStack = [];
      this.machine.heads[0] = 1;
      this.machine.heads[1] = Math.max(1, tapeInputs[0].length);

    // All other algorithms: standard reset
    } else {
      this.machine.reset(tapeInputs);
      this.historyStack = [];
    }

    // Record starting data point for complexity chart
    this.complexityDataPoints = [];
    this._recordChartPoint();

    this.graph.buildGraph(this.machine);
    this._renderTapes();
    this._clearTrace();
    this._updateControls();
    this._updateStateInfo();
    this._updateStats();
    this._updateAnalytics();
    this._renderAnalyticsChart();
  }

  // ===== TAPE RENDERING =====
  _renderTapes() {
    const container = document.getElementById('tape-container');
    container.innerHTML = '';

    const state = this.machine.getState();
    const nodeEl = document.getElementById('current-node-display');
    if (nodeEl) nodeEl.textContent = state.currentState;
    const numTapes = this.machine.config.numTapes;
    const isMultiHead = this.machine.config.isMultiHead || false;
    const loopTapes = isMultiHead ? 1 : numTapes;

    for (let t = 0; t < loopTapes; t++) {
      const tape = state.tapes[t];

      const tapeRow = document.createElement('div');
      tapeRow.className = 'tape-row';

      // Tape label
      const label = document.createElement('span');
      label.className = 'tape-label';
      label.textContent = isMultiHead ? `TAPE` : `T${t + 1}`;
      tapeRow.appendChild(label);

      // Tape cells container
      const cellsWrapper = document.createElement('div');
      cellsWrapper.className = 'tape-cells-wrapper';

      const cellsContainer = document.createElement('div');
      cellsContainer.className = 'tape-cells';
      cellsContainer.id = `tape-cells-${t}`;

      for (let i = 0; i < tape.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'tape-cell';

        const activeHeads = [];
        if (isMultiHead) {
          state.heads.forEach((pos, idx) => {
            if (pos === i) activeHeads.push(idx);
          });
        } else {
          if (state.heads[t] === i) activeHeads.push(t);
        }

        if (activeHeads.length > 0) {
          cell.classList.add('tape-cell-active');
        } else if (tape[i] === this.machine.config.blankSymbol) {
          cell.classList.add('tape-cell-blank');
        }

        const symbolSpan = document.createElement('span');
        symbolSpan.className = 'tape-symbol';
        // Display □ for blank symbol in UI
        symbolSpan.textContent = tape[i] === this.machine.config.blankSymbol ? '□' : tape[i];
        cell.appendChild(symbolSpan);

        activeHeads.forEach(headIdx => {
          const headIndicator = document.createElement('div');
          headIndicator.className = 'tape-head-indicator';
          if (isMultiHead) headIndicator.classList.add(`head-idx-${headIdx}`);
          cell.appendChild(headIndicator);

          const headLabel = document.createElement('div');
          headLabel.className = 'tape-head-label tape-head-pulse';
          if (isMultiHead) {
            headLabel.textContent = `▲ H${headIdx + 1}`;
            headLabel.classList.add(`head-label-${headIdx}`);
          } else {
            headLabel.textContent = '▲ HEAD';
          }
          cell.appendChild(headLabel);
        });

        cellsContainer.appendChild(cell);
      }

      cellsWrapper.appendChild(cellsContainer);
      tapeRow.appendChild(cellsWrapper);
      container.appendChild(tapeRow);

      requestAnimationFrame(() => {
        const activeCell = cellsContainer.querySelector('.tape-cell-active');
        if (activeCell) {
          const wrapperRect = cellsWrapper.getBoundingClientRect();
          const cellRect = activeCell.getBoundingClientRect();
          const targetScroll = activeCell.offsetLeft - (wrapperRect.width / 2) + (cellRect.width / 2);
          cellsWrapper.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
      });
    }
  }

  // ===== ENHANCED EXECUTION TRACE (Linz δ notation) =====
  _addTraceEntry(result) {
    const traceContainer = document.getElementById('trace-entries');

    const entry = document.createElement('div');
    entry.className = 'trace-entry';
    if (result.event === 'ACCEPTED') entry.classList.add('trace-accept');
    if (result.event === 'REJECTED' || result.event === 'HALT_NO_TRANSITION') entry.classList.add('trace-reject');

    const header = document.createElement('div');
    header.className = 'trace-header';

    const stepBadge = document.createElement('span');
    stepBadge.className = 'trace-step';
    stepBadge.textContent = `Step ${result.step}`;

    const stateBadge = document.createElement('span');
    stateBadge.className = 'trace-state';
    stateBadge.textContent = result.fromState + (result.toState ? ` → ${result.toState}` : '');

    header.appendChild(stepBadge);
    header.appendChild(stateBadge);
    entry.appendChild(header);

    // Formal δ notation summary line
    if (result.transition) {
      const deltaDiv = document.createElement('div');
      deltaDiv.className = 'trace-delta';
      deltaDiv.textContent = this.machine.formatLinzDelta(result.transition);
      entry.appendChild(deltaDiv);
    }

    // Enhanced descriptive summary line
    if (result.transition) {
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'trace-summary';
      summaryDiv.innerHTML = this._buildTraceSummary(result);
      entry.appendChild(summaryDiv);
    }

    // Transition details
    if (result.transition) {
      const details = document.createElement('div');
      details.className = 'trace-details';
      const isMultiHead = this.machine.config.isMultiHead || false;

      for (let i = 0; i < result.readSymbols.length; i++) {
        const tapeLine = document.createElement('div');
        tapeLine.className = 'trace-tape-line';

        const sym = (s) => s === this.machine.config.blankSymbol ? '□' : s;
        const moveWord = result.movements[i] === 'R' ? 'Right' : (result.movements[i] === 'L' ? 'Left' : 'Stay');
        const labelPrefix = isMultiHead ? `H${i + 1}` : `T${i + 1}`;
        tapeLine.innerHTML = `<span class="trace-tape-label">${labelPrefix}:</span> Read <span class="trace-highlight">${sym(result.readSymbols[i])}</span> → Write <span class="trace-highlight">${sym(result.writeSymbols[i])}</span>, Move <span class="trace-move">${moveWord}</span>`;
        details.appendChild(tapeLine);
      }

      entry.appendChild(details);

      // Rule used — formal δ notation
      const rule = document.createElement('div');
      rule.className = 'trace-rule';
      rule.innerHTML = `<span class="material-symbols-outlined" style="font-size:12px">rule</span> ${this.machine.formatLinzDelta(result.transition)}`;
      entry.appendChild(rule);
    }

    // Event badges
    if (result.event === 'ACCEPTED') {
      const badge = document.createElement('div');
      badge.className = 'trace-event-badge trace-event-accept';
      badge.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check_circle</span> ACCEPTED';
      entry.appendChild(badge);
    } else if (result.event === 'REJECTED') {
      const badge = document.createElement('div');
      badge.className = 'trace-event-badge trace-event-reject';
      badge.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">cancel</span> REJECTED';
      entry.appendChild(badge);
    } else if (result.event === 'HALT_NO_TRANSITION') {
      const badge = document.createElement('div');
      badge.className = 'trace-event-badge trace-event-reject';
      badge.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">error</span> HALTED — No δ transition defined';
      entry.appendChild(badge);
    }

    traceContainer.insertBefore(entry, traceContainer.firstChild);
    traceContainer.scrollTop = 0;
  }

  // Build a human-readable summary for each trace step
  _buildTraceSummary(result) {
    const isMultiHead = this.machine.config.isMultiHead || false;
    const sym = (s) => s === this.machine.config.blankSymbol ? '□' : s;
    const parts = [];

    // State description
    parts.push(`<span class="trace-summary-state">State ${result.fromState}</span>`);

    // Read summary
    const readParts = [];
    for (let i = 0; i < result.readSymbols.length; i++) {
      const label = isMultiHead ? `Head ${String.fromCharCode(65 + i)}` : `T${i + 1}`;
      readParts.push(`${label} found <span class="trace-highlight">${sym(result.readSymbols[i])}</span>`);
    }
    parts.push(readParts.join(', '));

    // Write summary (only show if something actually changed)
    const writeParts = [];
    for (let i = 0; i < result.writeSymbols.length; i++) {
      if (result.writeSymbols[i] !== result.readSymbols[i]) {
        const label = isMultiHead ? `Head ${String.fromCharCode(65 + i)}` : `Tape ${i + 1}`;
        writeParts.push(`Writing <span class="trace-highlight">${sym(result.writeSymbols[i])}</span> to ${label}`);
      }
    }
    if (writeParts.length > 0) {
      parts.push(writeParts.join('. ') + '.');
    }

    return parts.join(': ');
  }

  _clearTrace() {
    document.getElementById('trace-entries').innerHTML = `
      <div class="trace-init">
        <span class="material-symbols-outlined" style="font-size:16px;color:#10b981">play_circle</span>
        <span>Ready to simulate. Press <strong>Step</strong> or <strong>Play</strong> to begin.</span>
      </div>
    `;
  }

  // ===== RULE TABLE (Linz δ notation — single column) =====
  _buildRuleTable() {
    const tbody = document.getElementById('rule-table-body');
    tbody.innerHTML = '';

    const transitions = this.machine.config.transitions;

    transitions.forEach((t, index) => {
      const row = document.createElement('tr');
      row.className = 'rule-row';
      row.id = `rule-${index}`;

      const deltaCell = document.createElement('td');
      deltaCell.className = 'rule-cell rule-cell-delta';
      deltaCell.textContent = this.machine.formatLinzDelta(t);

      row.appendChild(deltaCell);
      tbody.appendChild(row);
    });
  }

  _highlightRule(transition) {
    document.querySelectorAll('.rule-row').forEach(r => r.classList.remove('rule-active'));
    if (!transition) return;
    const transitions = this.machine.config.transitions;
    const index = transitions.indexOf(transition);
    if (index >= 0) {
      const row = document.getElementById(`rule-${index}`);
      if (row) {
        row.classList.add('rule-active');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // ===== STATE INFO =====
  _updateStateInfo() {
    const state = this.machine.getState();
    const el = document.getElementById('current-state-display');
    el.textContent = state.currentState;

    const nodeEl = document.getElementById('current-node-display');
    if (nodeEl) nodeEl.textContent = state.currentState;
    const nodeBannerEl = document.getElementById('tape-node-banner');
    if (nodeBannerEl) {
      nodeBannerEl.classList.remove('tape-node-running', 'tape-node-accept', 'tape-node-reject', 'tape-node-halt');
      if (state.accepted) nodeBannerEl.classList.add('tape-node-accept');
      else if (state.rejected) nodeBannerEl.classList.add('tape-node-reject');
      else if (state.halted) nodeBannerEl.classList.add('tape-node-halt');
      else nodeBannerEl.classList.add('tape-node-running');
    }

    const descEl = document.getElementById('state-description');
    const desc = this.machine.config.stateDescriptions?.[state.currentState];
    descEl.textContent = desc || '';

    const statusEl = document.getElementById('machine-status');
    if (state.accepted) {
      statusEl.textContent = 'ACCEPTED';
      statusEl.className = 'status-badge status-accept';
    } else if (state.rejected) {
      statusEl.textContent = 'REJECTED';
      statusEl.className = 'status-badge status-reject';
    } else if (state.halted) {
      statusEl.textContent = 'HALTED';
      statusEl.className = 'status-badge status-halt';
    } else {
      statusEl.textContent = 'READY';
      statusEl.className = 'status-badge status-ready';
    }
  }

  _updateStats() {
    const state = this.machine.getState();
    document.getElementById('step-counter').textContent = state.stepCount;
    document.getElementById('state-counter').textContent = this.machine.config.states.length;

    const isMultiHead = this.machine.config.isMultiHead || false;
    const tapeCounterEl = document.getElementById('tape-counter');
    if (isMultiHead) {
      tapeCounterEl.textContent = `1×${this.machine.config.numTapes}H`;
      tapeCounterEl.title = `1 Tape, ${this.machine.config.numTapes} Heads`;
    } else {
      tapeCounterEl.textContent = this.machine.config.numTapes;
      tapeCounterEl.title = '';
    }

    document.getElementById('transition-counter').textContent = this.machine.config.transitions.length;
  }

  // ===== SANDBOX UI MANAGEMENT =====
  _toggleSandboxUI(show) {
    const analyticsPanel = document.getElementById('sandbox-analytics');
    const editorTab = document.getElementById('tab-editor');

    if (analyticsPanel) {
      if (show) analyticsPanel.classList.remove('hidden');
      else analyticsPanel.classList.add('hidden');
    }
    if (editorTab) {
      editorTab.style.display = show ? '' : 'none';
    }
  }

  _updateAnalytics() {
    if (!this.isSandboxMode || !this.machine) return;

    const state = this.machine.getState();
    const inputEl = document.getElementById('tape-input-0');
    const input = inputEl ? inputEl.value : '';
    const n = input.length || 1;
    const steps = state.stepCount;

    document.getElementById('analytics-n').textContent = input.length;
    document.getElementById('analytics-steps').textContent = steps;

    if (steps > 0) {
      const ratio = (steps / n).toFixed(2);
      const effEl = document.getElementById('analytics-efficiency');
      effEl.textContent = `${ratio} (≈ ${this._guessComplexity(steps, n)})`;
    } else {
      document.getElementById('analytics-efficiency').textContent = '—';
    }
  }

  _guessComplexity(steps, n) {
    if (n <= 1) return 'N/A';
    const ratio = steps / n;
    if (ratio <= 1.5) return 'O(n)';
    if (ratio <= n * 0.8) return 'O(n log n)';
    return 'O(n²)';
  }

  // ===== COMPLEXITY CHART (SVG) =====
  _recordChartPoint() {
    if (!this.machine) return;
    const inputEl = document.getElementById('tape-input-0');
    const input = inputEl ? inputEl.value : '';
    const n = input.length;
    const steps = this.machine.getState().stepCount;
    this.complexityDataPoints.push({ n, steps });
  }

  _renderComplexityChart() {
    const svg = document.getElementById('complexity-chart-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const W = 230, H = 140;
    const pad = { t: 12, r: 12, b: 26, l: 32 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;

    // Determine the theoretical complexity for the current config
    const tc = this.currentTapeConfig?.timeComplexity || 'Custom';
    const theoryFn = tc.includes('n²') ? (n => n * n)
                   : tc.includes('n log') ? (n => n * Math.log2(Math.max(n, 1)))
                   : (n => n); // default to O(n)

    // Compute axis maximums from data + theory
    const dataPoints = this.complexityDataPoints;
    const maxN = Math.max(1, ...dataPoints.map(p => p.n));
    const maxSteps = Math.max(1, ...dataPoints.map(p => p.steps), theoryFn(maxN));

    const scaleX = n => pad.l + (n / maxN) * cw;
    const scaleY = s => pad.t + ch - (s / maxSteps) * ch;

    // Grid lines + axis labels
    const ns = this._ns;
    const axisColor = '#cbd5e1';
    const gridColor = '#f1f5f9';

    // Y-axis
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * ch;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pad.l); line.setAttribute('x2', W - pad.r);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('stroke', gridColor); line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', pad.l - 4); label.setAttribute('y', y + 3);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '7'); label.setAttribute('fill', '#94a3b8');
      label.setAttribute('font-family', 'JetBrains Mono, monospace');
      label.textContent = Math.round(maxSteps * (1 - i / 4));
      svg.appendChild(label);
    }

    // X-axis
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', pad.l + cw / 2); xLabel.setAttribute('y', H - 3);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '7'); xLabel.setAttribute('fill', '#94a3b8');
    xLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
    xLabel.textContent = `Input Length (n) — max ${maxN}`;
    svg.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', 4); yLabel.setAttribute('y', pad.t + ch / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '7'); yLabel.setAttribute('fill', '#94a3b8');
    yLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
    yLabel.setAttribute('transform', `rotate(-90, 6, ${pad.t + ch / 2})`);
    yLabel.textContent = 'Steps';
    svg.appendChild(yLabel);

    // Theoretical complexity curve (faint)
    if (maxN > 0 && tc !== 'Custom') {
      const theoryPoints = [];
      for (let i = 0; i <= 40; i++) {
        const n = (i / 40) * maxN;
        theoryPoints.push(`${scaleX(n).toFixed(1)},${scaleY(theoryFn(n)).toFixed(1)}`);
      }
      const theoryPath = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      theoryPath.setAttribute('points', theoryPoints.join(' '));
      theoryPath.setAttribute('fill', 'none');
      theoryPath.setAttribute('stroke', 'rgba(16, 185, 129, 0.25)');
      theoryPath.setAttribute('stroke-width', '2');
      theoryPath.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(theoryPath);
    }

    // Actual data points + line
    if (dataPoints.length > 1) {
      const linePoints = dataPoints.map(p => `${scaleX(p.n).toFixed(1)},${scaleY(p.steps).toFixed(1)}`).join(' ');
      const actualLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      actualLine.setAttribute('points', linePoints);
      actualLine.setAttribute('fill', 'none');
      actualLine.setAttribute('stroke', '#10b981');
      actualLine.setAttribute('stroke-width', '2');
      svg.appendChild(actualLine);
    }

    // Dots for data points
    dataPoints.forEach(p => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', scaleX(p.n).toFixed(1));
      dot.setAttribute('cy', scaleY(p.steps).toFixed(1));
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', '#10b981');
      dot.setAttribute('stroke', '#fff');
      dot.setAttribute('stroke-width', '1');
      svg.appendChild(dot);
    });

    // Axis border lines
    const axisL = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axisL.setAttribute('x1', pad.l); axisL.setAttribute('x2', pad.l);
    axisL.setAttribute('y1', pad.t); axisL.setAttribute('y2', pad.t + ch);
    axisL.setAttribute('stroke', axisColor); axisL.setAttribute('stroke-width', '1');
    svg.appendChild(axisL);

    const axisB = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axisB.setAttribute('x1', pad.l); axisB.setAttribute('x2', W - pad.r);
    axisB.setAttribute('y1', pad.t + ch); axisB.setAttribute('y2', pad.t + ch);
    axisB.setAttribute('stroke', axisColor); axisB.setAttribute('stroke-width', '1');
    svg.appendChild(axisB);
  }

  // ===== EDITOR HINT =====
  _updateEditorHint(numTapes) {
    const hintEl = document.getElementById('editor-hint');
    if (!hintEl) return;
    const tapeCountSpan = document.getElementById('editor-tape-count');
    if (tapeCountSpan) tapeCountSpan.textContent = numTapes;

    if (numTapes === 1) {
      hintEl.innerHTML = `Format: <code>δ(q0, a) = (q1, b, R)</code>`;
    } else if (numTapes === 2) {
      hintEl.innerHTML = `Format: <code>δ(q0, a, b) = (q1, c, d, R, L)</code>`;
    } else {
      const readSlots = Array.from({length: numTapes}, (_, i) => `a${i+1}`).join(', ');
      const writeSlots = Array.from({length: numTapes}, (_, i) => `b${i+1}`).join(', ');
      const moveSlots = Array.from({length: numTapes}, () => 'D').join(', ');
      hintEl.innerHTML = `Format: <code>δ(q, ${readSlots}) = (q', ${writeSlots}, ${moveSlots})</code>`;
    }
  }

  // ===== PARSE δ RULE INPUT =====
  _parseDeltaRule(input) {
    // Parse: δ(q0, a1, ..., ak) = (q1, b1, ..., bk, D1, ..., Dk)
    // Also accept without δ prefix: (q0, a) = (q1, b, R)
    const cleaned = input.replace(/^δ?\s*/, '').trim();

    // Match: (left_tuple) = (right_tuple)
    const match = cleaned.match(/^\(([^)]+)\)\s*=\s*\(([^)]+)\)$/);
    if (!match) return null;

    const leftParts = match[1].split(',').map(s => s.trim());
    const rightParts = match[2].split(',').map(s => s.trim());

    const numTapes = this.machine.config.numTapes;

    // Left side: (from_state, read1, read2, ..., readk) → k+1 parts
    if (leftParts.length !== numTapes + 1) return null;

    // Right side: (to_state, write1, ..., writek, move1, ..., movek) → 1 + 2k parts
    if (rightParts.length !== 1 + 2 * numTapes) return null;

    const fromState = leftParts[0];
    const reads = leftParts.slice(1).map(s => s === '□' ? this.machine.config.blankSymbol : s);
    const toState = rightParts[0];
    const writes = rightParts.slice(1, 1 + numTapes).map(s => s === '□' ? this.machine.config.blankSymbol : s);
    const moves = rightParts.slice(1 + numTapes).map(s => s.toUpperCase());

    // Validate moves
    for (const m of moves) {
      if (!['R', 'L', 'S'].includes(m)) return null;
    }

    return { from: fromState, read: reads, to: toState, write: writes, move: moves };
  }

  _addSandboxRule(ruleStr) {
    const errorEl = document.getElementById('editor-error');

    const parsed = this._parseDeltaRule(ruleStr);
    if (!parsed) {
      errorEl.textContent = `Invalid format. Expected: δ(q, ${Array(this.machine.config.numTapes).fill('a').join(', ')}) = (q', ${Array(this.machine.config.numTapes).fill('b').join(', ')}, ${Array(this.machine.config.numTapes).fill('D').join(', ')})`;
      errorEl.classList.remove('hidden');
      return false;
    }

    // Auto-add states that don't exist
    const allStates = [parsed.from, parsed.to];
    for (const s of allStates) {
      if (!this.machine.config.states.includes(s)) {
        this.machine.config.states.push(s);
        this.machine.config.stateDescriptions = this.machine.config.stateDescriptions || {};
        this.machine.config.stateDescriptions[s] = '';
      }
    }

    // Add transition
    this.machine.config.transitions.push(parsed);

    errorEl.classList.add('hidden');

    // Refresh everything
    this._buildRuleTable();
    this._renderEditorRulesList();
    this._renderEditorStatesList();
    this.graph.buildGraph(this.machine);
    this._updateStats();

    return true;
  }

  _addSandboxState(name, desc) {
    if (!name || this.machine.config.states.includes(name)) return false;
    this.machine.config.states.push(name);
    this.machine.config.stateDescriptions = this.machine.config.stateDescriptions || {};
    this.machine.config.stateDescriptions[name] = desc || '';

    this._renderEditorStatesList();
    this.graph.buildGraph(this.machine);
    this._updateStats();
    return true;
  }

  _removeSandboxRule(index) {
    this.machine.config.transitions.splice(index, 1);
    this._buildRuleTable();
    this._renderEditorRulesList();
    this.graph.buildGraph(this.machine);
    this._updateStats();
  }

  _renderEditorRulesList() {
    const list = document.getElementById('editor-rules-list');
    if (!list) return;
    list.innerHTML = '';

    const transitions = this.machine.config.transitions;
    if (transitions.length === 0) {
      list.innerHTML = '<div class="editor-empty">No rules defined yet. Add δ rules above.</div>';
      return;
    }

    transitions.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'editor-rule-item';

      const text = document.createElement('span');
      text.className = 'editor-rule-text';
      text.textContent = this.machine.formatLinzDelta(t);

      const delBtn = document.createElement('button');
      delBtn.className = 'editor-btn editor-btn-del';
      delBtn.title = 'Delete Rule';
      delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">close</span>';
      delBtn.addEventListener('click', () => this._removeSandboxRule(i));

      item.appendChild(text);
      item.appendChild(delBtn);
      list.appendChild(item);
    });
  }

  _renderEditorStatesList() {
    const list = document.getElementById('editor-states-list');
    if (!list) return;
    list.innerHTML = '';

    const states = this.machine.config.states;
    const acceptStates = this.machine.config.acceptStates;
    const rejectStates = this.machine.config.rejectStates || [];
    const initial = this.machine.config.initialState;

    states.forEach(s => {
      const item = document.createElement('div');
      item.className = 'editor-state-item';

      let badge = '';
      if (s === initial) badge = '<span class="editor-state-badge badge-initial">INITIAL</span>';
      if (acceptStates.includes(s)) badge += '<span class="editor-state-badge badge-accept">ACCEPT</span>';
      if (rejectStates.includes(s)) badge += '<span class="editor-state-badge badge-reject">REJECT</span>';

      const desc = this.machine.config.stateDescriptions?.[s] || '';
      item.innerHTML = `<span class="editor-state-name">${s}</span>${badge}<span class="editor-state-desc">${desc}</span>`;
      list.appendChild(item);
    });
  }

  // ===== CONTROLS =====
  step() {
    if (this.machine.getState().halted) return;

    // Push deep copy of current state natively before stepping forwards
    const prevState = this.machine.getState();
    this.historyStack.push(prevState);

    const initMsg = document.querySelector('.trace-init');
    if (initMsg) initMsg.remove();

    const result = this.machine.step();
    if (result) {
      this.graph.updateState(this.machine.getState().currentState, result.transition);
      this._renderTapes();
      this._addTraceEntry(result);
      this._highlightRule(result.transition);
      this._updateStateInfo();
      this._updateStats();
      this._updateAnalytics();
      this._renderAnalyticsChart();

      if (this.machine.getState().halted) {
        this._recordAnalyticsRun();
        this.stop();
      }
    }
  }

  stepBack() {
    if (this.historyStack.length === 0) return; // Nothing to pop

    // Halt any playing automations inherently when actively rewinding state overrides
    this.stop();

    const prevState = this.historyStack.pop();
    this.machine.restoreState(prevState);

    // Update the visual stack components purely targeting the previous history node
    this.graph.updateState(prevState.currentState, prevState.lastTransition);
    this._renderTapes();
    this._highlightRule(prevState.lastTransition);
    this._updateStateInfo();
    this._updateStats();
    this._updateAnalytics();
    if (this.complexityDataPoints.length > 0) this.complexityDataPoints.pop();
    this._renderComplexityChart();

    // Drop the frontmost child from the internal trace container actively
    const traceContainer = document.getElementById('trace-entries');
    if (traceContainer.firstChild) {
      traceContainer.removeChild(traceContainer.firstChild);
    }
  }

  play() {
    if (this.isPlaying || this.machine.getState().halted) return;
    this.isPlaying = true;
    this._updateControls();

    this.playInterval = setInterval(() => {
      this.step();
      if (this.machine.getState().halted) {
        this.stop();
      }
    }, this.speed);
  }

  stop() {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    this._updateControls();
  }

  reset() {
    this.stop();
    this._resetMachine();
  }

  setSpeed(ms) {
    this.speed = ms;
    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  _updateControls() {
    const playBtn = document.getElementById('btn-play');
    const pauseBtn = document.getElementById('btn-pause');

    if (this.isPlaying) {
      playBtn.classList.add('control-disabled');
      pauseBtn.classList.remove('control-disabled');
    } else {
      playBtn.classList.remove('control-disabled');
      pauseBtn.classList.add('control-disabled');
    }

    if (!this.machine) return;

    if (this.machine.getState().halted) {
      playBtn.classList.add('control-disabled');
      document.getElementById('btn-step').classList.add('control-disabled');
    } else {
      document.getElementById('btn-step').classList.remove('control-disabled');
    }
  }

  // ===== EVENT BINDINGS =====
  _bindEvents() {
    // Algorithm selector
    document.getElementById('algo-select').addEventListener('change', (e) => {
      this._loadAlgorithm(e.target.value);
    });

    // Tape count (number input for presets)
    document.getElementById('tape-count').addEventListener('change', (e) => {
      this._onTapeChange(parseInt(e.target.value) || 1);
    });

    // Tape count (number input for playground)
    document.getElementById('playground-tape-count').addEventListener('change', (e) => {
      this._onTapeChange(parseInt(e.target.value) || 1);
    });

    // Control buttons
    document.getElementById('btn-play').addEventListener('click', () => this.play());
    document.getElementById('btn-pause').addEventListener('click', () => this.stop());
    document.getElementById('btn-step').addEventListener('click', () => this.step());
    const btnStepBack = document.getElementById('btn-step-back');
    if (btnStepBack) btnStepBack.addEventListener('click', () => this.stepBack());
    document.getElementById('btn-reset').addEventListener('click', () => this.reset());

    document.getElementById('btn-fast').addEventListener('click', () => {
      if (this.machine.getState().halted) return;
      const initMsg = document.querySelector('.trace-init');
      if (initMsg) initMsg.remove();

      let count = 0;
      const maxSteps = 500;
      while (!this.machine.getState().halted && count < maxSteps) {
        const prevState = this.machine.getState();
        this.historyStack.push(prevState);
        const result = this.machine.step();
        if (result) {
          this._addTraceEntry(result);
          this._highlightRule(result.transition);
        }
        count++;
      }
      const state = this.machine.getState();
      this.graph.updateState(state.currentState, this.machine.lastTransition);
      this._renderTapes();
      this._updateStateInfo();
      this._updateStats();
      this._updateAnalytics();
      if (state.halted) this._recordAnalyticsRun();
      this._renderAnalyticsChart();
    });

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      const ms = Math.round(1050 - val * 10);
      this.speed = Math.max(50, ms);
      document.getElementById('speed-value').textContent = `${this.speed}ms`;
      if (this.isPlaying) {
        this.stop();
        this.play();
      }
    });

    // Note: dynamic tape inputs have enter-key listeners bound when they are generated in _buildDynamicTapeInputs

    // Load button
    document.getElementById('btn-load').addEventListener('click', () => {
      this.reset();
    });

    // Fullscreen toggle
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    const btnToggleRightSidebar = document.getElementById('btn-toggle-right-sidebar');
    if (btnToggleRightSidebar) {
      btnToggleRightSidebar.addEventListener('click', () => {
        this._setRightSidebarCollapsed(!this.isRightSidebarCollapsed);
      });
    }

    const resizeHandle = document.getElementById('right-sidebar-resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('pointerdown', (e) => {
        if (this.isRightSidebarCollapsed) return;
        e.preventDefault();
        const appLayout = document.getElementById('sim-view');
        const onMove = (moveEvent) => {
          if (!appLayout) return;
          const rect = appLayout.getBoundingClientRect();
          const proposedWidth = rect.right - moveEvent.clientX;
          this._applyRightSidebarWidth(proposedWidth, true);
        };
        const onUp = () => {
          document.body.classList.remove('sidebar-resizing');
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        document.body.classList.add('sidebar-resizing');
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
      });
    }

    const leftResizeHandle = document.getElementById('left-sidebar-resize-handle');
    if (leftResizeHandle) {
      leftResizeHandle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const appLayout = document.getElementById('sim-view');
        const onMove = (moveEvent) => {
          if (!appLayout) return;
          const rect = appLayout.getBoundingClientRect();
          const proposedWidth = moveEvent.clientX - rect.left;
          this._applyLeftSidebarWidth(proposedWidth, true);
        };
        const onUp = () => {
          document.body.classList.remove('sidebar-resizing');
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        document.body.classList.add('sidebar-resizing');
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
      });
    }

    // Tab switching for right panel (scoped to split-bottom only)
    const splitBottom = document.querySelector('.sidebar-split-bottom');
    if (splitBottom) {
      splitBottom.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          splitBottom.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('panel-tab-active'));
          tab.classList.add('panel-tab-active');
          const target = tab.dataset.tab;
          splitBottom.querySelectorAll('.panel-content').forEach(c => c.classList.add('hidden'));
          splitBottom.querySelector(`#panel-${target}`).classList.remove('hidden');
        });
      });
    }

    // Download JSON
    const btnDownload = document.getElementById('btn-download-json');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => this._downloadMachineJSON());
    }

    // Clear analytics history
    const btnClear = document.getElementById('btn-clear-history');
    if (btnClear) {
      btnClear.addEventListener('click', () => this._clearAnalyticsHistory());
    }

    // Tab switching for left panel modes (Presets vs Playground)
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Toggle the visual active tab state
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('mode-tab-active'));
        tab.classList.add('mode-tab-active');

        // Hide all mode contents
        document.querySelectorAll('.mode-content').forEach(c => c.classList.add('hidden'));

        // Show the targeted mode content
        const targetMode = tab.dataset.mode;
        document.getElementById(`mode-${targetMode}`).classList.remove('hidden');

        // Context switching logic
        if (targetMode === 'playground') {
           // Remember what preset they were looking at
           if (this.currentAlgoKey !== 'sandbox') {
             this.previousPresetKey = this.currentAlgoKey;
             this._loadAlgorithm('sandbox');
           }
        } else {
           // Switching back to Presets
           if (this.currentAlgoKey === 'sandbox') {
             this._loadAlgorithm(this.previousPresetKey || 'palindrome');
           }
        }
      });
    });

    // Global Learning Mode toggle
    const learningCb = document.getElementById('learning-mode-cb');
    if (learningCb) {
      learningCb.addEventListener('change', (e) => {
        this.graph.setGlobalLearningMode(e.target.checked);
      });
    }

    // ===== SANDBOX: Add Rule =====
    const btnAddRule = document.getElementById('btn-add-rule');
    if (btnAddRule) {
      btnAddRule.addEventListener('click', () => {
        const input = document.getElementById('new-rule-input');
        if (input.value.trim()) {
          if (this._addSandboxRule(input.value.trim())) {
            input.value = '';
          }
        }
      });
    }
    const ruleInput = document.getElementById('new-rule-input');
    if (ruleInput) {
      ruleInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          const btnAdd = document.getElementById('btn-add-rule');
          if (btnAdd) btnAdd.click();
        }
      });
    }

    // ===== SANDBOX: Add State =====
    const btnAddState = document.getElementById('btn-add-state');
    if (btnAddState) {
      btnAddState.addEventListener('click', () => {
        const nameInput = document.getElementById('new-state-name');
        const descInput = document.getElementById('new-state-desc');
        if (nameInput.value.trim()) {
          this._addSandboxState(nameInput.value.trim(), descInput.value.trim());
          nameInput.value = '';
          descInput.value = '';
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.isPlaying ? this.stop() : this.play();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.step();
          break;
        case 'r':
          e.preventDefault();
          this.reset();
          break;
      }
    });

    this._setRightSidebarCollapsed(this.isRightSidebarCollapsed);
  }
  // ===== ANALYTICS: PERFORMANCE CHART (n vs steps) =====
  _recordAnalyticsRun() {
    if (!this.machine) return;
    const state = this.machine.getState();
    const inputEl = document.getElementById('tape-input-0');
    const n = inputEl ? inputEl.value.length : 0;
    const steps = state.stepCount;
    let result = 'halt';
    if (state.accepted) result = 'accept';
    else if (state.rejected) result = 'reject';

    this.analyticsHistory.push({
      n,
      steps,
      result,
      algo: this.currentAlgoKey,
      tapes: this.machine.config.numTapes,
      timestamp: Date.now()
    });

    // Recompute fit only on completed runs (visual stability)
    this._computeRegressionFit(this.analyticsHistory);

    this._renderAnalyticsHistory();
    this._renderAnalyticsChart();
  }

  _renderAnalyticsHistory() {
    const list = document.getElementById('analytics-history-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.analyticsHistory.length === 0) {
      list.innerHTML = '<div class="analytics-empty">No completed runs yet. Run the machine to completion to record data points.</div>';
      return;
    }

    // Show most recent first
    const runs = [...this.analyticsHistory].reverse();
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const idx = this.analyticsHistory.length - i;

      const item = document.createElement('div');
      item.className = 'analytics-run-item';

      const num = document.createElement('span');
      num.className = 'analytics-run-num';
      num.textContent = `#${idx}`;

      const info = document.createElement('span');
      info.className = 'analytics-run-info';
      info.textContent = `n=${run.n} → ${run.steps} steps`;

      const badge = document.createElement('span');
      badge.className = 'analytics-run-result';
      if (run.result === 'accept') {
        badge.classList.add('analytics-run-result-accept');
        badge.textContent = 'ACC';
      } else if (run.result === 'reject') {
        badge.classList.add('analytics-run-result-reject');
        badge.textContent = 'REJ';
      } else {
        badge.classList.add('analytics-run-result-halt');
        badge.textContent = 'HALT';
      }

      item.appendChild(num);
      item.appendChild(info);
      item.appendChild(badge);
      list.appendChild(item);
    }
  }

  _renderAnalyticsChart() {
    const svg = document.getElementById('analytics-chart-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const W = 300, H = 180;
    const pad = { t: 14, r: 14, b: 26, l: 36 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;

    const completedRuns = this.analyticsHistory;

    // Live point: current run in progress
    const inputEl = document.getElementById('tape-input-0');
    const liveN = inputEl ? inputEl.value.length : 0;
    const liveSteps = this.machine ? this.machine.getState().stepCount : 0;
    const isLive = this.machine && !this.machine.getState().halted && liveSteps > 0;

    // Compute axis maximums
    const allN = [...completedRuns.map(r => r.n), liveN].filter(v => v > 0);
    const allS = [...completedRuns.map(r => r.steps), liveSteps].filter(v => v > 0);

    if (allN.length === 0 && !isLive) {
      // Draw empty state
      const emptyText = this._svgNS('text');
      emptyText.setAttribute('x', W / 2);
      emptyText.setAttribute('y', H / 2);
      emptyText.setAttribute('text-anchor', 'middle');
      emptyText.setAttribute('font-family', 'Inter, sans-serif');
      emptyText.setAttribute('font-size', '10');
      emptyText.setAttribute('fill', '#94a3b8');
      emptyText.textContent = 'Run the machine to see performance data';
      svg.appendChild(emptyText);
      // Reset legend/formula
      this._updateFormulaDisplay(null);
      this._updateInsightBox(null);
      return;
    }

    // ===== REGRESSION ENGINE =====
    // Use cached fit from last completed run (visual stability: don't refit during live stepping)
    const fit = this._cachedFit || this._computeRegressionFit(completedRuns);

    const maxN = Math.max(1, ...allN);
    // Decide maxSteps accounting for the fitted curve
    let fitMaxY = 0;
    if (fit) {
      fitMaxY = fit.type === 'quadratic'
        ? fit.a * maxN * maxN + fit.b * maxN + fit.c
        : fit.k * maxN + fit.b;
    }
    const maxSteps = Math.max(1, ...allS, fitMaxY * 1.15);

    const scaleX = n => pad.l + (n / maxN) * cw;
    const scaleY = s => pad.t + ch - (s / maxSteps) * ch;

    // Grid lines
    const gridColor = '#f1f5f9';
    const axisColor = '#cbd5e1';

    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * ch;
      const line = this._svgNS('line');
      line.setAttribute('x1', pad.l); line.setAttribute('x2', W - pad.r);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('stroke', gridColor); line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      const label = this._svgNS('text');
      label.setAttribute('x', pad.l - 4); label.setAttribute('y', y + 3);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '7'); label.setAttribute('fill', '#94a3b8');
      label.setAttribute('font-family', 'JetBrains Mono, monospace');
      label.textContent = Math.round(maxSteps * (1 - i / 4));
      svg.appendChild(label);
    }

    // X-axis label
    const xLabel = this._svgNS('text');
    xLabel.setAttribute('x', pad.l + cw / 2); xLabel.setAttribute('y', H - 4);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '7.5'); xLabel.setAttribute('fill', '#94a3b8');
    xLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
    xLabel.textContent = 'Input Length (n)';
    svg.appendChild(xLabel);

    // Y-axis label
    const yLabel = this._svgNS('text');
    yLabel.setAttribute('x', 5); yLabel.setAttribute('y', pad.t + ch / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '7.5'); yLabel.setAttribute('fill', '#94a3b8');
    yLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
    yLabel.setAttribute('transform', `rotate(-90, 7, ${pad.t + ch / 2})`);
    yLabel.textContent = 'Steps';
    svg.appendChild(yLabel);

    // ===== FITTED COMPLEXITY OVERLAY =====
    if (fit) {
      const fitColor = fit.type === 'quadratic' ? 'rgba(251, 146, 60, 0.45)' : 'rgba(56, 189, 248, 0.45)';
      const fitPoints = [];
      for (let i = 0; i <= 50; i++) {
        const n = (i / 50) * maxN;
        const y = fit.type === 'quadratic'
          ? fit.a * n * n + fit.b * n + fit.c
          : fit.k * n + fit.b;
        const clamped = Math.max(0, y);
        if (clamped <= maxSteps * 1.05) {
          fitPoints.push(`${scaleX(n).toFixed(1)},${scaleY(clamped).toFixed(1)}`);
        }
      }
      if (fitPoints.length > 1) {
        const fitLine = this._svgNS('polyline');
        fitLine.setAttribute('points', fitPoints.join(' '));
        fitLine.setAttribute('fill', 'none');
        fitLine.setAttribute('stroke', fitColor);
        fitLine.setAttribute('stroke-width', '1.8');
        fitLine.setAttribute('stroke-dasharray', '6 3');
        svg.appendChild(fitLine);

        // Fit label at end of curve
        const lastPt = fitPoints[fitPoints.length - 1].split(',');
        const fitLabel = this._svgNS('text');
        fitLabel.setAttribute('x', Math.min(parseFloat(lastPt[0]) + 2, W - pad.r - 10));
        fitLabel.setAttribute('y', Math.max(parseFloat(lastPt[1]) - 3, pad.t + 8));
        fitLabel.setAttribute('font-size', '7');
        fitLabel.setAttribute('fill', fitColor.replace('0.45', '0.75'));
        fitLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
        fitLabel.setAttribute('font-weight', '700');
        fitLabel.textContent = fit.type === 'quadratic' ? 'O(n²)' : 'O(n)';
        svg.appendChild(fitLabel);
      }
    }

    // ===== ACTUAL DATA POINTS (completed runs) =====
    if (completedRuns.length > 1) {
      const sorted = [...completedRuns].sort((a, b) => a.n - b.n);
      const linePoints = sorted.map(r => `${scaleX(r.n).toFixed(1)},${scaleY(r.steps).toFixed(1)}`).join(' ');
      const actualLine = this._svgNS('polyline');
      actualLine.setAttribute('points', linePoints);
      actualLine.setAttribute('fill', 'none');
      actualLine.setAttribute('stroke', '#10b981');
      actualLine.setAttribute('stroke-width', '2');
      actualLine.setAttribute('stroke-linejoin', 'round');
      actualLine.setAttribute('opacity', '0.4');
      svg.appendChild(actualLine);
    }

    // Draw completed run dots
    completedRuns.forEach((run, index) => {
      const isLatest = index === completedRuns.length - 1;
      const dot = this._svgNS('circle');
      dot.setAttribute('cx', scaleX(run.n).toFixed(1));
      dot.setAttribute('cy', scaleY(run.steps).toFixed(1));
      dot.setAttribute('r', isLatest ? '5' : '3.5');
      dot.setAttribute('fill', run.result === 'accept' ? '#10b981' : (run.result === 'reject' ? '#ef4444' : '#f59e0b'));
      dot.setAttribute('stroke', '#fff');
      dot.setAttribute('stroke-width', '1.5');
      dot.setAttribute('opacity', isLatest ? '1' : '0.4');
      svg.appendChild(dot);

      const title = this._svgNS('title');
      title.textContent = `n=${run.n}, steps=${run.steps} (${run.result.toUpperCase()})`;
      dot.appendChild(title);
    });

    // Live point (pulsing hollow circle)
    if (isLive) {
      const liveDot = this._svgNS('circle');
      liveDot.setAttribute('cx', scaleX(liveN).toFixed(1));
      liveDot.setAttribute('cy', scaleY(liveSteps).toFixed(1));
      liveDot.setAttribute('r', '5');
      liveDot.setAttribute('fill', 'none');
      liveDot.setAttribute('stroke', '#10b981');
      liveDot.setAttribute('stroke-width', '2');
      liveDot.classList.add('analytics-live-dot');
      svg.appendChild(liveDot);

      const liveLabel = this._svgNS('text');
      liveLabel.setAttribute('x', parseFloat(scaleX(liveN).toFixed(1)) + 8);
      liveLabel.setAttribute('y', parseFloat(scaleY(liveSteps).toFixed(1)) + 3);
      liveLabel.setAttribute('font-size', '7');
      liveLabel.setAttribute('fill', '#10b981');
      liveLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
      liveLabel.setAttribute('font-weight', '700');
      liveLabel.textContent = `${liveSteps}`;
      svg.appendChild(liveLabel);
    }

    // Axis border lines
    const axisL = this._svgNS('line');
    axisL.setAttribute('x1', pad.l); axisL.setAttribute('x2', pad.l);
    axisL.setAttribute('y1', pad.t); axisL.setAttribute('y2', pad.t + ch);
    axisL.setAttribute('stroke', axisColor); axisL.setAttribute('stroke-width', '1');
    svg.appendChild(axisL);

    const axisB = this._svgNS('line');
    axisB.setAttribute('x1', pad.l); axisB.setAttribute('x2', W - pad.r);
    axisB.setAttribute('y1', pad.t + ch); axisB.setAttribute('y2', pad.t + ch);
    axisB.setAttribute('stroke', axisColor); axisB.setAttribute('stroke-width', '1');
    svg.appendChild(axisB);

    // Update formula + insight UI
    this._updateFormulaDisplay(fit);
    this._updateInsightBox(fit);
  }

  // ===== REGRESSION ENGINE: Least Squares Fitting (Data-Driven Only) =====
  _computeRegressionFit(runs) {
    // No data or only 1 point → no curve at all
    if (!runs || runs.length < 2) {
      this._cachedFit = null;
      return null;
    }

    // Need at least 2 distinct n values for meaningful regression
    const distinctN = new Set(runs.map(r => r.n));
    if (distinctN.size < 2) {
      this._cachedFit = null;
      return null;
    }

    const xs = runs.map(r => r.n);
    const ys = runs.map(r => r.steps);

    // --- Linear fit: y = k*x + b ---
    const linFit = this._leastSquaresLinear(xs, ys);
    const linR2 = this._rSquared(xs, ys, x => linFit.k * x + linFit.b);

    // --- Quadratic fit (only attempt with 3+ points) ---
    if (distinctN.size >= 3) {
      const quadFit = this._leastSquaresQuadratic(xs, ys);
      const quadR2 = this._rSquared(xs, ys, x => quadFit.a * x * x + quadFit.b * x + quadFit.c);

      // Quadratic wins only if meaningfully better AND coefficient is non-trivial
      const quadWins = quadR2 > linR2 + 0.05 && Math.abs(quadFit.a) > 0.01;
      if (quadWins) {
        this._cachedFit = { type: 'quadratic', a: quadFit.a, b: quadFit.b, c: quadFit.c, r2: quadR2 };
        return this._cachedFit;
      }
    }

    // Default: linear
    this._cachedFit = { type: 'linear', k: linFit.k, b: linFit.b, r2: linR2 };
    return this._cachedFit;
  }

  _leastSquaresLinear(xs, ys) {
    const n = xs.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += xs[i]; sumY += ys[i];
      sumXY += xs[i] * ys[i]; sumX2 += xs[i] * xs[i];
    }
    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 1e-12) return { k: 0, b: sumY / n };
    const k = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - k * sumX) / n;
    return { k: Math.max(0.1, k), b };
  }

  _leastSquaresQuadratic(xs, ys) {
    // Solve for y = a*x² + b*x + c via normal equations
    const n = xs.length;
    let s1 = 0, s2 = 0, s3 = 0, s4 = 0;
    let sy = 0, sxy = 0, sx2y = 0;
    for (let i = 0; i < n; i++) {
      const x = xs[i], y = ys[i];
      const x2 = x * x, x3 = x2 * x, x4 = x2 * x2;
      s1 += x; s2 += x2; s3 += x3; s4 += x4;
      sy += y; sxy += x * y; sx2y += x2 * y;
    }
    // [n s1 s2 | sy  ]   [c]
    // [s1 s2 s3 | sxy ]   [b]
    // [s2 s3 s4 | sx2y]   [a]
    const A = [
      [n, s1, s2, sy],
      [s1, s2, s3, sxy],
      [s2, s3, s4, sx2y]
    ];
    // Gaussian elimination
    for (let col = 0; col < 3; col++) {
      let maxRow = col;
      for (let row = col + 1; row < 3; row++) {
        if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
      }
      [A[col], A[maxRow]] = [A[maxRow], A[col]];
      if (Math.abs(A[col][col]) < 1e-12) continue;
      for (let row = col + 1; row < 3; row++) {
        const factor = A[row][col] / A[col][col];
        for (let j = col; j <= 3; j++) A[row][j] -= factor * A[col][j];
      }
    }
    // Back-substitution
    const sol = [0, 0, 0];
    for (let i = 2; i >= 0; i--) {
      if (Math.abs(A[i][i]) < 1e-12) { sol[i] = 0; continue; }
      sol[i] = A[i][3];
      for (let j = i + 1; j < 3; j++) sol[i] -= A[i][j] * sol[j];
      sol[i] /= A[i][i];
    }
    return { c: sol[0], b: sol[1], a: Math.max(0, sol[2]) };
  }

  _rSquared(xs, ys, predict) {
    const n = ys.length;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
      ssTot += (ys[i] - meanY) ** 2;
      ssRes += (ys[i] - predict(xs[i])) ** 2;
    }
    if (ssTot < 1e-12) return 1;
    return 1 - ssRes / ssTot;
  }

  // ===== UI UPDATERS =====
  _updateFormulaDisplay(fit) {
    const el = document.getElementById('analytics-formula-display');
    const dotEl = document.getElementById('legend-fit-dot');
    const labelEl = document.getElementById('legend-fit-label');
    if (!el) return;

    // No fit yet → check if we have exactly 1 run to show contextual prompt
    if (!fit) {
      const hasOneRun = this.analyticsHistory && this.analyticsHistory.length === 1;
      if (hasOneRun) {
        el.innerHTML = '<span class="formula-pending">Run again with a different input length to see the complexity trend.</span>';
      } else {
        el.innerHTML = '<span class="formula-pending">Run the machine to begin complexity analysis</span>';
      }
      if (dotEl) dotEl.style.background = 'transparent';
      if (labelEl) labelEl.textContent = '—';
      return;
    }

    let formulaStr = '';
    let classStr = '';
    let classCSS = '';
    let dotColor = '';

    if (fit.type === 'quadratic') {
      const aR = Math.round(fit.a * 100) / 100;
      const bR = Math.round(fit.b * 10) / 10;
      const cR = Math.round(fit.c);
      const bPart = bR >= 0 ? `+ ${bR}n` : `- ${Math.abs(bR)}n`;
      const cPart = cR >= 0 ? `+ ${cR}` : `- ${Math.abs(cR)}`;
      formulaStr = `y = ${aR}n² ${bPart} ${cPart}`;
      classStr = 'O(n²)';
      classCSS = 'formula-class-quad';
      dotColor = 'rgba(251, 146, 60, 0.5)';
    } else {
      const kR = Math.round(fit.k * 10) / 10;
      const bR = Math.round(fit.b);
      const bPart = bR >= 0 ? `+ ${bR}` : `- ${Math.abs(bR)}`;
      formulaStr = `y = ${kR}n ${bPart}`;
      classStr = 'O(n)';
      classCSS = 'formula-class-linear';
      dotColor = 'rgba(56, 189, 248, 0.5)';
    }

    const r2Tag = fit.r2 !== null ? ` · R²=${(fit.r2).toFixed(3)}` : '';
    el.innerHTML = `Derived Complexity: ${formulaStr} <span class="formula-class ${classCSS}">${classStr}</span>${r2Tag}`;

    if (dotEl) dotEl.style.background = dotColor;
    if (labelEl) labelEl.textContent = fit.type === 'quadratic' ? 'O(n²)' : 'O(n)';
  }

  _updateInsightBox(fit) {
    const insightBox = document.getElementById('analytics-insight-box');
    if (!insightBox) return;

    insightBox.classList.remove('hidden');
    let html = '';

    const isPal2 = this.currentPresetKey === 'palindrome-2tape';
    const isPal1 = this.currentPresetKey === 'palindrome-1tape';
    const isCopy1 = this.currentPresetKey === 'string-copy-1tape';
    const isCopy2 = this.currentPresetKey === 'string-copy-2tape';

    if (isPal2 || isCopy2) {
      html += `<strong>2-Tape Speedup:</strong> Using a second tape reduces complexity from O(n²) to O(n) by eliminating back-and-forth head travel.<br>`;
    } else if (isPal1 || isCopy1) {
      html += `<strong>1-Tape Complexity:</strong> Single tape requires back-and-forth traversal resulting in O(n²) total steps.<br>`;
    }

    if (fit && fit.type === 'linear') {
      const kR = Math.round(fit.k * 10) / 10;
      const bR = Math.round(fit.b);
      const bPart = bR >= 0 ? `+ ${bR}` : `- ${Math.abs(bR)}`;
      html += `<strong>Big O Rule:</strong> O(${kR}n ${bPart}) → O(n). Constants are dropped in asymptotic analysis.`;
    } else if (fit && fit.type === 'quadratic') {
      const aR = Math.round(fit.a * 100) / 100;
      html += `<strong>Big O Rule:</strong> O(${aR}n²) → O(n²). The leading term dominates for large n.`;
    }

    if (!html) {
      insightBox.classList.add('hidden');
    } else {
      insightBox.innerHTML = html;
    }
  }

  _svgNS(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  // ===== JSON EXPORT =====
  _downloadMachineJSON() {
    if (!this.machine) return;

    const config = this.machine.config;
    const exportData = {
      meta: {
        generator: 'TuringAtheneum',
        exportedAt: new Date().toISOString(),
        algorithm: this.currentAlgoKey,
        preset: this.currentPresetKey
      },
      machine: {
        name: config.name,
        description: config.description,
        numTapes: config.numTapes,
        states: config.states,
        initialState: config.initialState,
        acceptStates: config.acceptStates,
        rejectStates: config.rejectStates || [],
        inputAlphabet: config.inputAlphabet,
        tapeAlphabet: config.tapeAlphabet,
        blankSymbol: config.blankSymbol,
        stateDescriptions: config.stateDescriptions || {},
        transitions: config.transitions.map(t => ({
          from: t.from,
          read: t.read,
          to: t.to,
          write: t.write,
          move: t.move
        }))
      },
      analytics: {
        history: this.analyticsHistory,
        currentState: this.machine.getState()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turing-${this.currentAlgoKey || 'machine'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _clearAnalyticsHistory() {
    this.analyticsHistory = [];
    this._cachedFit = null;
    this._renderAnalyticsHistory();
    this._renderAnalyticsChart();
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('[TuringAtheneum] Initializing app...');
    window.app = new App();
    console.log('[TuringAtheneum] App initialized successfully.');
    console.log('[TuringAtheneum] Graph nodes:', window.app.graph.nodes.length);
    console.log('[TuringAtheneum] Machine state:', window.app.machine.getState().currentState);
  } catch (e) {
    console.error('[TuringAtheneum] Init error:', e);
    document.getElementById('graph-container').innerHTML =
      '<div style="color:#ff5252;padding:2rem;font-family:monospace">Error: ' + e.message + '</div>';
  }
});
