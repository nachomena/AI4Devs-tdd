import { addCandidate } from '../application/services/candidateService';
import { uploadFile } from '../application/services/fileUploadService';
import { Candidate } from '../domain/models/Candidate';
import { Education } from '../domain/models/Education';
import { WorkExperience } from '../domain/models/WorkExperience';
import { Resume } from '../domain/models/Resume';
import { validateCandidateData } from '../application/validator';
import * as fileUploadService from '../application/services/fileUploadService';
import { Request, Response, NextFunction } from 'express';

// Mocks
jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');
jest.mock('../application/validator');
jest.mock('../application/services/fileUploadService');

describe('Candidate Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCandidateData = {
    name: 'John Doe',
    email: 'john@example.com',
    educations: [{ school: 'University A', degree: 'Bachelor' }],
    workExperiences: [{ company: 'Company X', position: 'Developer' }],
    cv: { fileName: 'resume.pdf' }
  };

  test('addCandidate should create a new candidate with all associated data', async () => {
    const mockSavedCandidate = { id: '123', ...mockCandidateData };
    (Candidate.prototype.save as jest.Mock).mockResolvedValue(mockSavedCandidate);
    (Education.prototype.save as jest.Mock).mockResolvedValue({});
    (WorkExperience.prototype.save as jest.Mock).mockResolvedValue({});
    (Resume.prototype.save as jest.Mock).mockResolvedValue({});

    const result = await addCandidate(mockCandidateData);

    expect(validateCandidateData).toHaveBeenCalledWith(mockCandidateData);
    expect(Candidate).toHaveBeenCalledWith(mockCandidateData);
    expect(Education).toHaveBeenCalledWith(mockCandidateData.educations[0]);
    expect(WorkExperience).toHaveBeenCalledWith(mockCandidateData.workExperiences[0]);
    expect(Resume).toHaveBeenCalledWith(mockCandidateData.cv);
    expect(result).toEqual(mockSavedCandidate);
  });

  test('addCandidate should handle candidate without education', async () => {
    const candidateWithoutEducation = { ...mockCandidateData, educations: undefined };
    const mockSavedCandidate = { id: '123', ...candidateWithoutEducation };
    (Candidate.prototype.save as jest.Mock).mockResolvedValue(mockSavedCandidate);

    await addCandidate(candidateWithoutEducation);

    expect(Education.prototype.save).not.toHaveBeenCalled();
  });

  test('addCandidate should handle candidate without work experience', async () => {
    const candidateWithoutWorkExperience = { ...mockCandidateData, workExperiences: undefined };
    const mockSavedCandidate = { id: '123', ...candidateWithoutWorkExperience };
    (Candidate.prototype.save as jest.Mock).mockResolvedValue(mockSavedCandidate);

    await addCandidate(candidateWithoutWorkExperience);

    expect(WorkExperience.prototype.save).not.toHaveBeenCalled();
  });

  test('addCandidate should handle candidate without CV', async () => {
    const candidateWithoutCV = { ...mockCandidateData, cv: undefined };
    const mockSavedCandidate = { id: '123', ...candidateWithoutCV };
    (Candidate.prototype.save as jest.Mock).mockResolvedValue(mockSavedCandidate);

    await addCandidate(candidateWithoutCV);

    expect(Resume.prototype.save).not.toHaveBeenCalled();
  });

  test('addCandidate should throw an error for invalid candidate data', async () => {
    (validateCandidateData as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid candidate data');
    });

    await expect(addCandidate(mockCandidateData)).rejects.toThrow('Invalid candidate data');
  });

  test('addCandidate should throw an error for duplicate email', async () => {
    (Candidate.prototype.save as jest.Mock).mockRejectedValue({ code: 'P2002' });

    await expect(addCandidate(mockCandidateData)).rejects.toThrow('The email already exists in the database');
  });

  test('addCandidate should throw an error for other database errors', async () => {
    const dbError = new Error('Database connection failed');
    (Candidate.prototype.save as jest.Mock).mockRejectedValue(dbError);

    await expect(addCandidate(mockCandidateData)).rejects.toThrow('Database connection failed');
  });
});

describe('File Upload Service', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      file: {
        fieldname: 'file',
        originalname: 'original.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 12345,
        destination: '/uploads',
        filename: 'file.pdf',
        path: '/uploads/file.pdf',
        buffer: Buffer.from('mock file content'),
      } as Express.Multer.File
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('uploadFile should handle successful PDF file upload', () => {
    (fileUploadService.uploadFile as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        filePath: '/uploads/file.pdf',
        fileType: 'application/pdf'
      });
    });

    fileUploadService.uploadFile(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      filePath: '/uploads/file.pdf',
      fileType: 'application/pdf'
    });
  });

  test('uploadFile should handle successful DOCX file upload', () => {
    mockRequest.file = {
      fieldname: 'file',
      originalname: 'original.docx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 12345,
      destination: '/uploads',
      filename: 'file.docx',
      path: '/uploads/file.docx',
      buffer: Buffer.from('mock file content'),
    } as Express.Multer.File;

    (fileUploadService.uploadFile as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        filePath: '/uploads/file.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    });

    fileUploadService.uploadFile(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      filePath: '/uploads/file.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  });

  test('uploadFile should handle file size limit exceeded error', () => {
    (fileUploadService.uploadFile as jest.Mock).mockImplementation((req, res) => {
      res.status(500).json({ error: 'LIMIT_FILE_SIZE' });
    });

    fileUploadService.uploadFile(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'LIMIT_FILE_SIZE' });
  });

  test('uploadFile should handle other upload errors', () => {
    (fileUploadService.uploadFile as jest.Mock).mockImplementation((req, res) => {
      res.status(500).json({ error: 'LIMIT_UNEXPECTED_FILE' });
    });

    fileUploadService.uploadFile(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'LIMIT_UNEXPECTED_FILE' });
  });

  test('uploadFile should handle non-multer errors', () => {
    const genericError = new Error('Generic error');
    (fileUploadService.uploadFile as jest.Mock).mockImplementation((req, res) => {
      res.status(500).json({ error: 'Generic error' });
    });

    fileUploadService.uploadFile(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Generic error' });
  });

  test('uploadFile should reject invalid file types', () => {
    mockRequest.file = undefined;
    (fileUploadService.uploadFile as jest.Mock).mockImplementation((req, res) => {
      res.status(400).json({ error: 'Invalid file type, only PDF and DOCX are allowed!' });
    });

    fileUploadService.uploadFile(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid file type, only PDF and DOCX are allowed!' });
  });
});
