// // Calculate the result of the current expression
// function calculateResult() {
//     if (!calculatorState.currentExpression.trim()) {
//         calculatorState.currentResult = '0';
//         updateDisplay();
//         return;
//     }
//
//     fetch('/api/calculate/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'X-CSRFToken': getCSRFToken(),
//         },
//         body: JSON.stringify({
//             type: calculatorState.currentTab,
//             expression: calculatorState.currentExpression,
//             action: 'calculate'
//         })
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 calculatorState.currentResult = data.result.toString();
//                 addToHistory(calculatorState.currentExpression, data.result, calculatorState.currentTab);
//             } else {
//                 calculatorState.currentResult = 'Error: ' + data.error;
//             }
//             updateDisplay();
//         })
//         .catch(error => {
//             calculatorState.currentResult = 'Network error';
//             updateDisplay();
//         });
// }
//
// // Format number with specified decimal places
// function formatNumber(num) {
//     if (typeof num === 'string' && (num === 'Infinity' || num === '-Infinity' || num === 'NaN' || num.includes('Error'))) {
//         return num;
//     }
//
//     const numFloat = parseFloat(num);
//     if (isNaN(numFloat) || !isFinite(numFloat)) {
//         return 'Error';
//     }
//
//     // If it's an integer, don't show decimal places
//     if (Number.isInteger(numFloat)) {
//         return numFloat.toString();
//     }
//
//     // Format with specified decimal places, removing trailing zeros
//     const formatted = numFloat.toFixed(calculatorState.decimalPlaces);
//     return parseFloat(formatted).toString();
// }
//
// // Update the calculator display
// function updateDisplay() {
//     // Update expression and result for the current tab
//     const currentExpressionElement = document.getElementById(`${calculatorState.currentTab}-expression`);
//     const currentResultElement = document.getElementById(`${calculatorState.currentTab}-result`);
//
//     if (currentExpressionElement && calculatorState.currentTab !== 'graph') {
//         currentExpressionElement.textContent = calculatorState.currentExpression || '0';
//     }
//
//     if (currentResultElement) {
//         currentResultElement.textContent = calculatorState.currentResult;
//     }
//
//     // Update recent history in sidebar
//     updateRecentHistory();
// }
//
// // Add calculation to history
// function addToHistory(expression, result, type) {
//     const historyItem = {
//         expression,
//         result,
//         type,
//         timestamp: new Date().toISOString()
//     };
//
//     calculatorState.history.unshift(historyItem);
//
//     // Keep only the last 100 items
//     if (calculatorState.history.length > 100) {
//         calculatorState.history = calculatorState.history.slice(0, 100);
//     }
//
//     // Save to localStorage
//     try {
//         localStorage.setItem('calculatorHistory', JSON.stringify(calculatorState.history));
//     } catch (error) {
//         console.warn('Could not save history:', error);
//     }
// }
//
// // Load history from localStorage
// function loadHistory() {
//     try {
//         const savedHistory = localStorage.getItem('calculatorHistory');
//         if (savedHistory) {
//             calculatorState.history = JSON.parse(savedHistory);
//         }
//     } catch (error) {
//         console.warn('Could not load history:', error);
//         calculatorState.history = [];
//     }
// }
//
// // Display history in the history tab
// function displayHistory() {
//     if (!historyList) return;
//
//     historyList.innerHTML = '';
//
//     if (calculatorState.history.length === 0) {
//         historyList.innerHTML = '<div class="history-item">No calculations yet</div>';
//         const historyCount = document.getElementById('history-count');
//         if (historyCount) historyCount.textContent = '0 calculations';
//         return;
//     }
//
//     calculatorState.history.forEach((item, index) => {
//         const historyItem = document.createElement('div');
//         historyItem.className = 'history-item';
//         historyItem.innerHTML = `
//             <div class="history-expression">${item.expression}</div>
//             <div class="history-result">= ${item.result}</div>
//             <div style="font-size: 0.8rem; color: #aaa;">${new Date(item.timestamp).toLocaleString()}</div>
//         `;
//
//         historyItem.addEventListener('click', () => {
//             // Use this calculation
//             if (calculatorState.currentTab === 'basic' || calculatorState.currentTab === 'scientific') {
//                 calculatorState.currentExpression = item.expression;
//                 calculatorState.currentResult = item.result.toString();
//                 updateDisplay();
//                 switchTab('basic');
//             }
//         });
//
//         historyList.appendChild(historyItem);
//     });
//
//     const historyCount = document.getElementById('history-count');
//     if (historyCount) historyCount.textContent = `${calculatorState.history.length} calculations`;
// }
//
// // Update recent history in sidebar
// function updateRecentHistory() {
//     if (!recentHistory) return;
//
//     recentHistory.innerHTML = '';
//
//     const recentItems = calculatorState.history.slice(0, 5);
//
//     if (recentItems.length === 0) {
//         recentHistory.innerHTML = '<div class="history-item">No recent calculations</div>';
//         return;
//     }
//
//     recentItems.forEach(item => {
//         const historyItem = document.createElement('div');
//         historyItem.className = 'history-item';
//         historyItem.innerHTML = `
//             <div class="history-expression">${item.expression}</div>
//             <div class="history-result">= ${item.result}</div>
//         `;
//
//         historyItem.addEventListener('click', () => {
//             // Use this calculation
//             if (calculatorState.currentTab === 'basic' || calculatorState.currentTab === 'scientific') {
//                 calculatorState.currentExpression = item.expression;
//                 calculatorState.currentResult = item.result.toString();
//                 updateDisplay();
//                 switchTab(calculatorState.currentTab);
//             }
//         });
//
//         recentHistory.appendChild(historyItem);
//     });
// }
//
// // Clear history
// function clearHistory() {
//     calculatorState.history = [];
//     localStorage.removeItem('calculatorHistory');
//     displayHistory();
//     updateRecentHistory();
// }
//
// // Set theme
// function setTheme(theme) {
//     calculatorState.theme = theme;
//     document.body.className = `theme-${theme}`;
//
//     // Update active theme option
//     themeOptions.forEach(option => {
//         if (option.getAttribute('data-theme') === theme) {
//             option.classList.add('active');
//         } else {
//             option.classList.remove('active');
//         }
//     });
//
//     savePreferences();
// }
//
// // Get CSRF token for Django
// function getCSRFToken() {
//     const name = 'csrftoken';
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }
//
// // Keyboard support
// function setupKeyboardSupport() {
//     document.addEventListener('keydown', function (e) {
//         if (calculatorState.currentTab !== 'basic' && calculatorState.currentTab !== 'scientific') {
//             return;
//         }
//
//         // Prevent default for calculator keys
//         if (/[0-9\+\-\*\/\.\=\(\)]/.test(e.key) || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Escape') {
//             e.preventDefault();
//         }
//
//         switch (e.key) {
//             case '0':
//             case '1':
//             case '2':
//             case '3':
//             case '4':
//             case '5':
//             case '6':
//             case '7':
//             case '8':
//             case '9':
//             case '.':
//                 appendToExpression(e.key);
//                 break;
//             case '+':
//             case '-':
//             case '*':
//             case '/':
//                 appendToExpression(` ${e.key} `);
//                 break;
//             case '(':
//             case ')':
//                 appendToExpression(e.key);
//                 break;
//             case 'Enter':
//             case '=':
//                 calculateResult();
//                 break;
//             case 'Backspace':
//                 handleAction('backspace');
//                 break;
//             case 'Delete':
//             case 'Escape':
//                 handleAction('clear');
//                 break;
//         }
//     });
// }
//
// // Initialize the calculator when the page loads
// function initApp() {
//     // Check if we're in a Django template or standalone
//     if (typeof django === 'undefined') {
//         // Standalone mode - set up mock CSRF token
//         document.cookie = 'csrftoken=mock-token';
//     }
//
//     initCalculator();
//     setupKeyboardSupport();
//
//     // Auto-save preferences periodically
//     setInterval(savePreferences, 30000); // Save every 30 seconds
// }
//
// // Initialize when DOM is loaded
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initApp);
// } else {
//     initApp();
// }// Calculator state
// const calculatorState = {
//     currentTab: 'basic',
//     currentExpression: '',
//     currentResult: '0',
//     memory: 0,
//     angleUnit: 'rad',
//     decimalPlaces: 10,
//     theme: 'dark',
//     history: [],
//     matrixSize: 3,
//     graphRange: {xMin: -10, xMax: 10, yMin: -10, yMax: 10}
// };
//
// // DOM elements
// const tabs = document.querySelectorAll('.tab');
// const calculatorTabs = document.querySelectorAll('.calculator-tab');
// const expressions = document.querySelectorAll('.expression');
// const results = document.querySelectorAll('.result');
// const basicButtons = document.querySelectorAll('#basic-calculator .btn');
// const scientificButtons = document.querySelectorAll('#scientific-calculator .btn');
// const matrixButtons = document.querySelectorAll('#matrix-calculator .btn');
// const graphButtons = document.querySelectorAll('#graph-calculator .btn');
// const historyList = document.getElementById('history-list');
// const recentHistory = document.getElementById('recent-history');
// const clearHistoryBtn = document.getElementById('clear-history');
// const themeOptions = document.querySelectorAll('.theme-option');
// const angleUnitSetting = document.getElementById('angle-unit-setting');
// const decimalPlacesSetting = document.getElementById('decimal-places-setting');
// const decimalPlacesValue = document.getElementById('decimal-places-value');
// const memoryValueDisplay = document.getElementById('memory-value');
// const memoryButtons = {
//     store: document.getElementById('memory-store'),
//     recall: document.getElementById('memory-recall'),
//     clear: document.getElementById('memory-clear'),
//     add: document.getElementById('memory-add'),
//     subtract: document.getElementById('memory-subtract')
// };
// const matrixSizeSelector = document.getElementById('matrix-size');
// const clearMatrixBtn = document.getElementById('clear-matrix');
// const identityMatrixBtn = document.getElementById('identity-matrix');
// const matrixInputContainer = document.getElementById('matrix-input-container');
// const matrixResultDisplay = document.getElementById('matrix-result-display');
//
// // Graph elements
// const functionInput = document.getElementById('function-input');
// const graphCanvas = document.getElementById('graph-canvas');
// const graphSvg = document.getElementById('graph-svg');
// const functionPath = document.getElementById('function-path');
// const scaleMarkers = document.getElementById('scale-markers');
// const xMinInput = document.getElementById('x-min');
// const xMaxInput = document.getElementById('x-max');
// const yMinInput = document.getElementById('y-min');
// const yMaxInput = document.getElementById('y-max');
// const exampleButtons = document.querySelectorAll('.btn-example');
//
// // Initialize calculator
// function initCalculator() {
//     loadPreferences();
//     setupEventListeners();
//     generateMatrixInput(calculatorState.matrixSize);
//     updateDisplay();
//     loadHistory();
//     setupGraphScale();
//     setupUnitConverter();
// }
//
// // Load user preferences
// function loadPreferences() {
//     try {
//         const savedPreferences = localStorage.getItem('calculatorPreferences');
//         if (savedPreferences) {
//             const preferences = JSON.parse(savedPreferences);
//             calculatorState.theme = preferences.theme || 'dark';
//             calculatorState.angleUnit = preferences.angleUnit || 'rad';
//             calculatorState.decimalPlaces = preferences.decimalPlaces || 10;
//             calculatorState.memory = preferences.memory || 0;
//             calculatorState.matrixSize = preferences.matrixSize || 3;
//             calculatorState.graphRange = preferences.graphRange || {xMin: -10, xMax: 10, yMin: -10, yMax: 10};
//         }
//     } catch (error) {
//         console.warn('Could not load preferences:', error);
//     }
//
//     // Apply theme
//     document.body.className = `theme-${calculatorState.theme}`;
//
//     // Update settings UI
//     const activeTheme = document.querySelector(`.theme-option[data-theme="${calculatorState.theme}"]`);
//     if (activeTheme) activeTheme.classList.add('active');
//
//     if (angleUnitSetting) angleUnitSetting.value = calculatorState.angleUnit;
//     if (decimalPlacesSetting) decimalPlacesSetting.value = calculatorState.decimalPlaces;
//     if (decimalPlacesValue) decimalPlacesValue.textContent = calculatorState.decimalPlaces;
//     if (memoryValueDisplay) memoryValueDisplay.textContent = formatNumber(calculatorState.memory);
//     if (matrixSizeSelector) matrixSizeSelector.value = calculatorState.matrixSize;
//
//     // Update graph range inputs
//     if (xMinInput) xMinInput.value = calculatorState.graphRange.xMin;
//     if (xMaxInput) xMaxInput.value = calculatorState.graphRange.xMax;
//     if (yMinInput) yMinInput.value = calculatorState.graphRange.yMin;
//     if (yMaxInput) yMaxInput.value = calculatorState.graphRange.yMax;
// }
//
// // Save preferences
// function savePreferences() {
//     try {
//         const preferences = {
//             theme: calculatorState.theme,
//             angleUnit: calculatorState.angleUnit,
//             decimalPlaces: calculatorState.decimalPlaces,
//             memory: calculatorState.memory,
//             matrixSize: calculatorState.matrixSize,
//             graphRange: calculatorState.graphRange
//         };
//         localStorage.setItem('calculatorPreferences', JSON.stringify(preferences));
//     } catch (error) {
//         console.warn('Could not save preferences:', error);
//     }
// }
//
// // Generate matrix input with proper placeholder behavior
// function generateMatrixInput(size) {
//     if (!matrixInputContainer) return;
//
//     matrixInputContainer.innerHTML = '';
//
//     for (let i = 0; i < size; i++) {
//         const row = document.createElement('div');
//         row.className = 'matrix-row';
//
//         for (let j = 0; j < size; j++) {
//             const cell = document.createElement('input');
//             cell.type = 'text';
//             cell.className = 'matrix-cell';
//             cell.id = `m${i}${j}`;
//             cell.placeholder = '0';
//             cell.value = ''; // Start empty instead of pre-filled
//
//             // Handle placeholder behavior
//             cell.addEventListener('focus', function () {
//                 if (this.value === '' || this.value === '0') {
//                     this.value = '';
//                 }
//                 this.select();
//             });
//
//             cell.addEventListener('blur', function () {
//                 if (this.value === '') {
//                     this.value = '';
//                 }
//             });
//
//             cell.addEventListener('input', function () {
//                 // Remove non-numeric characters except for decimal point and minus
//                 this.value = this.value.replace(/[^-0-9.]/g, '');
//             });
//
//             row.appendChild(cell);
//         }
//
//         matrixInputContainer.appendChild(row);
//     }
// }
//
// // Get matrix data from input
// function getMatrixData() {
//     const size = calculatorState.matrixSize;
//     const matrix = [];
//
//     for (let i = 0; i < size; i++) {
//         const row = [];
//         for (let j = 0; j < size; j++) {
//             const cellValue = document.getElementById(`m${i}${j}`).value;
//             const value = cellValue === '' ? 0 : parseFloat(cellValue) || 0;
//             row.push(value);
//         }
//         matrix.push(row);
//     }
//
//     return matrix;
// }
//
// // Setup graph scale and axes
// function setupGraphScale() {
//     if (!scaleMarkers) return;
//
//     scaleMarkers.innerHTML = '';
//
//     const {xMin, xMax, yMin, yMax} = calculatorState.graphRange;
//     const width = 600;
//     const height = 400;
//
//     // X-axis scale markers
//     const xStep = (xMax - xMin) / 10;
//     for (let i = 0; i <= 10; i++) {
//         const x = (i / 10) * width;
//         const value = xMin + i * xStep;
//
//         if (Math.abs(value) > 0.001) {
//             const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//             text.setAttribute('x', x);
//             text.setAttribute('y', height / 2 + 20);
//             text.setAttribute('text-anchor', 'middle');
//             text.setAttribute('fill', 'rgba(255,255,255,0.6)');
//             text.setAttribute('font-size', '10');
//             text.textContent = value.toFixed(1);
//             scaleMarkers.appendChild(text);
//         }
//     }
//
//     // Y-axis scale markers
//     const yStep = (yMax - yMin) / 10;
//     for (let i = 0; i <= 10; i++) {
//         const y = height - (i / 10) * height;
//         const value = yMin + i * yStep;
//
//         if (Math.abs(value) > 0.001) {
//             const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//             text.setAttribute('x', width / 2 - 15);
//             text.setAttribute('y', y + 5);
//             text.setAttribute('text-anchor', 'middle');
//             text.setAttribute('fill', 'rgba(255,255,255,0.6)');
//             text.setAttribute('font-size', '10');
//             text.textContent = value.toFixed(1);
//             scaleMarkers.appendChild(text);
//         }
//     }
// }
//
// // Setup unit converter
// function setupUnitConverter() {
//     const unitType = document.getElementById('unit-type');
//     const unitFrom = document.getElementById('unit-from');
//     const unitTo = document.getElementById('unit-to');
//     const convertBtn = document.getElementById('convert-units');
//
//     if (!unitType || !unitFrom || !unitTo || !convertBtn) return;
//
//     const unitOptions = {
//         angle: [
//             {value: 'rad', label: 'Radians'},
//             {value: 'deg', label: 'Degrees'},
//             {value: 'grad', label: 'Gradians'}
//         ],
//         length: [
//             {value: 'm', label: 'Meters'},
//             {value: 'ft', label: 'Feet'},
//             {value: 'in', label: 'Inches'},
//             {value: 'cm', label: 'Centimeters'}
//         ],
//         temperature: [
//             {value: 'c', label: 'Celsius'},
//             {value: 'f', label: 'Fahrenheit'},
//             {value: 'k', label: 'Kelvin'}
//         ]
//     };
//
//     unitType.addEventListener('change', function () {
//         const selectedType = this.value;
//         const options = unitOptions[selectedType] || [];
//
//         unitFrom.innerHTML = '';
//         unitTo.innerHTML = '';
//
//         options.forEach(option => {
//             const fromOption = new Option(option.label, option.value);
//             const toOption = new Option(option.label, option.value);
//             unitFrom.add(fromOption);
//             unitTo.add(toOption.cloneNode(true));
//         });
//
//         if (options.length > 1) {
//             unitTo.selectedIndex = 1;
//         }
//     });
//
//     // Initialize with angle units
//     unitType.dispatchEvent(new Event('change'));
// }
//
// // Setup event listeners
// function setupEventListeners() {
//     // Tab switching
//     tabs.forEach(tab => {
//         tab.addEventListener('click', () => {
//             const tabName = tab.getAttribute('data-tab');
//             switchTab(tabName);
//         });
//     });
//
//     // Calculator buttons
//     if (basicButtons) {
//         basicButtons.forEach(button => {
//             button.addEventListener('click', handleBasicButtonClick);
//         });
//     }
//
//     if (scientificButtons) {
//         scientificButtons.forEach(button => {
//             button.addEventListener('click', handleScientificButtonClick);
//         });
//     }
//
//     if (matrixButtons) {
//         matrixButtons.forEach(button => {
//             button.addEventListener('click', handleMatrixButtonClick);
//         });
//     }
//
//     if (graphButtons) {
//         graphButtons.forEach(button => {
//             button.addEventListener('click', handleGraphButtonClick);
//         });
//     }
//
//     // Function input for graph calculator
//     if (functionInput) {
//         functionInput.addEventListener('keydown', function (e) {
//             if (e.key === 'Enter') {
//                 e.preventDefault();
//                 handleGraphAction('plot');
//             }
//         });
//
//         functionInput.addEventListener('input', function () {
//             const graphResult = document.getElementById('graph-result');
//             if (graphResult) {
//                 graphResult.textContent = this.value ? `f(x) = ${this.value}` : 'Enter function to graph';
//             }
//         });
//     }
//
//     // Example function buttons
//     if (exampleButtons) {
//         exampleButtons.forEach(button => {
//             button.addEventListener('click', function () {
//                 const func = this.getAttribute('data-function');
//                 if (functionInput) {
//                     functionInput.value = func;
//                     functionInput.dispatchEvent(new Event('input'));
//                 }
//             });
//         });
//     }
//
//     // Graph range inputs
//     const rangeInputs = [xMinInput, xMaxInput, yMinInput, yMaxInput];
//     rangeInputs.forEach(input => {
//         if (input) {
//             input.addEventListener('change', function () {
//                 calculatorState.graphRange = {
//                     xMin: parseFloat(xMinInput.value) || -10,
//                     xMax: parseFloat(xMaxInput.value) || 10,
//                     yMin: parseFloat(yMinInput.value) || -10,
//                     yMax: parseFloat(yMaxInput.value) || 10
//                 };
//                 setupGraphScale();
//                 savePreferences();
//             });
//         }
//     });
//
//     // History controls
//     if (clearHistoryBtn) {
//         clearHistoryBtn.addEventListener('click', clearHistory);
//     }
//
//     // Theme selection
//     themeOptions.forEach(option => {
//         option.addEventListener('click', () => {
//             const theme = option.getAttribute('data-theme');
//             setTheme(theme);
//         });
//     });
//
//     // Settings
//     if (angleUnitSetting) {
//         angleUnitSetting.addEventListener('change', (e) => {
//             calculatorState.angleUnit = e.target.value;
//             savePreferences();
//         });
//     }
//
//     if (decimalPlacesSetting) {
//         decimalPlacesSetting.addEventListener('input', (e) => {
//             calculatorState.decimalPlaces = parseInt(e.target.value);
//             if (decimalPlacesValue) decimalPlacesValue.textContent = calculatorState.decimalPlaces;
//             savePreferences();
//         });
//     }
//
//     // Memory operations
//     setupMemoryButtons();
//
//     // Matrix controls
//     if (matrixSizeSelector) {
//         matrixSizeSelector.addEventListener('change', (e) => {
//             calculatorState.matrixSize = parseInt(e.target.value);
//             generateMatrixInput(calculatorState.matrixSize);
//             savePreferences();
//         });
//     }
//
//     if (clearMatrixBtn) {
//         clearMatrixBtn.addEventListener('click', () => {
//             generateMatrixInput(calculatorState.matrixSize);
//             if (matrixResultDisplay) matrixResultDisplay.classList.add('hidden');
//         });
//     }
//
//     if (identityMatrixBtn) {
//         identityMatrixBtn.addEventListener('click', () => {
//             const size = calculatorState.matrixSize;
//             for (let i = 0; i < size; i++) {
//                 for (let j = 0; j < size; j++) {
//                     const cell = document.getElementById(`m${i}${j}`);
//                     if (cell) {
//                         cell.value = i === j ? '1' : '0';
//                     }
//                 }
//             }
//         });
//     }
//
//     // Constants buttons
//     const constantButtons = document.querySelectorAll('.constant-btn');
//     constantButtons.forEach(button => {
//         button.addEventListener('click', function () {
//             const constant = this.getAttribute('data-constant');
//             let value = '';
//             switch (constant) {
//                 case 'pi':
//                     value = Math.PI.toString();
//                     break;
//                 case 'e':
//                     value = Math.E.toString();
//                     break;
//                 case 'phi':
//                     value = '1.618033988749';
//                     break;
//                 case 'sqrt2':
//                     value = Math.SQRT2.toString();
//                     break;
//             }
//             if (calculatorState.currentTab === 'basic' || calculatorState.currentTab === 'scientific') {
//                 appendToExpression(value);
//             }
//         });
//     });
//
//     // Unit converter
//     const convertBtn = document.getElementById('convert-units');
//     if (convertBtn) {
//         convertBtn.addEventListener('click', performUnitConversion);
//     }
//
//     // Quick actions
//     const quickClearBtn = document.getElementById('quick-clear-all');
//     const quickCopyBtn = document.getElementById('quick-copy-result');
//     const quickPasteBtn = document.getElementById('quick-paste');
//
//     if (quickClearBtn) {
//         quickClearBtn.addEventListener('click', () => {
//             calculatorState.currentExpression = '';
//             calculatorState.currentResult = '0';
//             updateDisplay();
//         });
//     }
//
//     if (quickCopyBtn) {
//         quickCopyBtn.addEventListener('click', () => {
//             navigator.clipboard.writeText(calculatorState.currentResult).catch(() => {
//                 // Fallback for browsers without clipboard API
//                 const textArea = document.createElement('textarea');
//                 textArea.value = calculatorState.currentResult;
//                 document.body.appendChild(textArea);
//                 textArea.select();
//                 document.execCommand('copy');
//                 document.body.removeChild(textArea);
//             });
//         });
//     }
//
//     if (quickPasteBtn) {
//         quickPasteBtn.addEventListener('click', () => {
//             navigator.clipboard.readText().then(text => {
//                 if (calculatorState.currentTab === 'basic' || calculatorState.currentTab === 'scientific') {
//                     appendToExpression(text);
//                 }
//             }).catch(() => {
//                 console.warn('Could not paste from clipboard');
//             });
//         });
//     }
// }
//
// // Setup memory buttons
// function setupMemoryButtons() {
//     if (memoryButtons.store) {
//         memoryButtons.store.addEventListener('click', () => {
//             calculatorState.memory = parseFloat(calculatorState.currentResult) || 0;
//             if (memoryValueDisplay) memoryValueDisplay.textContent = formatNumber(calculatorState.memory);
//             savePreferences();
//         });
//     }
//
//     if (memoryButtons.recall) {
//         memoryButtons.recall.addEventListener('click', () => {
//             if (calculatorState.currentTab === 'basic' || calculatorState.currentTab === 'scientific') {
//                 appendToExpression(calculatorState.memory.toString());
//             }
//         });
//     }
//
//     if (memoryButtons.clear) {
//         memoryButtons.clear.addEventListener('click', () => {
//             calculatorState.memory = 0;
//             if (memoryValueDisplay) memoryValueDisplay.textContent = formatNumber(calculatorState.memory);
//             savePreferences();
//         });
//     }
//
//     if (memoryButtons.add) {
//         memoryButtons.add.addEventListener('click', () => {
//             calculatorState.memory += parseFloat(calculatorState.currentResult) || 0;
//             if (memoryValueDisplay) memoryValueDisplay.textContent = formatNumber(calculatorState.memory);
//             savePreferences();
//         });
//     }
//
//     if (memoryButtons.subtract) {
//         memoryButtons.subtract.addEventListener('click', () => {
//             calculatorState.memory -= parseFloat(calculatorState.currentResult) || 0;
//             if (memoryValueDisplay) memoryValueDisplay.textContent = formatNumber(calculatorState.memory);
//             savePreferences();
//         });
//     }
// }
//
// // Perform unit conversion
// function performUnitConversion() {
//     const unitInput = document.getElementById('unit-input');
//     const unitType = document.getElementById('unit-type');
//     const unitFrom = document.getElementById('unit-from');
//     const unitTo = document.getElementById('unit-to');
//     const conversionResult = document.getElementById('conversion-result');
//
//     if (!unitInput || !unitType || !unitFrom || !unitTo || !conversionResult) return;
//
//     const value = parseFloat(unitInput.value);
//     if (isNaN(value)) {
//         conversionResult.textContent = 'Enter a valid number';
//         return;
//     }
//
//     const type = unitType.value;
//     const from = unitFrom.value;
//     const to = unitTo.value;
//
//     let result = value;
//
//     // Conversion logic
//     if (type === 'angle') {
//         // Convert to radians first
//         let radians = value;
//         if (from === 'deg') radians = value * Math.PI / 180;
//         if (from === 'grad') radians = value * Math.PI / 200;
//
//         // Convert from radians to target
//         if (to === 'deg') result = radians * 180 / Math.PI;
//         else if (to === 'grad') result = radians * 200 / Math.PI;
//         else result = radians;
//     } else if (type === 'length') {
//         // Convert to meters first
//         let meters = value;
//         if (from === 'ft') meters = value * 0.3048;
//         else if (from === 'in') meters = value * 0.0254;
//         else if (from === 'cm') meters = value * 0.01;
//
//         // Convert from meters to target
//         if (to === 'ft') result = meters / 0.3048;
//         else if (to === 'in') result = meters / 0.0254;
//         else if (to === 'cm') result = meters / 0.01;
//         else result = meters;
//     } else if (type === 'temperature') {
//         // Temperature conversions
//         let celsius = value;
//         if (from === 'f') celsius = (value - 32) * 5 / 9;
//         else if (from === 'k') celsius = value - 273.15;
//
//         if (to === 'f') result = celsius * 9 / 5 + 32;
//         else if (to === 'k') result = celsius + 273.15;
//         else result = celsius;
//     }
//
//     conversionResult.textContent = `${formatNumber(result)} ${unitTo.options[unitTo.selectedIndex].text}`;
// }
//
// // Switch between calculator tabs
// function switchTab(tabName) {
//     // Update active tab
//     tabs.forEach(tab => {
//         if (tab.getAttribute('data-tab') === tabName) {
//             tab.classList.add('active');
//         } else {
//             tab.classList.remove('active');
//         }
//     });
//
//     // Show/hide calculator tabs
//     calculatorTabs.forEach(tab => {
//         if (tab.id === `${tabName}-calculator`) {
//             tab.classList.remove('hidden');
//         } else {
//             tab.classList.add('hidden');
//         }
//     });
//
//     calculatorState.currentTab = tabName;
//
//     // Special handling for tabs
//     if (tabName === 'history') {
//         displayHistory();
//     } else if (tabName === 'matrix') {
//         if (matrixResultDisplay) matrixResultDisplay.classList.add('hidden');
//     } else if (tabName === 'graph') {
//         setupGraphScale();
//     }
// }
//
// // Handle basic calculator button clicks
// function handleBasicButtonClick(e) {
//     const button = e.target;
//     const number = button.getAttribute('data-number');
//     const operator = button.getAttribute('data-operator');
//     const action = button.getAttribute('data-action');
//
//     if (number !== null) {
//         appendToExpression(number);
//     } else if (operator !== null) {
//         appendToExpression(` ${operator} `);
//     } else if (action !== null) {
//         handleAction(action);
//     }
// }
//
// // Handle scientific calculator button clicks
// function handleScientificButtonClick(e) {
//     const button = e.target;
//     const number = button.getAttribute('data-number');
//     const operator = button.getAttribute('data-operator');
//     const action = button.getAttribute('data-action');
//     const func = button.getAttribute('data-function');
//
//     if (number !== null) {
//         appendToExpression(number);
//     } else if (operator !== null) {
//         appendToExpression(` ${operator} `);
//     } else if (action !== null) {
//         handleAction(action);
//     } else if (func !== null) {
//         handleFunction(func);
//     }
// }
//
// // Handle matrix calculator button clicks
// function handleMatrixButtonClick(e) {
//     const button = e.target;
//     const action = button.getAttribute('data-matrix-action');
//
//     if (action !== null) {
//         handleMatrixAction(action);
//     }
// }
//
// // Handle graph calculator button clicks
// function handleGraphButtonClick(e) {
//     const button = e.target;
//     const action = button.getAttribute('data-graph-action');
//
//     if (action !== null) {
//         handleGraphAction(action);
//     }
// }
//
// // Append value to current expression
// function appendToExpression(value) {
//     if (calculatorState.currentTab === 'basic' || calculatorState.currentTab === 'scientific') {
//         calculatorState.currentExpression += value;
//         updateDisplay();
//     }
// }
//
// // Handle calculator actions
// function handleAction(action) {
//     switch (action) {
//         case 'clear':
//             calculatorState.currentExpression = '';
//             calculatorState.currentResult = '0';
//             break;
//         case 'clear-entry':
//             calculatorState.currentExpression = '';
//             break;
//         case 'backspace':
//             calculatorState.currentExpression = calculatorState.currentExpression.slice(0, -1);
//             break;
//         case 'toggle-sign':
//             if (calculatorState.currentResult !== '0' && calculatorState.currentResult !== 'Error') {
//                 const num = parseFloat(calculatorState.currentResult);
//                 calculatorState.currentResult = (-num).toString();
//                 calculatorState.currentExpression = calculatorState.currentResult;
//             }
//             break;
//         case 'equals':
//             calculateResult();
//             break;
//     }
//     updateDisplay();
// }
//
// // Handle scientific functions
// function handleFunction(func) {
//     if (func === 'pi') {
//         appendToExpression(Math.PI.toString());
//         return;
//     } else if (func === 'e') {
//         appendToExpression(Math.E.toString());
//         return;
//     }
//
//     // For functions, add the function name and opening parenthesis
//     if (calculatorState.currentExpression === '' ||
//         /[\+\-\*\/\(\)]$/.test(calculatorState.currentExpression.trim())) {
//         calculatorState.currentExpression += `${func}(`;
//     } else {
//         calculatorState.currentExpression = `${func}(${calculatorState.currentExpression})`;
//     }
//
//     updateDisplay();
// }
//
// // Handle matrix operations
// function handleMatrixAction(action) {
//     const matrixData = getMatrixData();
//
//     // Send request to server
//     fetch('/api/calculate/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'X-CSRFToken': getCSRFToken(),
//         },
//         body: JSON.stringify({
//             type: 'matrix',
//             action: action,
//             matrix_data: matrixData
//         })
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 displayMatrixResult(data.result, action);
//             } else {
//                 displayMatrixError(data.error);
//             }
//         })
//         .catch(error => {
//             displayMatrixError('Network error: ' + error.message);
//         });
// }
//
// // Display matrix result
// function displayMatrixResult(result, action) {
//     if (!matrixResultDisplay) return;
//
//     matrixResultDisplay.classList.remove('hidden');
//
//     if (typeof result === 'string') {
//         matrixResultDisplay.innerHTML = `<strong>${action}:</strong> ${result}`;
//     } else if (Array.isArray(result)) {
//         let html = `<strong>${action}:</strong><br>`;
//
//         if (Array.isArray(result[0])) {
//             // 2D array
//             html += result.map(row =>
//                 `[${row.map(val => formatNumber(val)).join(', ')}]`
//             ).join('<br>');
//         } else {
//             // 1D array
//             html += `[${result.map(val => formatNumber(val)).join(', ')}]`;
//         }
//
//         matrixResultDisplay.innerHTML = html;
//     } else {
//         matrixResultDisplay.innerHTML = `<strong>${action}:</strong> ${formatNumber(result)}`;
//     }
// }
//
// // Display matrix error
// function displayMatrixError(error) {
//     if (!matrixResultDisplay) return;
//
//     matrixResultDisplay.classList.remove('hidden');
//     matrixResultDisplay.innerHTML = `<div class="error-message">Error: ${error}</div>`;
// }
//
// // Handle graph actions
// function handleGraphAction(action) {
//     if (action === 'plot') {
//         const expression = functionInput ? functionInput.value.trim() : '';
//         if (!expression) {
//             const graphResult = document.getElementById('graph-result');
//             if (graphResult) graphResult.textContent = 'Please enter a function';
//             return;
//         }
//         plotFunction(expression);
//     } else if (action === 'clear-graph') {
//         clearGraph();
//     } else if (action === 'zoom-in') {
//         zoomGraph(0.8);
//     } else if (action === 'zoom-out') {
//         zoomGraph(1.25);
//     }
// }
//
// // Plot function on graph
// function plotFunction(expression) {
//     if (!functionPath) return;
//
//     try {
//         const {xMin, xMax, yMin, yMax} = calculatorState.graphRange;
//         const width = 600;
//         const height = 400;
//         const points = [];
//
//         const numPoints = 200;
//         const step = (xMax - xMin) / numPoints;
//
//         for (let i = 0; i <= numPoints; i++) {
//             const x = xMin + i * step;
//             try {
//                 // Simple function evaluation
//                 let expr = expression.toLowerCase();
//
//                 // Replace common math functions
//                 expr = expr.replace(/\bsin\b/g, 'Math.sin');
//                 expr = expr.replace(/\bcos\b/g, 'Math.cos');
//                 expr = expr.replace(/\btan\b/g, 'Math.tan');
//                 expr = expr.replace(/\blog\b/g, 'Math.log10');
//                 expr = expr.replace(/\bln\b/g, 'Math.log');
//                 expr = expr.replace(/\bsqrt\b/g, 'Math.sqrt');
//                 expr = expr.replace(/\babs\b/g, 'Math.abs');
//                 expr = expr.replace(/\bexp\b/g, 'Math.exp');
//                 expr = expr.replace(/\bfloor\b/g, 'Math.floor');
//                 expr = expr.replace(/\bceil\b/g, 'Math.ceil');
//                 expr = expr.replace(/\bround\b/g, 'Math.round');
//                 expr = expr.replace(/\be\b/g, 'Math.E');
//                 expr = expr.replace(/\bpi\b/g, 'Math.PI');
//                 expr = expr.replace(/\^/g, '**');
//
//                 // Replace x with current value
//                 expr = expr.replace(/\bx\b/g, `(${x})`);
//
//                 // Safe evaluation
//                 const y = Function(`"use strict"; return (${expr})`)();
//
//                 if (isFinite(y) && y >= yMin && y <= yMax) {
//                     const screenX = ((x - xMin) / (xMax - xMin)) * width;
//                     const screenY = height - ((y - yMin) / (yMax - yMin)) * height;
//                     points.push(`${screenX},${screenY}`);
//                 }
//             } catch (e) {
//                 // Skip invalid points
//             }
//         }
//
//         if (points.length > 0) {
//             functionPath.setAttribute('d', `M ${points.join(' L ')}`);
//             const graphResult = document.getElementById('graph-result');
//             if (graphResult) graphResult.textContent = `Plotted: f(x) = ${expression}`;
//         } else {
//             throw new Error('No valid points to plot');
//         }
//     } catch (error) {
//         const graphResult = document.getElementById('graph-result');
//         if (graphResult) graphResult.textContent = `Error: ${error.message}`;
//         if (functionPath) functionPath.setAttribute('d', '');
//     }
// }
//
// // Clear graph
// function clearGraph() {
//     if (functionPath) functionPath.setAttribute('d', '');
//     if (functionInput) functionInput.value = '';
//     const graphResult = document.getElementById('graph-result');
//     if (graphResult) graphResult.textContent = 'Enter function to graph';
// }
//
// // Zoom graph
// function zoomGraph(factor) {
//     const {xMin, xMax, yMin, yMax} = calculatorState.graphRange;
//     const xCenter = (xMin + xMax) / 2;
//     const yCenter = (yMin + yMax) / 2;
//     const xRange = (xMax - xMin) * factor / 2;
//     const yRange = (yMax - yMin) * factor / 2;
//
//     calculatorState.graphRange = {
//         xMin: xCenter - xRange,
//         xMax: xCenter + xRange,
//         yMin: yCenter - yRange,
//         yMax: yCenter + yRange
//     };
//
//     // Update input fields
//     if (xMinInput) xMinInput.value = calculatorState.graphRange.xMin.toFixed(2);
//     if (xMaxInput) xMaxInput.value = calculatorState.graphRange.xMax.toFixed(2);
//     if (yMinInput) yMinInput.value = calculatorState.graphRange.yMin.toFixed(2);
//     if (yMaxInput) yMaxInput.value = calculatorState.graphRange.yMax.toFixed(2);
//
//     setupGraphScale();
//     savePreferences();
//
//     // Re-plot if there's a function
//     if (functionInput && functionInput.value.trim()) {
//         plotFunction(functionInput.value.trim());
//     }
// }