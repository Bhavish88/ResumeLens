from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from resumes.models import Resume
from analysis.models import AnalysisReport

User = get_user_model()

class AnalysisAppTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            email='testuser@example.com',
            name='Test User',
            password='testpassword123'
        )
        # Create a test resume for the user
        self.resume = Resume.objects.create(
            user=self.user,
            resume_file='resumes/test_resume.pdf',
            extracted_text='This is a long sample text from a resume to ensure that it has enough characters for parsing.',
            target_role='Python Developer',
            file_name='test_resume.pdf'
        )
        
        # Define mock AI response containing category scores and parsed details
        self.mock_ai_result = {
            'ats_score': 85,
            'category_scores': {
                'formatting': 18,
                'skills_match': 20,
                'experience_quality': 17,
                'projects_portfolio': 12,
                'education_certifications': 9,
                'resume_structure': 9
            },
            'missing_skills': ['Docker', 'Kubernetes'],
            'strengths': ['Solid Django backend experience', 'Quantified achievements'],
            'weaknesses': ['Lacks cloud containerization'],
            'suggestions': ['Add containerization to projects'],
            'final_verdict': 'Highly qualified candidate for the Python Developer position.',
            'full_ai_response': '{"raw": "mocked"}',
            'error': None
        }

    def test_unauthenticated_requests_are_blocked(self):
        url = reverse('analysis:analyze', kwargs={'resume_id': self.resume.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('analysis.views.analyze_resume_with_gemini')
    def test_analyze_resume_endpoint(self, mock_gemini):
        mock_gemini.return_value = self.mock_ai_result

        # Authenticate user
        self.client.force_authenticate(user=self.user)

        url = reverse('analysis:analyze', kwargs={'resume_id': self.resume.id})
        response = self.client.post(url)

        # Check response structure
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('report', response.data)
        
        # Verify JSON field outputs are serialized
        report_data = response.data['report']
        self.assertEqual(report_data['ats_score'], 85)
        self.assertEqual(report_data['category_scores']['formatting'], 18)
        self.assertEqual(report_data['category_scores']['skills_match'], 20)
        # Check if saved to DB correctly
        db_report = AnalysisReport.objects.get(resume=self.resume)
        self.assertEqual(db_report.ats_score, 85)
        self.assertEqual(db_report.category_scores['formatting'], 18)

    def test_get_report_by_resume_endpoint(self):
        # Pre-populate report
        report = AnalysisReport.objects.create(
            resume=self.resume,
            ats_score=75,
            category_scores={
                'formatting': 15,
                'skills_match': 18,
                'experience_quality': 14,
                'projects_portfolio': 11,
                'education_certifications': 8,
                'resume_structure': 9
            },
            missing_skills=['Java'],
            strengths=['Layout'],
            weaknesses=['Missing skills'],
            suggestions=['Study more'],
            final_verdict='Fair resume'
        )

        self.client.force_authenticate(user=self.user)
        url = reverse('analysis:result_by_resume', kwargs={'resume_id': self.resume.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['ats_score'], 75)
        self.assertEqual(response.data['category_scores']['formatting'], 15)

    def test_dashboard_stats_endpoint(self):
        # Create a report for stats testing
        AnalysisReport.objects.create(
            resume=self.resume,
            ats_score=90,
            category_scores={
                'formatting': 18, 'skills_match': 23, 'experience_quality': 18,
                'projects_portfolio': 13, 'education_certifications': 9, 'resume_structure': 9
            },
            missing_skills=[], strengths=[], weaknesses=[], suggestions=[], final_verdict='Excellent'
        )

        self.client.force_authenticate(user=self.user)
        url = reverse('analysis:dashboard')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_resumes'], 1)
        self.assertEqual(response.data['total_analyses'], 1)
        self.assertEqual(response.data['best_ats_score'], 90)
        self.assertEqual(response.data['average_ats_score'], 90.0)
