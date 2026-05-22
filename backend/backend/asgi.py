"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables early
base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / '.env', override=True)

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_asgi_application()
