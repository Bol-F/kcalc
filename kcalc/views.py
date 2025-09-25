import csv
import json
import math
import operator
import re
from decimal import Decimal, getcontext

import numpy as np
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .models import CalculationHistory, UserPreferences


# Add these views to your existing views.py file


@csrf_exempt
def export_history_api(request):
    """Export calculation history as CSV"""
    if request.method != 'GET':
        return JsonResponse({'error': 'GET method required'}, status=405)

    user, session_key = get_user_session(request)

    if user:
        history = CalculationHistory.objects.filter(user=user)
    else:
        history = CalculationHistory.objects.filter(session_key=session_key)

    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="calculator_history.csv"'

    writer = csv.writer(response)
    writer.writerow(['Expression', 'Result', 'Type', 'Date'])

    for calc in history.order_by('-timestamp'):
        writer.writerow([
            calc.expression,
            calc.result,
            calc.calculation_type,
            calc.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        ])

    return response


@csrf_exempt
def export_settings_api(request):
    """Export user settings as JSON"""
    if request.method != 'GET':
        return JsonResponse({'error': 'GET method required'}, status=405)

    user, session_key = get_user_session(request)

    prefs, created = UserPreferences.objects.get_or_create(
        user=user,
        session_key=session_key,
        defaults={
            'theme': 'dark',
            'decimal_places': 10,
            'angle_unit': 'rad',
            'memory_value': 0
        }
    )

    settings_data = {
        'theme': prefs.theme,
        'decimal_places': prefs.decimal_places,
        'angle_unit': prefs.angle_unit,
        'memory_value': float(prefs.memory_value),
        'export_date': prefs.updated_at.isoformat() if hasattr(prefs, 'updated_at') else None
    }

    response = HttpResponse(
        json.dumps(settings_data, indent=2),
        content_type='application/json'
    )
    response['Content-Disposition'] = 'attachment; filename="calculator_settings.json"'

    return response


