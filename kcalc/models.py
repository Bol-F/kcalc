from django.contrib.auth.models import User
from django.db import models


class CalculationHistory(models.Model):
    CALCULATION_TYPES = [
        ('basic', 'Basic'),
        ('scientific', 'Scientific'),
        ('matrix', 'Matrix'),
        ('graph', 'Graphing'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=255, null=True, blank=True)
    expression = models.TextField()
    result = models.TextField()
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_TYPES, default='basic')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.expression} = {self.result}"


class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=255, null=True, blank=True)
    theme = models.CharField(max_length=20, default='dark')
    decimal_places = models.IntegerField(default=10)
    angle_unit = models.CharField(max_length=10, default='rad', choices=[('rad', 'Radians'), ('deg', 'Degrees')])
    memory_value = models.DecimalField(max_digits=50, decimal_places=20, default=0)

    class Meta:
        unique_together = ['user', 'session_key']
