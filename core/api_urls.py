from django.urls import path

from . import api_views

urlpatterns = [
    path("auth/login/", api_views.api_login),
    path("auth/register/", api_views.api_register),
    path("auth/me/", api_views.api_me),
    path("auth/logout/", api_views.api_logout),
    path("products/", api_views.api_products),
    path("dashboard/", api_views.api_dashboard),
    path("dashboard/tree/", api_views.api_tree_data),
    path("dashboard/bonus-events/", api_views.api_bonus_events),
]