@csrf_exempt
def import_settings_api(request):
    """Import user settings from JSON file"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)

    try:
        if 'settings_file' not in request.FILES:
            return JsonResponse({'error': 'No settings file provided'}, status=400)

        settings_file = request.FILES['settings_file']

        # Read and parse JSON
        file_content = settings_file.read().decode('utf-8')
        settings_data = json.loads(file_content)

        user, session_key = get_user_session(request)

        prefs, created = UserPreferences.objects.get_or_create(
            user=user,
            session_key=session_key
        )

        # Update preferences from imported data
        if 'theme' in settings_data:
            prefs.theme = settings_data['theme']
        if 'decimal_places' in settings_data:
            prefs.decimal_places = int(settings_data['decimal_places'])
        if 'angle_unit' in settings_data:
            prefs.angle_unit = settings_data['angle_unit']
        if 'memory_value' in settings_data:
            prefs.memory_value = Decimal(str(settings_data['memory_value']))

        prefs.save()

        return JsonResponse({
            'success': True,
            'message': 'Settings imported successfully'
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON file'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Import failed: {str(e)}'}, status=400)


# Set high precision for calculations
getcontext().prec = 50


class AdvancedCalculator:
    """Advanced calculator engine with scientific functions"""

    OPERATORS = {
        '+': operator.add,
        '-': operator.sub,
        '*': operator.mul,
        '/': operator.truediv,
        '//': operator.floordiv,
        '%': operator.mod,
        '**': operator.pow,
        '^': operator.pow,
    }

    FUNCTIONS = {
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'asin': math.asin,
        'acos': math.acos,
        'atan': math.atan,
        'sinh': math.sinh,
        'cosh': math.cosh,
        'tanh': math.tanh,
        'log': math.log10,
        'ln': math.log,
        'sqrt': math.sqrt,
        'exp': math.exp,
        'abs': abs,
        'ceil': math.ceil,
        'floor': math.floor,
        'round': round,
        'factorial': math.factorial,
        'degrees': math.degrees,
        'radians': math.radians,
    }

    CONSTANTS = {
        'pi': math.pi,
        'e': math.e,
        'tau': math.tau,
    }

    def __init__(self, angle_unit='rad'):
        self.angle_unit = angle_unit
        self.memory = 0

    def evaluate(self, expression):
        """Safely evaluate mathematical expressions"""
        try:
            # Clean the expression
            expression = expression.replace('×', '*').replace('÷', '/').strip()

            # Handle empty expression
            if not expression:
                return 0

            # Replace constants
            for const, value in self.CONSTANTS.items():
                expression = expression.replace(const, str(value))

            # Handle angle conversions for trigonometric functions
            if self.angle_unit == 'deg':
                # Convert degrees to radians for trig functions
                trig_patterns = [
                    (r'sin\(([^)]+)\)', lambda m: f'sin(({m.group(1)}*math.pi/180))'),
                    (r'cos\(([^)]+)\)', lambda m: f'cos(({m.group(1)}*math.pi/180))'),
                    (r'tan\(([^)]+)\)', lambda m: f'tan(({m.group(1)}*math.pi/180))'),
                    (r'asin\(([^)]+)\)', lambda m: f'(asin({m.group(1)})*180/math.pi)'),
                    (r'acos\(([^)]+)\)', lambda m: f'(acos({m.group(1)})*180/math.pi)'),
                    (r'atan\(([^)]+)\)', lambda m: f'(atan({m.group(1)})*180/math.pi)'),
                ]

                for pattern, replacement in trig_patterns:
                    expression = re.sub(pattern, replacement, expression)

            # Replace ^ with **
            expression = expression.replace('^', '**')

            # Replace function names with math module equivalents
            function_replacements = {
                'sin': 'math.sin',
                'cos': 'math.cos',
                'tan': 'math.tan',
                'asin': 'math.asin',
                'acos': 'math.acos',
                'atan': 'math.atan',
                'sinh': 'math.sinh',
                'cosh': 'math.cosh',
                'tanh': 'math.tanh',
                'log': 'math.log10',
                'ln': 'math.log',
                'sqrt': 'math.sqrt',
                'exp': 'math.exp',
                'ceil': 'math.ceil',
                'floor': 'math.floor',
                'factorial': 'math.factorial',
                'degrees': 'math.degrees',
                'radians': 'math.radians',
            }

            for func, math_func in function_replacements.items():
                expression = re.sub(r'\b' + func + r'\b', math_func, expression)

            # Safely evaluate using a restricted environment
            safe_dict = {
                'math': math,
                'abs': abs,
                'round': round,
                'min': min,
                'max': max,
                'sum': sum,
                'pi': math.pi,
                'e': math.e,
                'tau': math.tau,
            }

            # Evaluate the expression
            result = eval(expression, {"__builtins__": {}}, safe_dict)

            # Handle special cases
            if result == math.inf:
                return 'Infinity'
            elif result == -math.inf:
                return '-Infinity'
            elif math.isnan(result):
                return 'NaN'

            return float(result)

        except Exception as e:
            raise ValueError(f"Calculation error: {str(e)}")


def get_user_session(request):
    """Get user or session key for preferences"""
    if request.user.is_authenticated:
        return request.user, None
    else:
        # Ensure session exists
        if not request.session.session_key:
            request.session.create()
        return None, request.session.session_key


def calculator_view(request):
    """Main calculator view that handles all calculator types"""
    user, session_key = get_user_session(request)

    # Get user preferences
    prefs, created = UserPreferences.objects.get_or_create(
        user=user,
        session_key=session_key,
        defaults={
            'theme': 'dark',
            'decimal_places': 10,
            'angle_unit': 'rad',
            'memory_value': 0
        }
    )

    # Get recent history for sidebar
    if user:
        recent_history = CalculationHistory.objects.filter(user=user).order_by('-timestamp')[:5]
    else:
        recent_history = CalculationHistory.objects.filter(session_key=session_key).order_by('-timestamp')[:5]

    context = {
        'preferences': prefs,
        'themes': ['dark', 'light', 'neon', 'retro'],
        'recent_history': recent_history,
    }

    return render(request, 'calculator/calculator.html', context)


@csrf_exempt
def calculate_api(request):
    """API endpoint for calculations"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)

    try:
        data = json.loads(request.body)
        expression = data.get('expression', '')
        calc_type = data.get('type', 'basic')
        action = data.get('action', 'calculate')
        matrix_data = data.get('matrix_data', None)

        user, session_key = get_user_session(request)
        prefs, _ = UserPreferences.objects.get_or_create(
            user=user,
            session_key=session_key,
            defaults={'angle_unit': 'rad', 'decimal_places': 10}
        )

        calculator = AdvancedCalculator(angle_unit=prefs.angle_unit)

        # Handle different calculation types
        if calc_type == 'matrix':
            result = handle_matrix_calculation(matrix_data, action, expression)
        elif calc_type == 'graph':
            result = handle_graph_calculation(expression, action)
        else:
            # Basic and scientific calculations
            result = calculator.evaluate(expression)

        # Format result
        formatted_result = format_result(result, prefs.decimal_places, calc_type)

        # Save to history if it's a calculation (not a memory operation, etc.)
        if action not in ['memory_store', 'memory_recall', 'memory_clear', 'memory_add', 'memory_subtract']:
            CalculationHistory.objects.create(
                user=user,
                session_key=session_key,
                expression=expression,
                result=str(formatted_result),
                calculation_type=calc_type
            )

        return JsonResponse({
            'result': formatted_result,
            'expression': expression,
            'success': True
        })

    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'success': False
        }, status=400)


