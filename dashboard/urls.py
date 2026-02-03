from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    path("", views.dashboard_view, name="index"),
    path("tree-fragment/", views.tree_fragment, name="tree-fragment"),
    path("bonus-events-fragment/", views.bonus_events_fragment, name="bonus-events-fragment"),
]

