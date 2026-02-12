"""
Enqueue release_pairs_for_user for a given user (dev/demo).
Usage: python manage.py enqueue_demo_bonus --user <id>
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from tasks.tasks import release_pairs_for_user

User = get_user_model()


class Command(BaseCommand):
    help = "Enqueue Celery task release_pairs_for_user for the given user (dev/demo)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            type=int,
            required=True,
            help="User ID to enqueue release_pairs_for_user for.",
        )

    def handle(self, *args, **options):
        user_id = options["user"]
        if not User.objects.filter(pk=user_id).exists():
            self.stderr.write(self.style.ERROR(f"User with id={user_id} not found."))
            return
        release_pairs_for_user.delay(user_id)
        self.stdout.write(self.style.SUCCESS(f"Queued release_pairs_for_user for user_id={user_id}."))
