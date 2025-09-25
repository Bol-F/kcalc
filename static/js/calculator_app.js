// calculator_app.js - Application logic and UI interactions
(function () {
    'use strict';

    const state = window.calculatorState;
    const logger = {
        info: (...args) => console.log('[Calc App]', ...args),
        warn: (...args) => console.warn('[Calc App]', ...args),
        error: (...args) => console.error('[Calc App]', ...args)
    };

    // DOM element cache
    let elements = {};

    // Initialize DOM elements
    function initElements() {
        elements = {
            // Tabs and containers
            tabs: document.querySelectorAll('.tab'),
            calculatorTabs: document.querySelectorAll('.calculator-tab'),

            // Display elements
            expressions: {
                basic: document.getElementById('basic-expression'),
                scientific: document.getElementById('scientific-expression'),
                matrix: document.getElementById('matrix-expression'),
                graph: document.getElementById('graph-expression')
            },
            results: {
                basic: document.getElementById('basic-result'),
                scientific: document.getElementById('scientific-result'),
                matrix: document.getElementById('matrix-result'),
                graph: document.getElementById('graph-result')
            },

            // Controls
            angleUnit: document.getElementById('angle-unit'),
            angleUnitSetting: document.getElementById('angle-unit-setting'),
            decimalPlaces: document.getElementById('decimal-places'),
            decimalPlacesSetting: document.getElementById('decimal-places-setting'),
            decimalPlacesValue: document.getElementById('decimal-places-value'),

            // Matrix controls
            matrixSize: document.getElementById('matrix-size'),
            matrixInputContainer: document.getElementById('matrix-input-container'),
            matrixResultDisplay: document.getElementById('matrix-result-display'),
            clearMatrixBtn: document.getElementById('clear-matrix'),
            identityMatrixBtn: document.getElementById('identity-matrix'),

            // Graph controls
            functionInput: document.getElementById('function-input'),
            graphCanvas: document.getElementById('graph-canvas'),
            graphSvg: document.getElementById('graph-svg'),
            functionPath: document.getElementById('function-path'),
            scaleMarkers: document.getElementById('scale-markers'),
            xMinInput: document.getElementById('x-min'),
            xMaxInput: document.getElementById('x-max'),
            yMinInput: document.getElementById('y-min'),
            yMaxInput: document.getElementById('y-max'),

            // History
            historyList: document.getElementById('history-list'),
            recentHistory: document.getElementById('recent-history'),
            clearHistoryBtn: document.getElementById('clear-history'),

            // Memory
            memoryValue: document.getElementById('memory-value'),
            memoryStore: document.getElementById('memory-store'),
            memoryRecall: document.getElementById('memory-recall'),
            memoryClear: document.getElementById('memory-clear'),
            memoryAdd: document.getElementById('memory-add'),
            memorySubtract: document.getElementById('memory-subtract'),

            // Theme
            themeOptions: document.querySelectorAll('.theme-option')
        };
    }

    // Visual error feedback
    function flashError(message) {
        const display = document.getElementById(`${state.currentTab}-expression`);
        if (display) {
            const originalColor = display.style.color;
            display.style.color = 'var(--error-color)';
            display.textContent = message;

            setTimeout(() => {
                display.style.color = originalColor;
                updateDisplay();
            }, 1000);
        }
    }

    // Expression handling with validation
    function appendToExpression(value) {
        if (state.currentTab !== 'basic' && state.currentTab !== 'scientific') {
            return;
        }

        // Validate input
        if (value.length === 1 && !window.isValidExpressionCharacter(value)) {
            logger.warn('Invalid character:', value);
            flashError('Invalid character');
            return;
        }

        // Handle operators with validation
        const operators = '+-*/^';
        if (operators.includes(value)) {
            if (!window.canAppendOperator(state.currentExpression, value)) {
                flashError('Invalid operator placement');
                return;
            }
        }

        // Handle numbers and other valid characters
        state.currentExpression += value;
        updateDisplay();
    }

    function handleBackspace() {
        if (state.currentExpression.length === 0) return;

        state.currentExpression = state.currentExpression.slice(0, -1);
        updateDisplay();
    }

    function handleToggleSign() {
        if (state.currentResult !== '0' && state.currentResult !== 'Error') {
            try {
                const num = parseFloat(state.currentResult);
                if (!isNaN(num)) {
                    state.currentResult = (-num).toString();
                    state.currentExpression = state.currentResult;
                }
            } catch (error) {
                logger.warn('Toggle sign failed:', error);
            }
        }
    }

    function handleAction(action) {
        switch (action) {
            case 'clear':
                state.currentExpression = '';
                state.currentResult = '0';
                break;
            case 'clear-entry':
                state.currentExpression = '';
                break;
            case 'backspace':
                handleBackspace();
                return;
            case 'toggle-sign':
                handleToggleSign();
                return;
            case 'equals':
                calculateResult();
                return;
        }
        updateDisplay();
    }

    function handleFunction(func) {
        if (func === 'pi') {
            appendToExpression(Math.PI.toString());
        } else if (func === 'e') {
            appendToExpression(Math.E.toString());
        } else {
            appendToExpression(`${func}(`);
        }
    }

    // Tab management
    function switchToTab(tabName) {
        if (!['basic', 'scientific', 'matrix', 'graph', 'history', 'settings'].includes(tabName)) {
            logger.warn('Invalid tab name:', tabName);
            return;
        }

        // Update tab states
        elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        // Show/hide calculator content
        elements.calculatorTabs.forEach(tab => {
            tab.classList.toggle('hidden', tab.id !== `${tabName}-calculator`);
        });

        state.currentTab = tabName;

        // Tab-specific initializations
        switch (tabName) {
            case 'matrix':
                generateMatrixInput(state.matrixSize);
                if (elements.matrixResultDisplay) {
                    elements.matrixResultDisplay.classList.add('hidden');
                }
                break;
            case 'graph':
                setupGraphScale();
                break;
            case 'history':
                displayHistory();
                break;
        }

        updateDisplay();
    }

    // Display update
    function updateDisplay() {
        // Update current tab display
        if (elements.expressions[state.currentTab] && state.currentTab !== 'graph') {
            elements.expressions[state.currentTab].textContent = state.currentExpression || '0';
        }

        if (elements.results[state.currentTab]) {
            elements.results[state.currentTab].textContent = state.currentResult;
        }

        // Update settings displays
        if (elements.decimalPlacesValue) {
            elements.decimalPlacesValue.textContent = state.decimalPlaces;
        }
        if (elements.decimalPlaces) {
            elements.decimalPlaces.value = state.decimalPlaces;
        }
        if (elements.decimalPlacesSetting) {
            elements.decimalPlacesSetting.value = state.decimalPlaces;
        }
        if (elements.memoryValue) {
            elements.memoryValue.textContent = window.formatNumber(state.memory);
        }

        // Update recent history
        updateRecentHistory();
    }

    // Calculation
    function calculateResult() {
        if (!state.currentExpression.trim()) {
            state.currentResult = '0';
            updateDisplay();
            return;
        }

        window.postJSON('/api/calculate/', {
            type: state.currentTab,
            expression: state.currentExpression,
            action: 'calculate'
        })
            .then(data => {
                if (data && data.success) {
                    state.currentResult = String(data.result);
                    window.addToHistory(state.currentExpression, data.result, state.currentTab);
                } else {
                    state.currentResult = data && data.error ? `Error: ${data.error}` : 'Error';
                }
                updateDisplay();
            })
            .catch(error => {
                state.currentResult = 'Network error';
                updateDisplay();
            });
    }

    // Matrix operations
    function generateMatrixInput(size) {
        if (!elements.matrixInputContainer) return;

        size = Math.max(2, Math.min(10, parseInt(size) || 3));
        state.matrixSize = size;

        elements.matrixInputContainer.innerHTML = '';

        const table = document.createElement('table');
        table.className = 'matrix-table';

        for (let i = 0; i < size; i++) {
            const row = document.createElement('tr');

            for (let j = 0; j < size; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');

                input.type = 'text';
                input.className = 'matrix-cell';
                input.id = `matrix-${i}-${j}`;
                input.value = i === j ? '1' : '0';
                input.placeholder = '0';

                // Add input validation
                input.addEventListener('input', function () {
                    this.value = this.value.replace(/[^-0-9.]/g, '');
                });

                cell.appendChild(input);
                row.appendChild(cell);
            }

            table.appendChild(row);
        }

        elements.matrixInputContainer.appendChild(table);
    }

    function getMatrixData() {
        const matrix = [];
        const size = state.matrixSize;

        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                const input = document.getElementById(`matrix-${i}-${j}`);
                const value = input ? parseFloat(input.value) || 0 : 0;
                row.push(value);
            }
            matrix.push(row);
        }

        return matrix;
    }

    function handleMatrixOperation(operation) {
        const matrixData = getMatrixData();

        window.postJSON('/api/calculate/', {
            type: 'matrix',
            action: operation,
            matrix_data: matrixData
        })
            .then(data => {
                if (data && data.success) {
                    displayMatrixResult(data.result, operation);
                } else {
                    displayMatrixError(data?.error || 'Unknown error');
                }
            })
            .catch(error => {
                displayMatrixError('Network error: ' + error.message);
            });
    }

    function displayMatrixResult(result, operation) {
        if (!elements.matrixResultDisplay) return;

        elements.matrixResultDisplay.classList.remove('hidden');

        let content = '';
        if (typeof result === 'string') {
            content = `<strong>${operation}:</strong> ${result}`;
        } else if (Array.isArray(result)) {
            content = `<strong>${operation}:</strong><br>`;
            if (Array.isArray(result[0])) {
                // 2D matrix
                content += result.map(row =>
                    `[${row.map(val => window.formatNumber(val)).join(', ')}]`
                ).join('<br>');
            } else {
                // 1D array
                content += `[${result.map(val => window.formatNumber(val)).join(', ')}]`;
            }
        } else {
            content = `<strong>${operation}:</strong> ${window.formatNumber(result)}`;
        }

        elements.matrixResultDisplay.innerHTML = content;
    }

    function displayMatrixError(error) {
        if (!elements.matrixResultDisplay) return;

        elements.matrixResultDisplay.classList.remove('hidden');
        elements.matrixResultDisplay.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${error}
            </div>
        `;
    }

    // Graph operations
    function setupGraphScale() {
        if (!elements.scaleMarkers || !elements.graphSvg) return;

        const xMin = parseFloat(elements.xMinInput?.value) || -10;
        const xMax = parseFloat(elements.xMaxInput?.value) || 10;
        const yMin = parseFloat(elements.yMinInput?.value) || -10;
        const yMax = parseFloat(elements.yMaxInput?.value) || 10;

        elements.scaleMarkers.innerHTML = '';

        // X-axis markers
        for (let i = 1; i < 12; i++) {
            const x = (i / 12) * 600;
            const value = xMin + (i / 12) * (xMax - xMin);

            if (Math.abs(value) > 0.1) {
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                marker.setAttribute('class', 'scale-marker');
                marker.setAttribute('x1', x);
                marker.setAttribute('y1', 195);
                marker.setAttribute('x2', x);
                marker.setAttribute('y2', 205);
                elements.scaleMarkers.appendChild(marker);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('class', 'scale-text');
                text.setAttribute('x', x);
                text.setAttribute('y', 220);
                text.setAttribute('text-anchor', 'middle');
                text.textContent = value.toFixed(1);
                elements.scaleMarkers.appendChild(text);
            }
        }

        // Y-axis markers
        for (let i = 1; i < 8; i++) {
            const y = (i / 8) * 400;
            const value = yMin + (i / 8) * (yMax - yMin);

            if (Math.abs(value) > 0.1) {
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                marker.setAttribute('class', 'scale-marker');
                marker.setAttribute('x1', 295);
                marker.setAttribute('y1', y);
                marker.setAttribute('x2', 305);
                marker.setAttribute('y2', y);
                elements.scaleMarkers.appendChild(marker);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('class', 'scale-text');
                text.setAttribute('x', 280);
                text.setAttribute('y', y + 4);
                text.setAttribute('text-anchor', 'end');
                text.textContent = value.toFixed(1);
                elements.scaleMarkers.appendChild(text);
            }
        }
    }

    function clearGraph() {
        if (elements.functionPath) {
            elements.functionPath.setAttribute('d', '');
        }
        if (elements.functionInput) {
            elements.functionInput.value = '';
        }
        if (elements.results.graph) {
            elements.results.graph.textContent = 'Graph cleared';
        }
        // Reset to default view
        if (elements.xMinInput) elements.xMinInput.value = '-10';
        if (elements.xMaxInput) elements.xMaxInput.value = '10';
        if (elements.yMinInput) elements.yMinInput.value = '-10';
        if (elements.yMaxInput) elements.yMaxInput.value = '10';

        setupGraphScale();
    }

    function plotGraph() {
        const expression = elements.functionInput ? elements.functionInput.value.trim() : '';

        if (!expression) {
            if (elements.results.graph) {
                elements.results.graph.textContent = 'Please enter a function';
            }
            return;
        }

        const xMin = parseFloat(elements.xMinInput?.value) || -10;
        const xMax = parseFloat(elements.xMaxInput?.value) || 10;
        const yMin = parseFloat(elements.yMinInput?.value) || -10;
        const yMax = parseFloat(elements.yMaxInput?.value) || 10;

        try {
            const points = calculateFunctionPoints(expression, xMin, xMax, yMin, yMax);
            renderGraph(points, xMin, xMax, yMin, yMax);

            if (elements.results.graph) {
                elements.results.graph.textContent = `Plotted: f(x) = ${expression}`;
            }
        } catch (error) {
            if (elements.results.graph) {
                elements.results.graph.textContent = `Error: ${error.message}`;
            }
        }
    }

    function calculateFunctionPoints(expression, xMin, xMax, yMin, yMax) {
        const points = [];
        const steps = 200;
        const step = (xMax - xMin) / steps;

        for (let i = 0; i <= steps; i++) {
            const x = xMin + i * step;
            try {
                const y = evaluateFunction(expression, x);

                if (isFinite(y) && y >= yMin && y <= yMax) {
                    points.push({x, y});
                } else {
                    points.push(null);
                }
            } catch (error) {
                points.push(null);
            }
        }

        return points;
    }

    function evaluateFunction(expression, x) {
        let expr = expression
            .replace(/x/g, `(${x})`)
            .replace(/\^/g, '**')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/abs/g, 'Math.abs')
            .replace(/exp/g, 'Math.exp')
            .replace(/pi/g, 'Math.PI')
            .replace(/e/g, 'Math.E');

        if (/[a-df-rt-z]/i.test(expr)) {
            throw new Error('Invalid function expression');
        }

        return Function(`"use strict"; return ${expr}`)();
    }

    function renderGraph(points, xMin, xMax, yMin, yMax) {
        if (!elements.functionPath) return;

        const width = 600;
        const height = 400;
        let pathData = '';
        let isDrawing = false;

        for (const point of points) {
            if (point) {
                const x = ((point.x - xMin) / (xMax - xMin)) * width;
                const y = height - ((point.y - yMin) / (yMax - yMin)) * height;

                if (!isDrawing) {
                    pathData += `M ${x} ${y} `;
                    isDrawing = true;
                } else {
                    pathData += `L ${x} ${y} `;
                }
            } else {
                isDrawing = false;
            }
        }

        elements.functionPath.setAttribute('d', pathData);
    }

    function zoomGraph(factor) {
        const xMin = parseFloat(elements.xMinInput?.value) || -10;
        const xMax = parseFloat(elements.xMaxInput?.value) || 10;
        const yMin = parseFloat(elements.yMinInput?.value) || -10;
        const yMax = parseFloat(elements.yMaxInput?.value) || 10;

        const xCenter = (xMin + xMax) / 2;
        const yCenter = (yMin + yMax) / 2;
        const xRange = (xMax - xMin) * factor / 2;
        const yRange = (yMax - yMin) * factor / 2;

        const newXMin = xCenter - xRange;
        const newXMax = xCenter + xRange;
        const newYMin = yCenter - yRange;
        const newYMax = yCenter + yRange;

        if (elements.xMinInput) elements.xMinInput.value = newXMin.toFixed(2);
        if (elements.xMaxInput) elements.xMaxInput.value = newXMax.toFixed(2);
        if (elements.yMinInput) elements.yMinInput.value = newYMin.toFixed(2);
        if (elements.yMaxInput) elements.yMaxInput.value = newYMax.toFixed(2);

        setupGraphScale();

        if (elements.functionInput && elements.functionInput.value.trim()) {
            plotGraph();
        }
    }

    function resetGraphView() {
        if (elements.xMinInput) elements.xMinInput.value = '-10';
        if (elements.xMaxInput) elements.xMaxInput.value = '10';
        if (elements.yMinInput) elements.yMinInput.value = '-10';
        if (elements.yMaxInput) elements.yMaxInput.value = '10';

        setupGraphScale();

        if (elements.functionInput && elements.functionInput.value.trim()) {
            plotGraph();
        }
    }

    // History management
    function displayHistory() {
        if (!elements.historyList) return;

        elements.historyList.innerHTML = '';

        if (state.history.length === 0) {
            elements.historyList.innerHTML = '<div class="no-history">No calculation history</div>';
            return;
        }

        state.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
                <div class="history-meta">
                    <span class="history-type">${item.type}</span>
                    <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
            `;

            historyItem.addEventListener('click', () => {
                state.currentExpression = item.expression;
                state.currentResult = item.result;
                switchToTab('basic');
            });

            elements.historyList.appendChild(historyItem);
        });
    }

    function updateRecentHistory() {
        if (!elements.recentHistory) return;

        const recentItems = state.history.slice(0, 5);

        if (recentItems.length === 0) {
            elements.recentHistory.innerHTML = '<div class="history-item">No recent calculations</div>';
            return;
        }

        elements.recentHistory.innerHTML = '';

        recentItems.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
            `;

            historyItem.addEventListener('click', () => {
                state.currentExpression = item.expression;
                state.currentResult = item.result;
                updateDisplay();
            });

            elements.recentHistory.appendChild(historyItem);
        });
    }

    function clearHistory() {
        window.postJSON('/api/clear-history/', {})
            .then(data => {
                if (data && data.success) {
                    state.history = [];
                    window.storage.remove('calculatorHistory');
                    displayHistory();
                    updateRecentHistory();
                } else {
                    alert('Failed to clear history');
                }
            })
            .catch(error => {
                alert('Network error while clearing history');
            });
    }

    // Preferences management
    function applyTheme(theme) {
        if (!['dark', 'light', 'neon', 'retro'].includes(theme)) return;

        state.theme = theme;
        document.body.className = `theme-${theme}`;

        elements.themeOptions.forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-theme') === theme);
        });

        window.savePreferencesLocal();

        window.postJSON('/api/preferences/', {theme})
            .catch(error => logger.warn('Theme sync failed:', error));
    }

    function applyAngleUnit(unit) {
        if (!['rad', 'deg'].includes(unit)) return;

        state.angleUnit = unit;
        window.savePreferencesLocal();

        if (elements.angleUnit) elements.angleUnit.value = unit;
        if (elements.angleUnitSetting) elements.angleUnitSetting.value = unit;

        window.postJSON('/api/preferences/', {angle_unit: unit})
            .catch(error => logger.warn('Angle unit sync failed:', error));
    }

    function applyDecimalPlaces(places) {
        places = parseInt(places);
        if (isNaN(places) || places < 0 || places > 20) return;

        state.decimalPlaces = places;
        window.savePreferencesLocal();
        updateDisplay();

        window.postJSON('/api/preferences/', {decimal_places: places})
            .catch(error => logger.warn('Decimal places sync failed:', error));
    }

    // Memory operations
    function handleMemoryOperation(action, value = 0) {
        const payload = {action};
        if (action === 'store' || action === 'add' || action === 'subtract') {
            payload.value = parseFloat(state.currentResult) || 0;
        }

        window.postJSON('/api/memory/', payload)
            .then(data => {
                if (data && data.success) {
                    state.memory = data.memory_value || 0;
                    updateDisplay();
                }
            })
            .catch(error => logger.warn('Memory operation failed:', error));
    }

    // Keyboard support
    function handleKeyboardInput(e) {
        const key = e.key;

        if (/[0-9+\-*/.=()]|Enter|Backspace|Delete|Escape/.test(key)) {
            e.preventDefault();
        }

        switch (key) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '.':
                appendToExpression(key);
                break;
            case '+':
            case '-':
            case '*':
            case '/':
                appendToExpression(` ${key} `);
                break;
            case '(':
            case ')':
                appendToExpression(key);
                break;
            case 'Enter':
            case '=':
                calculateResult();
                break;
            case 'Backspace':
                handleAction('backspace');
                break;
            case 'Delete':
            case 'Escape':
                handleAction('clear');
                break;
        }
    }

    // Event delegation setup
    function setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (tab) {
                e.preventDefault();
                switchToTab(tab.getAttribute('data-tab'));
                return;
            }

            // Calculator buttons
            const button = e.target.closest('button');
            if (!button) return;

            const number = button.getAttribute('data-number');
            const operator = button.getAttribute('data-operator');
            const action = button.getAttribute('data-action');
            const functionName = button.getAttribute('data-function');
            const matrixAction = button.getAttribute('data-matrix-action');
            const graphAction = button.getAttribute('data-graph-action');

            e.preventDefault();

            if (number !== null) {
                appendToExpression(number);
            } else if (operator !== null) {
                appendToExpression(` ${operator} `);
            } else if (action !== null) {
                handleAction(action);
            } else if (functionName !== null) {
                handleFunction(functionName);
            } else if (matrixAction !== null) {
                handleMatrixOperation(matrixAction);
            } else if (graphAction !== null) {
                handleGraphAction(graphAction);
            }
        });

        // Settings changes
        if (elements.angleUnit) {
            elements.angleUnit.addEventListener('change', (e) => {
                applyAngleUnit(e.target.value);
            });
        }

        if (elements.angleUnitSetting) {
            elements.angleUnitSetting.addEventListener('change', (e) => {
                applyAngleUnit(e.target.value);
            });
        }

        if (elements.decimalPlaces) {
            elements.decimalPlaces.addEventListener('change', (e) => {
                applyDecimalPlaces(e.target.value);
            });
        }

        if (elements.decimalPlacesSetting) {
            elements.decimalPlacesSetting.addEventListener('input', (e) => {
                applyDecimalPlaces(e.target.value);
            });
        }

        // Theme selection
        elements.themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                applyTheme(option.getAttribute('data-theme'));
            });
        });

        // Matrix controls
        if (elements.matrixSize) {
            elements.matrixSize.addEventListener('change', (e) => {
                generateMatrixInput(e.target.value);
            });
        }

        if (elements.clearMatrixBtn) {
            elements.clearMatrixBtn.addEventListener('click', () => {
                generateMatrixInput(state.matrixSize);
            });
        }

        if (elements.identityMatrixBtn) {
            elements.identityMatrixBtn.addEventListener('click', () => {
                const size = state.matrixSize;
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        const input = document.getElementById(`matrix-${i}-${j}`);
                        if (input) input.value = i === j ? '1' : '0';
                    }
                }
            });
        }

        // Memory operations
        if (elements.memoryStore) {
            elements.memoryStore.addEventListener('click', () => handleMemoryOperation('store'));
        }
        if (elements.memoryRecall) {
            elements.memoryRecall.addEventListener('click', () => handleMemoryOperation('recall'));
        }
        if (elements.memoryClear) {
            elements.memoryClear.addEventListener('click', () => handleMemoryOperation('clear'));
        }
        if (elements.memoryAdd) {
            elements.memoryAdd.addEventListener('click', () => handleMemoryOperation('add'));
        }
        if (elements.memorySubtract) {
            elements.memorySubtract.addEventListener('click', () => handleMemoryOperation('subtract'));
        }

        // History clear
        if (elements.clearHistoryBtn) {
            elements.clearHistoryBtn.addEventListener('click', clearHistory);
        }

        // Graph event listeners
        if (elements.functionInput) {
            elements.functionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    plotGraph();
                }
            });
        }

        // Range input listeners
        const rangeInputs = ['xMinInput', 'xMaxInput', 'yMinInput', 'yMaxInput'];
        rangeInputs.forEach(inputName => {
            if (elements[inputName]) {
                elements[inputName].addEventListener('change', () => {
                    setupGraphScale();
                    if (elements.functionInput && elements.functionInput.value.trim()) {
                        plotGraph();
                    }
                });
            }
        });

        // Example function buttons
        document.querySelectorAll('.btn-example').forEach(button => {
            button.addEventListener('click', () => {
                const func = button.getAttribute('data-function');
                if (elements.functionInput) {
                    elements.functionInput.value = func;
                    plotGraph();
                }
            });
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (['basic', 'scientific'].includes(state.currentTab)) {
                handleKeyboardInput(e);
            }
        });
    }

    function handleGraphAction(action) {
        switch (action) {
            case 'plot':
                plotGraph();
                break;
            case 'clear':
                clearGraph();
                break;
            case 'zoom-in':
                zoomGraph(0.8);
                break;
            case 'zoom-out':
                zoomGraph(1.25);
                break;
            case 'reset-view':
                resetGraphView();
                break;
        }
    }

    // Initialize application
    function init() {
        logger.info('Initializing calculator application');

        initElements();
        setupEventListeners();

        // Apply current theme
        document.body.className = `theme-${state.theme}`;

        // Initialize current tab
        switchToTab(state.currentTab);

        logger.info('Calculator application initialized');
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export public API
    window.calculatorApp = {
        switchToTab,
        calculateResult,
        plotGraph,
        clearHistory,
        applyTheme,
        applyAngleUnit,
        applyDecimalPlaces
    };

})();