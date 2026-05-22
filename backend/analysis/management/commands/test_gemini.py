import os
from django.core.management.base import BaseCommand
from django.conf import settings
from google import genai
from google.genai import types
from analysis.gemini_service import _clean_exception_message

class Command(BaseCommand):
    help = 'Diagnostic tool to test Google Gemini API connection and keys.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== Gemini API Diagnostic Tool ==="))

        # 1. Check environment load and settings
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            self.stdout.write(self.style.ERROR("Error: GEMINI_API_KEY is not defined in Django settings."))
            return

        # Mask API key for security
        masked_key = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "INVALID/EMPTY"
        self.stdout.write(f"Loaded API Key: {masked_key}")
        self.stdout.write(f"Key Length: {len(api_key)} characters")

        # 2. Test connection with gemini-2.5-flash
        models_to_test = ['gemini-2.5-flash']
        
        for model in models_to_test:
            self.stdout.write(self.style.WARNING(f"\nTesting connection with model: {model}..."))
            try:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model,
                    contents="Hello, this is a connection check.",
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=1024,
                    ),
                )
                self.stdout.write(self.style.SUCCESS(f"Success! Model {model} responded successfully."))
                self.stdout.write(f"Response: {response.text.strip()}")
            except Exception as e:
                raw_err = str(e)
                clean_err = _clean_exception_message(raw_err)
                self.stdout.write(self.style.ERROR(f"Connection failed for {model}:"))
                self.stdout.write(f"  Cleaned Error: {clean_err}")
                self.stdout.write(f"  Raw Error Message: {raw_err}")
                if "API_KEY_INVALID" in raw_err or "expired" in raw_err.lower():
                    self.stdout.write(self.style.NOTICE("Recommendation: Check your API key. It appears to be invalid or expired."))
