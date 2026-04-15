// ===== PRESET TURING MACHINE CONFIGURATIONS =====

// Categories for the algorithm dropdown
const ALGORITHM_CATEGORIES = [
  {
    label: 'Multi-Tape Machines',
    algorithms: ['palindrome', 'binary-add', 'string-copy', 'bit-inverter', 'binary-increment', 'unary-doubler']
  },
  {
    label: 'Multi-Head Machines',
    algorithms: ['substring-search', 'sync-parity']
  }
];

const ALGORITHM_MAP = {
  'palindrome': {
    name: 'Palindrome Checker',
    category: 'multi-tape',
    description: 'Checks if a binary string is a palindrome.',
    inputLabels: { tape1: 'String to Check' },
    tape2Disabled: true, // T2 is a work tape, not user-editable
    tapes: [
      { count: 1, presetKey: 'palindrome-1tape', timeComplexity: 'O(n²)', tcExplanation: 'Requires shuttling back and forth for every character' },
      { count: 2, presetKey: 'palindrome-2tape', timeComplexity: 'O(n)', tcExplanation: 'Copy to T2, then compare in parallel' }
    ],
    complexityCard: {
      summary: '1-Tape: O(n²) | 2-Tape: O(n)',
      benefit: 'Linear Speedup: 2nd tape allows simultaneous read/write.'
    }
  },
  'binary-add': {
    name: 'Binary Addition',
    category: 'multi-tape',
    description: 'Adds two binary numbers.',
    inputLabels: { tape1: 'First Binary Number', tape2: 'Second Binary Number' },
    tapes: [
      { count: 2, presetKey: 'binary-add-2tape', timeComplexity: 'O(n)', tcExplanation: 'Input on T1, carry/result on T2' },
      { count: 3, presetKey: 'binary-add-3tape', timeComplexity: 'O(n)', tcExplanation: 'Simpler logic: Input A on T1, Input B on T2, Result on T3' }
    ],
    complexityCard: {
      summary: '2-Tape: O(n) | 3-Tape: O(n)',
      benefit: '3rd tape separates result from inputs for cleaner logic.'
    }
  },
  'string-copy': {
    name: 'String Copy / Duplication',
    category: 'multi-tape',
    description: 'Copies a binary string to demonstrate multi-tape efficiency.',
    inputLabels: { tape1: 'String to Copy' },
    tape2Disabled: true,
    tapes: [
      { count: 1, presetKey: 'string-copy-1tape', timeComplexity: 'O(n²)', tcExplanation: 'Single tape requires shuttling between source and destination zones' },
      { count: 2, presetKey: 'string-copy-2tape', timeComplexity: 'O(n)', tcExplanation: 'Direct parallel copy from T1 to T2' }
    ],
    complexityCard: {
      summary: '1-Tape: O(n²) | 2-Tape: O(n)',
      benefit: 'Linear Speedup: Parallel read/write eliminates shuttling.'
    }
  },
  'bit-inverter': {
    name: 'Bit Inverter',
    category: 'multi-tape',
    description: 'Inverts every bit on the tape: 0→1 and 1→0.',
    inputLabels: { tape1: 'Binary String' },
    tapes: [
      { count: 1, presetKey: 'bit-inverter', timeComplexity: 'O(n)', tcExplanation: 'Simple single-pass scan' }
    ]
  },
  'binary-increment': {
    name: 'Binary Increment',
    category: 'multi-tape',
    description: 'Adds 1 to a binary number, handling carry propagation.',
    inputLabels: { tape1: 'Binary Number' },
    tapes: [
      { count: 1, presetKey: 'binary-increment', timeComplexity: 'O(n)', tcExplanation: 'Single pass from LSB with carry propagation' }
    ]
  },
  'unary-doubler': {
    name: 'Unary Doubler',
    category: 'multi-tape',
    description: 'Doubles a unary number.',
    inputLabels: { tape1: 'Unary Number (string of 1s)' },
    tape2Disabled: true,
    tapes: [
      { count: 2, presetKey: 'unary-doubler-2tape', timeComplexity: 'O(n)', tcExplanation: 'For each 1 on T1, write two 1s on T2' }
    ]
  },
  'substring-search': {
    name: 'Substring Search (Multi-Head)',
    category: 'multi-head',
    description: 'One tape with two independent heads. Head A stays at pattern start, Head B scans the text.',
    isMultiHead: true,
    inputLabels: { tape1: 'The Text Body', tape2: 'Pattern to Find' },
    tapes: [
      { count: 1, heads: 2, presetKey: 'substring-search-multihead', timeComplexity: 'O(n)', tcExplanation: 'Head A anchors on pattern, Head B scans text linearly' }
    ]
  },
  'sync-parity': {
    name: 'Synchronized Parity Check',
    category: 'multi-head',
    description: 'One tape with two heads. Head A starts at beginning, Head B at end. They converge inward checking symmetry.',
    isMultiHead: true,
    inputLabels: { tape1: 'Binary String to Check' },
    tape2Disabled: true,
    tapes: [
      { count: 1, heads: 2, presetKey: 'sync-parity-multihead', timeComplexity: 'O(n)', tcExplanation: 'Two heads converge from opposite ends — each element visited once' }
    ],
    complexityCard: {
      summary: '1 Tape, 2 Heads: O(n)',
      benefit: 'Converging heads halve the number of comparisons vs. single-head O(n²).'
    }
  },
  'sandbox': {
    name: '⚗ Research Laboratory (Sandbox)',
    category: 'sandbox',
    isSandbox: true,
    description: 'Define your own k-tape Turing Machine with custom transition rules using formal Linz notation.',
    inputLabels: { tape1: 'Tape 1 Input', tape2: 'Tape 2 Input' },
    tapes: [
      { count: 1, presetKey: 'sandbox-1tape', timeComplexity: 'Custom', tcExplanation: 'Depends on your transition function δ' },
      { count: 2, presetKey: 'sandbox-2tape', timeComplexity: 'Custom', tcExplanation: 'A k-tape TM can be simulated by a single-tape TM (Linz, Thm. 8.5)' },
      { count: 3, presetKey: 'sandbox-3tape', timeComplexity: 'Custom', tcExplanation: 'Additional tapes may reduce time complexity from O(n²) to O(n)' },
      { count: 4, presetKey: 'sandbox-4tape', timeComplexity: 'Custom', tcExplanation: 'Maximum tape count for this laboratory' }
    ],
    complexityCard: {
      summary: 'Custom Machine — Define your own δ',
      benefit: 'Linz Thm 8.5: A k-tape TM can be simulated by a standard single-tape machine, but while a k-tape machine might operate in O(n) time, its single-tape equivalent may require O(n²) time.'
    }
  }
};