def format_result(result, decimal_places, calc_type='basic'):
    """Format result based on type"""
    if isinstance(result, str) and (result == 'Infinity' or result == '-Infinity' or result == 'NaN'):
        return result

    if calc_type == 'matrix' and isinstance(result, (list, np.ndarray)):
        return format_matrix_result(result, decimal_places)

    if calc_type == 'graph' and isinstance(result, dict):
        return result

    try:
        result_float = float(result)
        if result_float.is_integer():
            return str(int(result_float))
        else:
            # Format with specified decimal places, removing trailing zeros
            formatted = f"{result_float:.{decimal_places}f}"
            return formatted.rstrip('0').rstrip('.') if '.' in formatted else formatted
    except (ValueError, TypeError):
        return str(result)


def format_matrix_result(matrix, decimal_places):
    """Format matrix result for JSON response"""
    if isinstance(matrix, (int, float)):
        return format_result(matrix, decimal_places)

    if isinstance(matrix, np.ndarray):
        matrix = matrix.tolist()

    # Format each element in the matrix
    if isinstance(matrix, list):
        if all(not isinstance(item, list) for item in matrix):
            # 1D array
            return [format_result(item, decimal_places) for item in matrix]
        else:
            # 2D array
            return [[format_result(item, decimal_places) for item in row] for row in matrix]

    return str(matrix)


def handle_matrix_calculation(matrix_data, action, expression=''):
    """Handle matrix operations"""
    try:
        if matrix_data is None:
            # Create a default 3x3 identity matrix if no data provided
            matrix_data = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]

        # Clean matrix data - convert empty strings to 0
        cleaned_matrix = []
        for row in matrix_data:
            cleaned_row = []
            for cell in row:
                if cell == '' or cell is None:
                    cleaned_row.append(0)
                else:
                    try:
                        cleaned_row.append(float(cell))
                    except (ValueError, TypeError):
                        cleaned_row.append(0)
            cleaned_matrix.append(cleaned_row)

        matrix = np.array(cleaned_matrix, dtype=float)

        # Validate matrix
        if matrix.size == 0:
            raise ValueError("Matrix cannot be empty")

        if action == 'det':
            if matrix.shape[0] != matrix.shape[1]:
                raise ValueError("Matrix must be square for determinant calculation")
            return float(np.linalg.det(matrix))
        elif action == 'inv':
            if matrix.shape[0] != matrix.shape[1]:
                raise ValueError("Matrix must be square for inverse calculation")
            det = np.linalg.det(matrix)
            if abs(det) < 1e-10:
                raise ValueError("Matrix is singular (non-invertible)")
            return np.linalg.inv(matrix)
        elif action == 'rank':
            return int(np.linalg.matrix_rank(matrix))
        elif action == 'transpose':
            return matrix.T
        elif action == 'eigenvalues':
            if matrix.shape[0] != matrix.shape[1]:
                raise ValueError("Matrix must be square for eigenvalue calculation")
            eigenvals = np.linalg.eigvals(matrix)
            # Handle complex eigenvalues
            result = []
            for val in eigenvals:
                if np.isreal(val):
                    result.append(float(val.real))
                else:
                    result.append(f"{val.real:.6f} + {val.imag:.6f}i")
            return result
        elif action == 'trace':
            if matrix.shape[0] != matrix.shape[1]:
                raise ValueError("Matrix must be square for trace calculation")
            return float(np.trace(matrix))
        else:
            return f"Unknown matrix operation: {action}"

    except np.linalg.LinAlgError as e:
        raise ValueError(f"Linear algebra error: {str(e)}")
    except Exception as e:
        raise ValueError(f"Matrix calculation error: {str(e)}")


