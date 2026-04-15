// ===== MULTI-TAPE TURING MACHINE ENGINE =====

class TuringMachine {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset(inputOrArray, tape2Input) {
    const numTapes = this.config.numTapes;
    const blank = this.config.blankSymbol;

    // Normalise inputs into an array of strings, one per tape
    let tapeInputs;
    if (Array.isArray(inputOrArray)) {
      tapeInputs = inputOrArray;
    } else {
      // Legacy 2-arg signature: reset(input, tape2Input)
      tapeInputs = [inputOrArray || this.config.defaultInput || ''];
      if (tape2Input) tapeInputs.push(tape2Input);
    }

    // Initialize tapes
    this.tapes = [];
    this.heads = [];
    for (let i = 0; i < numTapes; i++) {
      const tapeStr = tapeInputs[i] || '';
      this.tapes.push(this._createTape(tapeStr));
      this.heads.push(1); // Start at position 1 (after leading blank)
    }

    this.currentState = this.config.initialState;
    this.stepCount = 0;
    this.history = [];
    this.halted = false;
    this.accepted = false;
    this.rejected = false;
    this.lastTransition = null;
  }

  _createTape(input) {
    const blank = this.config.blankSymbol;
    const cells = [blank]; // Leading blank
    for (const ch of input) {
      cells.push(ch);
    }
    cells.push(blank); // Trailing blank
    cells.push(blank); // Extra blank
    cells.push(blank); // Extra blank
    return cells;
  }

  // Resolve which physical tape a given head index should access
  _tapeFor(headIndex) {
    return (this.config.isMultiHead) ? 0 : headIndex;
  }

  _ensureTapeBounds(headIndex) {
    const blank = this.config.blankSymbol;
    const ti = this._tapeFor(headIndex);

    // Only unshift if head actually went below 0
    while (this.heads[headIndex] < 0) {
      this.tapes[ti].unshift(blank);
      for (let h = 0; h < this.heads.length; h++) {
        if (this._tapeFor(h) === ti) this.heads[h]++;
      }
    }
    // Only push if head went past the end
    while (this.heads[headIndex] >= this.tapes[ti].length) {
      this.tapes[ti].push(blank);
    }
  }

  readSymbols() {
    const symbols = [];
    for (let i = 0; i < this.config.numTapes; i++) {
      this._ensureTapeBounds(i);
      const ti = this._tapeFor(i);
      symbols.push(this.tapes[ti][this.heads[i]]);
    }
    return symbols;
  }

  findTransition(state, readSymbols) {
    for (const t of this.config.transitions) {
      if (t.from !== state) continue;
      let match = true;
      for (let i = 0; i < readSymbols.length; i++) {
        if (t.read[i] !== readSymbols[i]) {
          match = false;
          break;
        }
      }
      if (match) return t;
    }
    return null;
  }

  step() {
    if (this.halted) return null;

    const readSyms = this.readSymbols();
    const transition = this.findTransition(this.currentState, readSyms);

    if (!transition) {
      // FIX 4: Route implicit crashes natively to reject states if they exist
      const rejState = (this.config.rejectStates && this.config.rejectStates.length > 0) 
        ? this.config.rejectStates[0] 
        : null;

      if (rejState && this.currentState !== rejState) {
        const fromState = this.currentState;
        this.currentState = rejState;
        this.halted = true;
        this.rejected = true;
        const result = {
          step: this.stepCount,
          fromState: fromState,
          toState: rejState,
          readSymbols: [...readSyms],
          writeSymbols: [...readSyms],
          movements: Array(this.config.numTapes).fill('S'),
          transition: { from: fromState, to: rejState, read: [...readSyms], write: [...readSyms], move: Array(this.config.numTapes).fill('S') },
          event: 'REJECTED',
          tapeSnapshots: this.tapes.map(t => [...t]),
          headPositions: [...this.heads]
        };
        this.history.push(result);
        return result;
      }

      // Traditional halt if no reject state exists dynamically
      this.halted = true;
      this.rejected = true;
      const result = {
        step: this.stepCount,
        fromState: this.currentState,
        toState: null,
        readSymbols: [...readSyms],
        writeSymbols: null,
        movements: null,
        transition: null,
        event: 'HALT_NO_TRANSITION',
        tapeSnapshots: this.tapes.map(t => [...t]),
        headPositions: [...this.heads]
      };
      this.history.push(result);
      return result;
    }

    // Save state for history
    const fromState = this.currentState;
    const prevHeads = [...this.heads];
    const prevTapes = this.tapes.map(t => [...t]);

    // Apply transition
    for (let i = 0; i < this.config.numTapes; i++) {
      const ti = this._tapeFor(i);
      this.tapes[ti][this.heads[i]] = transition.write[i];
      const moveDir = transition.move[i];
      if (moveDir === 'R') this.heads[i]++;
      else if (moveDir === 'L') this.heads[i]--;
      // 'S' = stay
      this._ensureTapeBounds(i);
    }

    this.currentState = transition.to;
    this.stepCount++;
    this.lastTransition = transition;

    // Check for accept/reject
    if (this.config.acceptStates.includes(this.currentState)) {
      this.halted = true;
      this.accepted = true;
    }
    if (this.config.rejectStates && this.config.rejectStates.includes(this.currentState)) {
      this.halted = true;
      this.rejected = true;
    }

    const result = {
      step: this.stepCount,
      fromState: fromState,
      toState: this.currentState,
      readSymbols: [...readSyms],
      writeSymbols: [...transition.write],
      movements: [...transition.move],
      transition: transition,
      event: this.accepted ? 'ACCEPTED' : (this.rejected ? 'REJECTED' : 'STEP'),
      tapeSnapshots: this.tapes.map(t => [...t]),
      headPositions: [...this.heads]
    };

    this.history.push(result);
    return result;
  }

  restoreState(stateObj) {
    this.currentState = stateObj.currentState;
    this.tapes = stateObj.tapes.map(t => [...t]);
    this.heads = [...stateObj.heads];
    this.stepCount = stateObj.stepCount;
    this.halted = stateObj.halted;
    this.accepted = stateObj.accepted;
    this.rejected = stateObj.rejected;
    this.lastTransition = stateObj.lastTransition;
  }

  getState() {
    return {
      currentState: this.currentState,
      tapes: this.tapes.map(t => [...t]),
      heads: [...this.heads],
      stepCount: this.stepCount,
      halted: this.halted,
      accepted: this.accepted,
      rejected: this.rejected,
      lastTransition: this.lastTransition
    };
  }

  getTransitionsFrom(state) {
    return this.config.transitions.filter(t => t.from === state);
  }

  getTransitionsTo(state) {
    return this.config.transitions.filter(t => t.to === state);
  }

  getAllStates() {
    return [...this.config.states];
  }

  getTransitionKey(t) {
    return this.formatLinzDelta(t);
  }

  // Linz formal δ notation: δ(q_i, a1, a2, ..., ak) = (q_j, b1, b2, ..., bk, D1, D2, ..., Dk)
  formatLinzDelta(t) {
    const sym = (s) => s === this.config.blankSymbol ? '□' : s;
    const reads = t.read.map(sym).join(', ');
    const writes = t.write.map(sym).join(', ');
    const moves = t.move.join(', ');
    return `δ(${t.from}, ${reads}) = (${t.to}, ${writes}, ${moves})`;
  }

  formatTransitionLabel(t) {
    return this.formatLinzDelta(t);
  }

  formatTransitionShort(t) {
    return this.formatLinzDelta(t);
  }
}
