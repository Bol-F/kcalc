// calculator_base.js - Core state management and utilities
(function () {
    'use strict';

    // Global calculator state
    window.calculatorState = window.calculatorState || {
        currentTab: 'basic',
        currentExpression: '',
        currentResult: '0',
        memory: 0,
        angleUnit: 'rad',
        decimalPlaces: 10,
        theme: 'dark',
        history: [],
        matrixSize: 3,
        graphRange: {xMin: -10, xMax: 10, yMin: -10, yMax: 10},
        _lastClickTime: 0
    };

    const state = window.calculatorState;
    const logger = {
        info: (...args) => console.log('[Calculator]', ...args),
        warn: (...args) => console.warn('[Calculator]', ...args),
        error: (...args) => console.error('[Calculator]', ...args)
    };

    // Safe localStorage operations
    const storage = {
        get: (key) => {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                logger.warn('LocalStorage get failed:', error);
                return null;
            }
        },

        set: (key, value) => {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (error) {
                logger.warn('LocalStorage set failed:', error);
                return false;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                logger.warn('LocalStorage remove failed:', error);
                return false;
            }
        }
    };

    // CSRF Token utility
    window.getCSRFToken = function () {
        const name = 'csrftoken';
        try {
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        return decodeURIComponent(cookie.substring(name.length + 1));
                    }
                }
            }
        } catch (error) {
            logger.warn('CSRF token retrieval failed:', error);
        }
        return '';
    };

    // Number formatting with proper error handling
    window.formatNumber = function (num) {
        if (num === null || num === undefined) return 'Error';

        if (typeof num === 'string') {
            if (num === 'Infinity' || num === '-Infinity' || num === 'NaN') return num;
            if (num.includes('Error')) return num;
        }

        const n = parseFloat(num);
        if (isNaN(n)) return 'Error';
        if (!isFinite(n)) return 'Infinity';

        // Handle integers
        if (Number.isInteger(n)) return n.toString();

        // Handle decimals with trailing zero removal
        const formatted = n.toFixed(state.decimalPlaces);
        return parseFloat(formatted).toString();
    };

    // Expression validation
    window.isValidExpressionCharacter = function (char) {
        const validChars = '0123456789.+-*/()^πe ';
        return validChars.includes(char);
    };

    window.canAppendOperator = function (currentExpression, newOperator) {
        if (currentExpression.length === 0) {
            return newOperator === '-';
        }

        const lastChar = currentExpression.trim().slice(-1);
        const operators = '+-*/^';

        if (operators.includes(lastChar) && operators.includes(newOperator)) {
            return false;
        }

        if (lastChar === '(' && (newOperator === '*' || newOperator === '/')) return false;

        return true;
    };

    // Preferences management
    window.loadPreferences = function () {
        try {
            const saved = storage.get('calculatorPreferences');
            if (saved) {
                const prefs = JSON.parse(saved);

                if (prefs.theme && ['dark', 'light', 'neon', 'retro'].includes(prefs.theme)) {
                    state.theme = prefs.theme;
                }
                if (prefs.angleUnit && ['rad', 'deg'].includes(prefs.angleUnit)) {
                    state.angleUnit = prefs.angleUnit;
                }
                if (Number.isInteger(prefs.decimalPlaces) && prefs.decimalPlaces >= 0 && prefs.decimalPlaces <= 20) {
                    state.decimalPlaces = prefs.decimalPlaces;
                }
                if (typeof prefs.memory === 'number') {
                    state.memory = prefs.memory;
                }
                if (Number.isInteger(prefs.matrixSize) && prefs.matrixSize >= 2 && prefs.matrixSize <= 10) {
                    state.matrixSize = prefs.matrixSize;
                }
                if (prefs.graphRange && typeof prefs.graphRange === 'object') {
                    state.graphRange = {...state.graphRange, ...prefs.graphRange};
                }
            }
        } catch (error) {
            logger.warn('loadPreferences failed:', error);
        }
    };

    window.savePreferencesLocal = function () {
        try {
            const prefs = {
                theme: state.theme,
                angleUnit: state.angleUnit,
                decimalPlaces: state.decimalPlaces,
                memory: state.memory,
                matrixSize: state.matrixSize,
                graphRange: state.graphRange
            };
            storage.set('calculatorPreferences', JSON.stringify(prefs));
        } catch (error) {
            logger.warn('savePreferencesLocal failed:', error);
        }
    };

    // History management
    window.loadHistory = function () {
        try {
            const saved = storage.get('calculatorHistory');
            if (saved) {
                const history = JSON.parse(saved);
                if (Array.isArray(history)) {
                    state.history = history.slice(0, 100);
                }
            }
        } catch (error) {
            logger.warn('loadHistory failed:', error);
        }
    };

    window.addToHistory = function (expression, result, type) {
        try {
            const item = {
                expression: String(expression),
                result: String(result),
                type: String(type || 'basic'),
                timestamp: new Date().toISOString()
            };

            state.history.unshift(item);

            if (state.history.length > 100) {
                state.history = state.history.slice(0, 100);
            }

            storage.set('calculatorHistory', JSON.stringify(state.history));
        } catch (error) {
            logger.warn('addToHistory failed:', error);
        }
    };

    // Safe HTTP POST utility
    window.postJSON = function (url, payload) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.getCSRFToken()
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                logger.error('POST request failed:', error);
                throw error;
            });
    };

    // Initialize base functionality
    window.loadPreferences();
    window.loadHistory();

    logger.info('Calculator base initialized');
})();