def handle_graph_calculation(expression, action):
    """Handle graph operations with improved function parsing"""
    try:
        if action == 'plot':
            # Clean function expression
            func_expr = expression.replace('f(x)=', '').replace('f(x) =', '').strip()

            if not func_expr:
                return {"error": "Please enter a function"}

            # Validate and parse function
            validated_expr = validate_and_clean_function(func_expr)

            # Generate sample data for plotting with better range
            x_values = []
            y_values = []

            # Use more points for smoother curves
            num_points = 300
            x_min, x_max = -10, 10

            for i in range(num_points + 1):
                x = x_min + (i / num_points) * (x_max - x_min)
                x_values.append(x)

                try:
                    y = evaluate_function(validated_expr, x)
                    # Check for reasonable y values
                    if abs(y) > 1e6:  # Cap extremely large values
                        y_values.append(None)
                    else:
                        y_values.append(y)
                except:
                    y_values.append(None)

            return {
                'type': 'graph_data',
                'x_values': x_values,
                'y_values': y_values,
                'expression': func_expr,
                'success': True
            }
        else:
            return {"message": f"Graph action '{action}' completed"}

    except Exception as e:
        return {"error": f"Graph calculation error: {str(e)}", "success": False}


def validate_and_clean_function(func_expr):
    """Validate and clean function expression for safe evaluation"""
    # Remove dangerous functions and keywords
    dangerous_patterns = [
        'import', 'exec', 'eval', 'open', 'file', 'input', 'raw_input',
        '__', 'lambda', 'def', 'class', 'for', 'while', 'if', 'else',
        'try', 'except', 'with', 'assert', 'del', 'global', 'nonlocal'
    ]

    func_lower = func_expr.lower()
    for pattern in dangerous_patterns:
        if pattern in func_lower:
            raise ValueError(f"Invalid function: contains '{pattern}'")

    # Replace common mathematical expressions
    replacements = [
        (r'\^', '**'),  # Power operator
        (r'\bpi\b', str(math.pi)),
        (r'\be\b(?!\w)', str(math.e)),  # e but not part of other words
        (r'\babs\(', 'abs('),
    ]

    cleaned = func_expr
    for pattern, replacement in replacements:
        cleaned = re.sub(pattern, replacement, cleaned)

    return cleaned


def evaluate_function(expression, x_value):
    """Safely evaluate mathematical function at given x value"""
    # Replace x with the actual value
    expr = expression.replace('x', f'({x_value})')

    # Define safe mathematical functions
    safe_dict = {
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'asin': math.asin,
        'acos': math.acos,
        'atan': math.atan,
        'sinh': math.sinh,
        'cosh': math.cosh,
        'tanh': math.tanh,
        'log': math.log10,
        'ln': math.log,
        'sqrt': math.sqrt,
        'exp': math.exp,
        'abs': abs,
        'ceil': math.ceil,
        'floor': math.floor,
        'round': round,
        'pi': math.pi,
        'e': math.e,
        'pow': pow,
    }

    # Evaluate with restricted builtins
    try:
        result = eval(expr, {"__builtins__": {}}, safe_dict)
        return float(result)
    except:
        raise ValueError("Cannot evaluate function at this point")