const PRESETS = {
  'palindrome-1tape': {
    name: 'Palindrome Checker (1-Tape)',
    description: 'Checks if a binary string is a palindrome by sweeping left and right to match outer pairs.',
    numTapes: 1,
    timeComplexity: 'O(n²)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'X', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1_O', 'q2_O', 'q1_I', 'q2_I', 'q3', 'q_acc', 'q_rej'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: ['q_rej'],
    defaultInput: '10101',
    stateDescriptions: {
      'q0': 'Find leftmost uncrossed bit',
      'q1_O': 'Remembered 0, scan right to end',
      'q2_O': 'Verify rightmost bit is 0, cross it',
      'q1_I': 'Remembered 1, scan right to end',
      'q2_I': 'Verify rightmost bit is 1, cross it',
      'q3': 'Return left to find next uncrossed bit',
      'q_acc': 'Accept — palindrome confirmed',
      'q_rej': 'Reject — mismatch found'
    },
    transitions: [
      { from: 'q0', read: ['0'], to: 'q1_O', write: ['X'], move: ['R'] },
      { from: 'q0', read: ['1'], to: 'q1_I', write: ['X'], move: ['R'] },
      { from: 'q0', read: ['B'], to: 'q_acc', write: ['B'], move: ['S'] },
      { from: 'q0', read: ['X'], to: 'q_acc', write: ['X'], move: ['S'] },
      { from: 'q1_O', read: ['0'], to: 'q1_O', write: ['0'], move: ['R'] },
      { from: 'q1_O', read: ['1'], to: 'q1_O', write: ['1'], move: ['R'] },
      { from: 'q1_O', read: ['B'], to: 'q2_O', write: ['B'], move: ['L'] },
      { from: 'q1_O', read: ['X'], to: 'q2_O', write: ['X'], move: ['L'] },
      { from: 'q2_O', read: ['0'], to: 'q3', write: ['X'], move: ['L'] },
      { from: 'q2_O', read: ['1'], to: 'q_rej', write: ['1'], move: ['S'] },
      { from: 'q2_O', read: ['X'], to: 'q_acc', write: ['X'], move: ['S'] },
      { from: 'q1_I', read: ['0'], to: 'q1_I', write: ['0'], move: ['R'] },
      { from: 'q1_I', read: ['1'], to: 'q1_I', write: ['1'], move: ['R'] },
      { from: 'q1_I', read: ['B'], to: 'q2_I', write: ['B'], move: ['L'] },
      { from: 'q1_I', read: ['X'], to: 'q2_I', write: ['X'], move: ['L'] },
      { from: 'q2_I', read: ['1'], to: 'q3', write: ['X'], move: ['L'] },
      { from: 'q2_I', read: ['0'], to: 'q_rej', write: ['0'], move: ['S'] },
      { from: 'q2_I', read: ['X'], to: 'q_acc', write: ['X'], move: ['S'] },
      { from: 'q3', read: ['0'], to: 'q3', write: ['0'], move: ['L'] },
      { from: 'q3', read: ['1'], to: 'q3', write: ['1'], move: ['L'] },
      { from: 'q3', read: ['X'], to: 'q0', write: ['X'], move: ['R'] },
    ]
  },
  'palindrome-2tape': {
    name: 'Palindrome Checker (2-Tape)',
    description: 'Checks if a binary string is a palindrome by copying to tape 2 in reverse, then comparing both tapes.',
    numTapes: 2,
    timeComplexity: 'O(n)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1', 'q2', 'q_acc', 'q_rej'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: ['q_rej'],
    defaultInput: '10101',
    guideText: 'Enter a binary string. The machine will copy it to Tape 2, rewind, and then compare both tapes simultaneously (<strong>$O(n)$ speed</strong>).',
    stateDescriptions: {
      'q0': 'Copy input to Tape 2',
      'q1': 'Rewind Tape 1 to start',
      'q2': 'Compare T1 forward with T2 backward',
      'q_acc': 'Accept — palindrome confirmed',
      'q_rej': 'Reject — not a palindrome'
    },
    transitions: [
      { from: 'q0', read: ['0', 'B'], to: 'q0', write: ['0', '0'], move: ['R', 'R'] },
      { from: 'q0', read: ['1', 'B'], to: 'q0', write: ['1', '1'], move: ['R', 'R'] },
      { from: 'q0', read: ['B', 'B'], to: 'q1', write: ['B', 'B'], move: ['L', 'L'] },
      { from: 'q1', read: ['0', 'B'], to: 'q1', write: ['0', 'B'], move: ['L', 'S'] },
      { from: 'q1', read: ['1', 'B'], to: 'q1', write: ['1', 'B'], move: ['L', 'S'] },
      { from: 'q1', read: ['0', '0'], to: 'q1', write: ['0', '0'], move: ['L', 'S'] },
      { from: 'q1', read: ['0', '1'], to: 'q1', write: ['0', '1'], move: ['L', 'S'] },
      { from: 'q1', read: ['1', '0'], to: 'q1', write: ['1', '0'], move: ['L', 'S'] },
      { from: 'q1', read: ['1', '1'], to: 'q1', write: ['1', '1'], move: ['L', 'S'] },
      { from: 'q1', read: ['B', '1'], to: 'q2', write: ['B', '1'], move: ['R', 'S'] },
      { from: 'q1', read: ['B', '0'], to: 'q2', write: ['B', '0'], move: ['R', 'S'] },
      { from: 'q2', read: ['0', '0'], to: 'q2', write: ['0', '0'], move: ['R', 'L'] },
      { from: 'q2', read: ['1', '1'], to: 'q2', write: ['1', '1'], move: ['R', 'L'] },
      { from: 'q2', read: ['0', '1'], to: 'q_rej', write: ['0', '1'], move: ['S', 'S'] },
      { from: 'q2', read: ['1', '0'], to: 'q_rej', write: ['1', '0'], move: ['S', 'S'] },
      { from: 'q2', read: ['B', 'B'], to: 'q_acc', write: ['B', 'B'], move: ['S', 'S'] },
    ],
  },

  'binary-add-2tape': {
    name: 'Binary Addition (2-Tape)',
    description: 'Adds two binary numbers. Tape 1 has first number, Tape 2 has second number. Result overwrites Tape 1.',
    numTapes: 2,
    timeComplexity: 'O(n)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1', 'q2', 'q3', 'q_acc'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: [],
    defaultInput: '1011',
    tape2Init: '0110',
    stateDescriptions: {
      'q0': 'Move to rightmost bit of both numbers',
      'q1': 'Add bits with no carry',
      'q2': 'Add bits with carry',
      'q3': 'Finalize result',
      'q_acc': 'Addition complete'
    },
    transitions: [
      { from: 'q0', read: ['0', '0'], to: 'q0', write: ['0', '0'], move: ['R', 'R'] },
      { from: 'q0', read: ['0', '1'], to: 'q0', write: ['0', '1'], move: ['R', 'R'] },
      { from: 'q0', read: ['1', '0'], to: 'q0', write: ['1', '0'], move: ['R', 'R'] },
      { from: 'q0', read: ['1', '1'], to: 'q0', write: ['1', '1'], move: ['R', 'R'] },
      { from: 'q0', read: ['B', 'B'], to: 'q1', write: ['B', 'B'], move: ['L', 'L'] },
      { from: 'q0', read: ['0', 'B'], to: 'q0', write: ['0', 'B'], move: ['R', 'S'] },
      { from: 'q0', read: ['1', 'B'], to: 'q0', write: ['1', 'B'], move: ['R', 'S'] },
      { from: 'q0', read: ['B', '0'], to: 'q0', write: ['B', '0'], move: ['S', 'R'] },
      { from: 'q0', read: ['B', '1'], to: 'q0', write: ['B', '1'], move: ['S', 'R'] },
      { from: 'q1', read: ['0', '0'], to: 'q1', write: ['0', '0'], move: ['L', 'L'] },
      { from: 'q1', read: ['0', '1'], to: 'q1', write: ['1', '1'], move: ['L', 'L'] },
      { from: 'q1', read: ['1', '0'], to: 'q1', write: ['1', '0'], move: ['L', 'L'] },
      { from: 'q1', read: ['1', '1'], to: 'q2', write: ['0', '1'], move: ['L', 'L'] },
      { from: 'q1', read: ['B', 'B'], to: 'q_acc', write: ['B', 'B'], move: ['S', 'S'] },
      { from: 'q1', read: ['0', 'B'], to: 'q1', write: ['0', 'B'], move: ['L', 'S'] },
      { from: 'q1', read: ['1', 'B'], to: 'q1', write: ['1', 'B'], move: ['L', 'S'] },
      { from: 'q1', read: ['B', '0'], to: 'q1', write: ['0', 'B'], move: ['S', 'L'] },
      { from: 'q1', read: ['B', '1'], to: 'q1', write: ['1', 'B'], move: ['S', 'L'] },
      { from: 'q2', read: ['0', '0'], to: 'q1', write: ['1', '0'], move: ['L', 'L'] },
      { from: 'q2', read: ['0', '1'], to: 'q2', write: ['0', '1'], move: ['L', 'L'] },
      { from: 'q2', read: ['1', '0'], to: 'q2', write: ['0', '0'], move: ['L', 'L'] },
      { from: 'q2', read: ['1', '1'], to: 'q2', write: ['1', '1'], move: ['L', 'L'] },
      { from: 'q2', read: ['B', 'B'], to: 'q_acc', write: ['1', 'B'], move: ['S', 'S'] },
      { from: 'q2', read: ['0', 'B'], to: 'q1', write: ['1', 'B'], move: ['L', 'S'] },
      { from: 'q2', read: ['1', 'B'], to: 'q2', write: ['0', 'B'], move: ['L', 'S'] },
      { from: 'q2', read: ['B', '0'], to: 'q1', write: ['1', 'B'], move: ['S', 'L'] },
      { from: 'q2', read: ['B', '1'], to: 'q2', write: ['0', 'B'], move: ['S', 'L'] },
    ]
  },

  'binary-add-3tape': {
    name: 'Binary Addition (3-Tape)',
    description: 'Adds two binary numbers with simpler logic: Input A on T1, Input B on T2, Result written to T3.',
    numTapes: 3,
    timeComplexity: 'O(n)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1', 'q2', 'q_acc'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: [],
    defaultInput: '1011',
    tape2Init: '0110',
    stateDescriptions: {
      'q0': 'Move to rightmost bit of A and B',
      'q1': 'Add bits (no carry), write result to T3',
      'q2': 'Add bits (carry), write result to T3',
      'q_acc': 'Addition complete — result on T3'
    },
    transitions: [
      { from: 'q0', read: ['0', '0', 'B'], to: 'q0', write: ['0', '0', 'B'], move: ['R', 'R', 'S'] },
      { from: 'q0', read: ['0', '1', 'B'], to: 'q0', write: ['0', '1', 'B'], move: ['R', 'R', 'S'] },
      { from: 'q0', read: ['1', '0', 'B'], to: 'q0', write: ['1', '0', 'B'], move: ['R', 'R', 'S'] },
      { from: 'q0', read: ['1', '1', 'B'], to: 'q0', write: ['1', '1', 'B'], move: ['R', 'R', 'S'] },
      { from: 'q0', read: ['B', 'B', 'B'], to: 'q1', write: ['B', 'B', 'B'], move: ['L', 'L', 'S'] },
      { from: 'q0', read: ['0', 'B', 'B'], to: 'q0', write: ['0', 'B', 'B'], move: ['R', 'S', 'S'] },
      { from: 'q0', read: ['1', 'B', 'B'], to: 'q0', write: ['1', 'B', 'B'], move: ['R', 'S', 'S'] },
      { from: 'q0', read: ['B', '0', 'B'], to: 'q0', write: ['B', '0', 'B'], move: ['S', 'R', 'S'] },
      { from: 'q0', read: ['B', '1', 'B'], to: 'q0', write: ['B', '1', 'B'], move: ['S', 'R', 'S'] },
      { from: 'q1', read: ['0', '0', 'B'], to: 'q1', write: ['0', '0', '0'], move: ['L', 'L', 'L'] },
      { from: 'q1', read: ['0', '1', 'B'], to: 'q1', write: ['0', '1', '1'], move: ['L', 'L', 'L'] },
      { from: 'q1', read: ['1', '0', 'B'], to: 'q1', write: ['1', '0', '1'], move: ['L', 'L', 'L'] },
      { from: 'q1', read: ['1', '1', 'B'], to: 'q2', write: ['1', '1', '0'], move: ['L', 'L', 'L'] },
      { from: 'q1', read: ['B', 'B', 'B'], to: 'q_acc', write: ['B', 'B', 'B'], move: ['S', 'S', 'R'] },
      { from: 'q1', read: ['0', 'B', 'B'], to: 'q1', write: ['0', 'B', '0'], move: ['L', 'S', 'L'] },
      { from: 'q1', read: ['1', 'B', 'B'], to: 'q1', write: ['1', 'B', '1'], move: ['L', 'S', 'L'] },
      { from: 'q1', read: ['B', '0', 'B'], to: 'q1', write: ['B', '0', '0'], move: ['S', 'L', 'L'] },
      { from: 'q1', read: ['B', '1', 'B'], to: 'q1', write: ['B', '1', '1'], move: ['S', 'L', 'L'] },
      { from: 'q2', read: ['0', '0', 'B'], to: 'q1', write: ['0', '0', '1'], move: ['L', 'L', 'L'] },
      { from: 'q2', read: ['0', '1', 'B'], to: 'q2', write: ['0', '1', '0'], move: ['L', 'L', 'L'] },
      { from: 'q2', read: ['1', '0', 'B'], to: 'q2', write: ['1', '0', '0'], move: ['L', 'L', 'L'] },
      { from: 'q2', read: ['1', '1', 'B'], to: 'q2', write: ['1', '1', '1'], move: ['L', 'L', 'L'] },
      { from: 'q2', read: ['B', 'B', 'B'], to: 'q_acc', write: ['B', 'B', '1'], move: ['S', 'S', 'S'] },
      { from: 'q2', read: ['0', 'B', 'B'], to: 'q1', write: ['0', 'B', '1'], move: ['L', 'S', 'L'] },
      { from: 'q2', read: ['1', 'B', 'B'], to: 'q2', write: ['1', 'B', '0'], move: ['L', 'S', 'L'] },
      { from: 'q2', read: ['B', '0', 'B'], to: 'q1', write: ['B', '0', '1'], move: ['S', 'L', 'L'] },
      { from: 'q2', read: ['B', '1', 'B'], to: 'q2', write: ['B', '1', '0'], move: ['S', 'L', 'L'] },
    ]
  },

  'string-copy-1tape': {
    name: 'String Copy (1-Tape)',
    description: 'Copies a binary string on a single tape by shuttling each symbol from source to destination zone. O(n²) due to repeated traversal.',
    numTapes: 1,
    timeComplexity: 'O(n²)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'X', 'Y', '#', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1_0', 'q1_1', 'q2_0', 'q2_1', 'q3', 'q_acc'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: [],
    defaultInput: '1101',
    stateDescriptions: {
      'q0': 'Place separator # then start copy loop',
      'q1_0': 'Carrying 0 — scan right past separator to dest',
      'q1_1': 'Carrying 1 — scan right past separator to dest',
      'q2_0': 'Write 0 at first blank in dest zone',
      'q2_1': 'Write 1 at first blank in dest zone',
      'q3': 'Return left to find next source symbol',
      'q_acc': 'Copy complete'
    },
    transitions: [
      { from: 'q0', read: ['0'], to: 'q1_0', write: ['X'], move: ['R'] },
      { from: 'q0', read: ['1'], to: 'q1_1', write: ['X'], move: ['R'] },
      { from: 'q0', read: ['#'], to: 'q_acc', write: ['#'], move: ['S'] },
      { from: 'q0', read: ['X'], to: 'q0', write: ['X'], move: ['R'] },
      { from: 'q1_0', read: ['0'], to: 'q1_0', write: ['0'], move: ['R'] },
      { from: 'q1_0', read: ['1'], to: 'q1_0', write: ['1'], move: ['R'] },
      { from: 'q1_0', read: ['X'], to: 'q1_0', write: ['X'], move: ['R'] },
      { from: 'q1_0', read: ['#'], to: 'q2_0', write: ['#'], move: ['R'] },
      { from: 'q1_0', read: ['B'], to: 'q2_0', write: ['#'], move: ['R'] },
      { from: 'q2_0', read: ['0'], to: 'q2_0', write: ['0'], move: ['R'] },
      { from: 'q2_0', read: ['1'], to: 'q2_0', write: ['1'], move: ['R'] },
      { from: 'q2_0', read: ['B'], to: 'q3', write: ['0'], move: ['L'] },
      { from: 'q1_1', read: ['0'], to: 'q1_1', write: ['0'], move: ['R'] },
      { from: 'q1_1', read: ['1'], to: 'q1_1', write: ['1'], move: ['R'] },
      { from: 'q1_1', read: ['X'], to: 'q1_1', write: ['X'], move: ['R'] },
      { from: 'q1_1', read: ['#'], to: 'q2_1', write: ['#'], move: ['R'] },
      { from: 'q1_1', read: ['B'], to: 'q2_1', write: ['#'], move: ['R'] },
      { from: 'q2_1', read: ['0'], to: 'q2_1', write: ['0'], move: ['R'] },
      { from: 'q2_1', read: ['1'], to: 'q2_1', write: ['1'], move: ['R'] },
      { from: 'q2_1', read: ['B'], to: 'q3', write: ['1'], move: ['L'] },
      { from: 'q3', read: ['0'], to: 'q3', write: ['0'], move: ['L'] },
      { from: 'q3', read: ['1'], to: 'q3', write: ['1'], move: ['L'] },
      { from: 'q3', read: ['#'], to: 'q3', write: ['#'], move: ['L'] },
      { from: 'q3', read: ['X'], to: 'q0', write: ['X'], move: ['R'] },
      { from: 'q3', read: ['B'], to: 'q0', write: ['B'], move: ['R'] },
    ]
  },

  'string-copy-2tape': {
    name: 'String Copy (2-Tape)',
    description: 'Copies a binary string from Tape 1 to Tape 2, demonstrating the efficiency of multi-tape machines.',
    numTapes: 2,
    timeComplexity: 'O(n)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1', 'q_acc'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: [],
    defaultInput: '110100',
    stateDescriptions: {
      'q0': 'Copy each symbol from Tape 1 to Tape 2',
      'q1': 'Rewind both tapes',
      'q_acc': 'Copy complete'
    },
    transitions: [
      { from: 'q0', read: ['0', 'B'], to: 'q0', write: ['0', '0'], move: ['R', 'R'] },
      { from: 'q0', read: ['1', 'B'], to: 'q0', write: ['1', '1'], move: ['R', 'R'] },
      { from: 'q0', read: ['B', 'B'], to: 'q1', write: ['B', 'B'], move: ['L', 'L'] },
      { from: 'q1', read: ['0', '0'], to: 'q1', write: ['0', '0'], move: ['L', 'L'] },
      { from: 'q1', read: ['1', '1'], to: 'q1', write: ['1', '1'], move: ['L', 'L'] },
      { from: 'q1', read: ['B', 'B'], to: 'q_acc', write: ['B', 'B'], move: ['R', 'R'] },
    ]
  },

  'bit-inverter': {
    name: 'Bit Inverter (1-Tape)',
    description: 'Inverts every bit on the tape: 0→1 and 1→0. A simple single-tape demonstration.',
    numTapes: 1,
    timeComplexity: 'O(n)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q_acc'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: [],
    defaultInput: '101010',
    stateDescriptions: {
      'q0': 'Scan and invert each bit',
      'q_acc': 'Inversion complete'
    },
    transitions: [
      { from: 'q0', read: ['0'], to: 'q0', write: ['1'], move: ['R'] },
      { from: 'q0', read: ['1'], to: 'q0', write: ['0'], move: ['R'] },
      { from: 'q0', read: ['B'], to: 'q_acc', write: ['B'], move: ['S'] },
    ]
  },

  'binary-increment': {
    name: 'Binary Increment (1-Tape)',
    description: 'Adds 1 to a binary number, handling carry propagation. Demonstrates state-based carry logic.',
    numTapes: 1,
    timeComplexity: 'O(n)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1', 'q2', 'q_acc'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: [],
    defaultInput: '1011',
    stateDescriptions: {
      'q0': 'Move to rightmost bit',
      'q1': 'Add 1 (carry)',
      'q2': 'Done adding, move right to end',
      'q_acc': 'Increment complete'
    },
    transitions: [
      { from: 'q0', read: ['0'], to: 'q0', write: ['0'], move: ['R'] },
      { from: 'q0', read: ['1'], to: 'q0', write: ['1'], move: ['R'] },
      { from: 'q0', read: ['B'], to: 'q1', write: ['B'], move: ['L'] },
      { from: 'q1', read: ['0'], to: 'q2', write: ['1'], move: ['L'] },
      { from: 'q1', read: ['1'], to: 'q1', write: ['0'], move: ['L'] },
      { from: 'q1', read: ['B'], to: 'q_acc', write: ['1'], move: ['S'] },
      { from: 'q2', read: ['0'], to: 'q2', write: ['0'], move: ['L'] },
      { from: 'q2', read: ['1'], to: 'q2', write: ['1'], move: ['L'] },
      { from: 'q2', read: ['B'], to: 'q_acc', write: ['B'], move: ['R'] },
    ]
  },

  // ===== FIXED UNARY DOUBLER =====
  // Two-phase approach: q0 writes first '1' of each pair, q1 writes second '1' and advances T1
  'unary-doubler-2tape': {
    name: 'Unary Doubler (2-Tape)',
    description: 'Doubles a unary number (string of 1s). For each 1 on Tape 1, writes two 1s on Tape 2.',
    numTapes: 2,
    timeComplexity: 'O(n)',
    inputAlphabet: ['1'],
    tapeAlphabet: ['1', 'B'],
    blankSymbol: 'B',
    states: ['q0', 'q1', 'q_acc'],
    initialState: 'q0',
    acceptStates: ['q_acc'],
    rejectStates: [],
    defaultInput: '111',
    stateDescriptions: {
      'q0': 'Read 1 on T1, write first 1 of pair on T2',
      'q1': 'Write second 1 of pair on T2, advance T1',
      'q_acc': 'Doubling complete'
    },
    transitions: [
      // q0: Read 1 on T1 → write first '1' on T2, stay on T1, advance T2
      { from: 'q0', read: ['1', 'B'], to: 'q1', write: ['1', '1'], move: ['S', 'R'] },
      // q0: Hit blank on T1 → done
      { from: 'q0', read: ['B', 'B'], to: 'q_acc', write: ['B', 'B'], move: ['S', 'S'] },
      // q1: Write second '1' on T2, advance both heads
      { from: 'q1', read: ['1', 'B'], to: 'q0', write: ['1', '1'], move: ['R', 'R'] },
    ]
  },

  // ===== MULTI-HEAD MACHINES =====
  'substring-search-multihead': {
    name: 'Substring Search (Multi-Head)',
    description: 'Searches for pattern in text. Head 1 anchors, Head 2 scans pattern seamlessly.',
    numTapes: 2,
    isMultiHead: true,
    timeComplexity: 'O(n × m)',
    inputAlphabet: ['0', '1', '§'],
    tapeAlphabet: ['0', '1', '§', 'B'],
    blankSymbol: 'B',
    states: ['q_init', 'q_init_found', 'q_compare', 'q_backtrack', 'q_align', 'q_acc', 'q_rej'],
    initialState: 'q_init',
    acceptStates: ['q_acc'],
    rejectStates: ['q_rej'],
    defaultInput: '100111',
    tape2Init: '11',
    inputLabels: { tape1: 'Main Text', tape2: 'Target Pattern' },
    guideText: 'Enter your <strong>Main Text</strong> in the first box and the <strong>Target Pattern</strong> in the second. The machine will logically tether them and search bounds gracefully.',
    stateDescriptions: {
      'q_init': 'Head 2 seeks the target pattern bounds',
      'q_init_found': 'Bounds located; Head 2 steps to start of pattern',
      'q_compare': 'Comparing text (H1) with pattern (H2) simultaneously',
      'q_backtrack': 'Mismatch found; Both heads rewind symmetrically',
      'q_align': 'Re-aligning H1 to start+1 for next attempt',
      'q_acc': 'Accept — Pattern fully matched!',
      'q_rej': 'Reject — Pattern not found in text'
    },
    transitions: [
      { from: 'q_init', read: ['0', '0'], to: 'q_init', write: ['0', '0'], move: ['S', 'R'] },
      { from: 'q_init', read: ['1', '0'], to: 'q_init', write: ['1', '0'], move: ['S', 'R'] },
      { from: 'q_init', read: ['0', '1'], to: 'q_init', write: ['0', '1'], move: ['S', 'R'] },
      { from: 'q_init', read: ['1', '1'], to: 'q_init', write: ['1', '1'], move: ['S', 'R'] },
      { from: 'q_init', read: ['0', '§'], to: 'q_init_found', write: ['0', '§'], move: ['S', 'R'] },
      { from: 'q_init', read: ['1', '§'], to: 'q_init_found', write: ['1', '§'], move: ['S', 'R'] },
      { from: 'q_init', read: ['§', '§'], to: 'q_init_found', write: ['§', '§'], move: ['S', 'R'] },

      { from: 'q_init_found', read: ['0', '0'], to: 'q_compare', write: ['0', '0'], move: ['S', 'S'] },
      { from: 'q_init_found', read: ['0', '1'], to: 'q_compare', write: ['0', '1'], move: ['S', 'S'] },
      { from: 'q_init_found', read: ['1', '0'], to: 'q_compare', write: ['1', '0'], move: ['S', 'S'] },
      { from: 'q_init_found', read: ['1', '1'], to: 'q_compare', write: ['1', '1'], move: ['S', 'S'] },
      { from: 'q_init_found', read: ['0', 'B'], to: 'q_acc', write: ['0', 'B'], move: ['S', 'S'] },
      { from: 'q_init_found', read: ['1', 'B'], to: 'q_acc', write: ['1', 'B'], move: ['S', 'S'] },
      { from: 'q_init_found', read: ['§', 'B'], to: 'q_acc', write: ['§', 'B'], move: ['S', 'S'] },

      { from: 'q_compare', read: ['0', '0'], to: 'q_compare', write: ['0', '0'], move: ['R', 'R'] },
      { from: 'q_compare', read: ['1', '1'], to: 'q_compare', write: ['1', '1'], move: ['R', 'R'] },
      { from: 'q_compare', read: ['0', 'B'], to: 'q_acc', write: ['0', 'B'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['1', 'B'], to: 'q_acc', write: ['1', 'B'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['§', 'B'], to: 'q_acc', write: ['§', 'B'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['B', 'B'], to: 'q_acc', write: ['B', 'B'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['§', '0'], to: 'q_rej', write: ['§', '0'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['§', '1'], to: 'q_rej', write: ['§', '1'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['B', '0'], to: 'q_rej', write: ['B', '0'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['B', '1'], to: 'q_rej', write: ['B', '1'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['0', '1'], to: 'q_backtrack', write: ['0', '1'], move: ['S', 'S'] },
      { from: 'q_compare', read: ['1', '0'], to: 'q_backtrack', write: ['1', '0'], move: ['S', 'S'] },

      { from: 'q_backtrack', read: ['0', '0'], to: 'q_backtrack', write: ['0', '0'], move: ['L', 'L'] },
      { from: 'q_backtrack', read: ['0', '1'], to: 'q_backtrack', write: ['0', '1'], move: ['L', 'L'] },
      { from: 'q_backtrack', read: ['1', '0'], to: 'q_backtrack', write: ['1', '0'], move: ['L', 'L'] },
      { from: 'q_backtrack', read: ['1', '1'], to: 'q_backtrack', write: ['1', '1'], move: ['L', 'L'] },
      { from: 'q_backtrack', read: ['B', '0'], to: 'q_backtrack', write: ['B', '0'], move: ['S', 'L'] },
      { from: 'q_backtrack', read: ['B', '1'], to: 'q_backtrack', write: ['B', '1'], move: ['S', 'L'] },
      { from: 'q_backtrack', read: ['0', '§'], to: 'q_align', write: ['0', '§'], move: ['R', 'R'] },
      { from: 'q_backtrack', read: ['1', '§'], to: 'q_align', write: ['1', '§'], move: ['R', 'R'] },
      { from: 'q_backtrack', read: ['B', '§'], to: 'q_align', write: ['B', '§'], move: ['R', 'R'] },
      { from: 'q_backtrack', read: ['§', '§'], to: 'q_align', write: ['§', '§'], move: ['R', 'R'] },

      { from: 'q_align', read: ['0', '0'], to: 'q_compare', write: ['0', '0'], move: ['R', 'S'] },
      { from: 'q_align', read: ['0', '1'], to: 'q_compare', write: ['0', '1'], move: ['R', 'S'] },
      { from: 'q_align', read: ['1', '0'], to: 'q_compare', write: ['1', '0'], move: ['R', 'S'] },
      { from: 'q_align', read: ['1', '1'], to: 'q_compare', write: ['1', '1'], move: ['R', 'S'] },
      { from: 'q_align', read: ['§', '0'], to: 'q_rej', write: ['§', '0'], move: ['S', 'S'] },
      { from: 'q_align', read: ['§', '1'], to: 'q_rej', write: ['§', '1'], move: ['S', 'S'] },
      { from: 'q_align', read: ['0', '§'], to: 'q_compare', write: ['0', '§'], move: ['R', 'S'] },
      { from: 'q_align', read: ['1', '§'], to: 'q_compare', write: ['1', '§'], move: ['R', 'S'] }
    ]
  },

  // ===== SYNCHRONIZED PARITY CHECK (Multi-Head) =====
  // Head A starts at beginning, Head B starts at end. They converge inward.
  // Accepts if the string is a palindrome (symmetry check).
  'sync-parity-multihead': {
    name: 'Synchronized Parity Check (Multi-Head)',
    description: 'Head A starts at the beginning, Head B at the end. They sweep inward, overwriting symmetric bits with X. Instantly rejects asymmetric pairs.',
    numTapes: 2,
    isMultiHead: true,
    timeComplexity: 'O(n)',
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'X', 'B'],
    blankSymbol: 'B',
    states: ['q_seek', 'q_check', 'q_acc', 'q_rej'],
    initialState: 'q_seek',
    acceptStates: ['q_acc'],
    rejectStates: ['q_rej'],
    defaultInput: '101101',
    tape2Init: '',
    tape2Disabled: true,
    guideText: 'Provide a binary string. The twin heads will scan inward symmetrically. Any discrepancy between opposite poles immediately terminates verification.',
    stateDescriptions: {
      'q_seek': 'Head B eagerly seeks the terminal space of the tape',
      'q_check': 'Symmetrical convergence: erasing matching bits with X',
      'q_acc': 'Accept — Full parity achieved in the center!',
      'q_rej': 'Reject — Structural parity broken'
    },
    transitions: [
      { from: 'q_seek', read: ['0', '0'], to: 'q_seek', write: ['0', '0'], move: ['S', 'R'] },
      { from: 'q_seek', read: ['0', '1'], to: 'q_seek', write: ['0', '1'], move: ['S', 'R'] },
      { from: 'q_seek', read: ['1', '0'], to: 'q_seek', write: ['1', '0'], move: ['S', 'R'] },
      { from: 'q_seek', read: ['1', '1'], to: 'q_seek', write: ['1', '1'], move: ['S', 'R'] },
      { from: 'q_seek', read: ['B', 'B'], to: 'q_acc', write: ['B', 'B'], move: ['S', 'S'] }, // empty string

      { from: 'q_seek', read: ['0', 'B'], to: 'q_check', write: ['0', 'B'], move: ['S', 'L'] },
      { from: 'q_seek', read: ['1', 'B'], to: 'q_check', write: ['1', 'B'], move: ['S', 'L'] },

      { from: 'q_check', read: ['0', '0'], to: 'q_check', write: ['X', 'X'], move: ['R', 'L'] },
      { from: 'q_check', read: ['1', '1'], to: 'q_check', write: ['X', 'X'], move: ['R', 'L'] },
      { from: 'q_check', read: ['0', '1'], to: 'q_rej', write: ['0', '1'], move: ['S', 'S'] },
      { from: 'q_check', read: ['1', '0'], to: 'q_rej', write: ['1', '0'], move: ['S', 'S'] },

      { from: 'q_check', read: ['X', 'X'], to: 'q_acc', write: ['X', 'X'], move: ['S', 'S'] },
      { from: 'q_check', read: ['B', 'B'], to: 'q_acc', write: ['B', 'B'], move: ['S', 'S'] },
    ]
  },

  // ===== SANDBOX PRESETS (dynamically generated base configs) =====
  'sandbox-1tape': {
    name: 'Research Laboratory (1-Tape)',
    description: 'A blank 1-tape Turing Machine. Define your own transition function δ.',
    numTapes: 1,
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
  },
  'sandbox-2tape': {
    name: 'Research Laboratory (2-Tape)',
    description: 'A blank 2-tape Turing Machine. Define your own transition function δ.',
    numTapes: 2,
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
  },
  'sandbox-3tape': {
    name: 'Research Laboratory (3-Tape)',
    description: 'A blank 3-tape Turing Machine. Define your own transition function δ.',
    numTapes: 3,
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
  },
  'sandbox-4tape': {
    name: 'Research Laboratory (4-Tape)',
    description: 'A blank 4-tape Turing Machine. Define your own transition function δ.',
    numTapes: 4,
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
  }
};
