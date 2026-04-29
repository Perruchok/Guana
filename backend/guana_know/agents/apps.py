"""
App configuration for the agents module.
"""

from django.apps import AppConfig


class AgentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'guana_know.agents'
    verbose_name = 'Agents'