@csrf_exempt
def preferences_api(request):
    """API endpoint for user preferences"""
    if request.method == 'GET':
        user, session_key = get_user_session(request)

        prefs, created = UserPreferences.objects.get_or_create(
            user=user,
            session_key=session_key,
            defaults={
                'theme': 'dark',
                'decimal_places': 10,
                'angle_unit': 'rad',
                'memory_value': 0
            }
        )

        return JsonResponse({
            'theme': prefs.theme,
            'decimal_places': prefs.decimal_places,
            'angle_unit': prefs.angle_unit,
            'memory_value': float(prefs.memory_value)
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            user, session_key = get_user_session(request)

            prefs, created = UserPreferences.objects.get_or_create(
                user=user,
                session_key=session_key
            )

            # Update preferences
            if 'theme' in data:
                prefs.theme = data['theme']
            if 'decimal_places' in data:
                prefs.decimal_places = int(data['decimal_places'])
            if 'angle_unit' in data:
                prefs.angle_unit = data['angle_unit']
            if 'memory_value' in data:
                prefs.memory_value = Decimal(str(data['memory_value']))

            prefs.save()

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'error': str(e), 'success': False}, status=400)

    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def history_api(request):
    """API endpoint for calculation history"""
    user, session_key = get_user_session(request)

    if user:
        history = CalculationHistory.objects.filter(user=user)
    else:
        history = CalculationHistory.objects.filter(session_key=session_key)

    # Search functionality
    search_query = request.GET.get('search', '').strip()
    if search_query:
        history = history.filter(
            Q(expression__icontains=search_query) |
            Q(result__icontains=search_query)
        )

    # Pagination
    page_number = request.GET.get('page', 1)
    items_per_page = min(int(request.GET.get('per_page', 20)), 100)

    paginator = Paginator(history.order_by('-timestamp'), items_per_page)
    page_obj = paginator.get_page(page_number)

    history_data = []
    for calc in page_obj:
        history_data.append({
            'id': calc.id,
            'expression': calc.expression,
            'result': calc.result,
            'type': calc.calculation_type,
            'timestamp': calc.timestamp.isoformat(),
        })

    return JsonResponse({
        'history': history_data,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'total_count': paginator.count,
    })


@csrf_exempt
def clear_history_api(request):
    """Clear calculation history"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)

    user, session_key = get_user_session(request)

    if user:
        deleted_count, _ = CalculationHistory.objects.filter(user=user).delete()
    else:
        deleted_count, _ = CalculationHistory.objects.filter(session_key=session_key).delete()

    return JsonResponse({'success': True, 'deleted_count': deleted_count})


@csrf_exempt
def memory_api(request):
    """API endpoint for memory operations"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)

    try:
        data = json.loads(request.body)
        action = data.get('action', '')
        value = data.get('value', 0)

        user, session_key = get_user_session(request)

        prefs, created = UserPreferences.objects.get_or_create(
            user=user,
            session_key=session_key,
            defaults={'memory_value': 0}
        )

        if action == 'store':
            prefs.memory_value = Decimal(str(value))
        elif action == 'recall':
            return JsonResponse({'value': float(prefs.memory_value)})
        elif action == 'clear':
            prefs.memory_value = Decimal('0')
        elif action == 'add':
            prefs.memory_value += Decimal(str(value))
        elif action == 'subtract':
            prefs.memory_value -= Decimal(str(value))

        prefs.save()

        return JsonResponse({
            'success': True,
            'memory_value': float(prefs.memory_value)
        })

    except Exception as e:
        return JsonResponse({'error': str(e), 'success': False}, status=400)


# Backward compatibility views
def scientific_calculator(request):
    """Scientific calculator view"""
    return calculator_view(request)


def matrix_calculator(request):
    """Matrix calculator view"""
    return calculator_view(request)


def graph_calculator(request):
    """Graphing calculator view"""
    return calculator_view(request)
