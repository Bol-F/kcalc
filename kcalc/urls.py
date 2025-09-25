from django.urls import path

from . import views

app_name = 'calculator'

urlpatterns = [
    path('', views.calculator_view, name='calculator'),
    path('api/calculate/', views.calculate_api, name='calculate_api'),
    path('api/preferences/', views.preferences_api, name='preferences_api'),
    path('api/history/', views.history_api, name='history_api'),
    path('api/clear-history/', views.clear_history_api, name='clear_history_api'),
    path('api/memory/', views.memory_api, name='memory_api'),
]
