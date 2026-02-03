from django.urls import path

from . import views

app_name = "storefront"

urlpatterns = [
    path("", views.storefront_home, name="home"),
]
