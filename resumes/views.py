"""
Views for the resumes app.

ResumeUploadView    POST   /api/resumes/upload/        — upload PDF, extract text
ResumeListView      GET    /api/resumes/               — list user's resumes
ResumeDetailView    GET    /api/resumes/<id>/          — single resume detail
ResumeDeleteView    DELETE /api/resumes/<id>/delete/   — delete a resume
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Resume
from .serializers import ResumeUploadSerializer, ResumeListSerializer, ResumeDetailSerializer
from .pdf_extractor import extract_text_from_pdf


class ResumeUploadView(APIView):
    """
    POST /api/resumes/upload/
    Accepts a PDF file and a target_role.
    Extracts text from PDF and saves everything to the database.

    Form data:
      - resume_file  (File)   : PDF document
      - target_role  (string) : e.g. "Python Developer"
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'message': 'Invalid upload data.',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data['resume_file']
        target_role = serializer.validated_data['target_role']

        # Step 1: Extract text from PDF
        extracted_text = extract_text_from_pdf(uploaded_file)

        if not extracted_text:
            return Response({
                'message': 'Could not extract text from the uploaded PDF. '
                           'Please ensure the PDF contains selectable text (not a scanned image).',
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # Step 2: Reset file pointer after extraction (pdfplumber reads it)
        uploaded_file.seek(0)

        # Step 3: Save resume to database
        resume = Resume.objects.create(
            user=request.user,
            resume_file=uploaded_file,
            extracted_text=extracted_text,
            target_role=target_role,
            file_name=uploaded_file.name,
        )

        return Response({
            'message': 'Resume uploaded and text extracted successfully.',
            'resume': ResumeDetailSerializer(resume).data,
        }, status=status.HTTP_201_CREATED)


class ResumeListView(APIView):
    """
    GET /api/resumes/
    Returns all resumes belonging to the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user).select_related('user')

        # Try to prefetch analysis if the related model exists
        try:
            resumes = resumes.prefetch_related('analysis_report')
        except Exception:
            pass

        serializer = ResumeListSerializer(resumes, many=True)

        return Response({
            'count': resumes.count(),
            'resumes': serializer.data,
        }, status=status.HTTP_200_OK)


class ResumeDetailView(APIView):
    """
    GET /api/resumes/<id>/
    Returns full detail of a single resume (including extracted text).
    Only the owner can view their resume.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response(
                {'message': 'Resume not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ResumeDetailSerializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ResumeDeleteView(APIView):
    """
    DELETE /api/resumes/<id>/delete/
    Deletes a resume and its associated file from storage.
    Only the owner can delete their resume.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response(
                {'message': 'Resume not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Delete the physical file from media storage
        if resume.resume_file:
            try:
                resume.resume_file.delete(save=False)
            except Exception:
                pass  # If file is already gone, continue

        resume.delete()

        return Response(
            {'message': 'Resume deleted successfully.'},
            status=status.HTTP_200_OK
        )
