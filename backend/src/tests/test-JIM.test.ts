import { addCandidate } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';
import { Candidate } from '../domain/models/Candidate';
import { Education } from '../domain/models/Education';
import { Resume } from '../domain/models/Resume';
import { WorkExperience } from '../domain/models/WorkExperience';

// Mocks
jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');
jest.mock('../application/validator');

describe('Candidate Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCandidateData = {
    name: 'John Doe',
    email: 'john@example.com',
    educations: [{ school: 'University A', degree: 'Bachelor' }],
    workExperiences: [{ company: 'Company X', position: 'Developer' }],
    cv: { fileName: 'resume.pdf' },
  };

  const mockSavedCandidate = { id: '123', ...mockCandidateData };

    // Mock the Candidate constructor to initialize arrays
    (Candidate as unknown as jest.Mock).mockImplementation(() => {
      return {
        ...mockCandidateData,
        education: [],
        workExperience: [],
        resumes: [],
        save: jest.fn().mockResolvedValue(mockSavedCandidate),
      };
    });

  jest.spyOn(Candidate.prototype, 'save').mockImplementation(() =>
    Promise.resolve({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: null,
      address: null
    })
  );

  jest.spyOn(Education.prototype, 'save').mockResolvedValue({
    id: 1,
    institution: 'Institution Name',
    title: 'Title',
    startDate: new Date(),
    endDate: null,
    candidateId: 1
  });

  jest.spyOn(WorkExperience.prototype, 'save').mockResolvedValue({
    id: 1,
    startDate: new Date(),
    endDate: null,
    candidateId: 1,
    company: 'Company Name',
    position: 'Position',
    description: 'Description'
  });

  jest.spyOn(Resume.prototype, 'save').mockResolvedValue(
    new Resume({
      id: 1,
      candidateId: 1,
      filePath: "/test/path",
      fileType: ".pdf",
      uploadDate: new Date()
    })
  );

  test('addCandidate should create a new candidate with all associated data', async () => {
    const result = await addCandidate(mockCandidateData);

    expect(validateCandidateData).toHaveBeenCalledWith(mockCandidateData);
    expect(Candidate).toHaveBeenCalledWith(mockCandidateData);
    expect(Education).toHaveBeenCalledWith(mockCandidateData.educations[0]);
    expect(WorkExperience).toHaveBeenCalledWith(
      mockCandidateData.workExperiences[0],
    );
    expect(Resume).toHaveBeenCalledWith(mockCandidateData.cv);
    expect(result).toEqual(mockSavedCandidate);
  });

  test('addCandidate should handle candidate without education', async () => {
    const candidateWithoutEducation = {
      ...mockCandidateData,
      educations: undefined,
    };
    const mockSavedCandidateWithoutEducation = { id: '123', ...candidateWithoutEducation };
    (Candidate.prototype.save as jest.Mock).mockResolvedValue(
      mockSavedCandidateWithoutEducation,
    );

    await addCandidate(candidateWithoutEducation);

    expect(Education.prototype.save).not.toHaveBeenCalled();
  });

  test('addCandidate should handle candidate without work experience', async () => {
    const candidateWithoutWorkExperience = {
      ...mockCandidateData,
      workExperiences: undefined,
    };
    const mockSavedCandidateWithoutWorkExperience = { id: '123', ...candidateWithoutWorkExperience };
    (Candidate.prototype.save as jest.Mock).mockResolvedValue(
      mockSavedCandidateWithoutWorkExperience,
    );

    await addCandidate(candidateWithoutWorkExperience);

    expect(WorkExperience.prototype.save).not.toHaveBeenCalled();
  });

  test('addCandidate should handle candidate without CV', async () => {
    const candidateWithoutCV = { ...mockCandidateData, cv: undefined };
    const mockSavedCandidateWithoutCV = { id: '123', ...candidateWithoutCV };
    (Candidate.prototype.save as jest.Mock).mockResolvedValue(
      mockSavedCandidateWithoutCV,
    );

    await addCandidate(candidateWithoutCV);

    expect(Resume.prototype.save).not.toHaveBeenCalled();
  });

  test('addCandidate should throw an error for invalid candidate data', async () => {
    (validateCandidateData as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid candidate data');
    });

    await expect(addCandidate(mockCandidateData)).rejects.toThrow(
      'Invalid candidate data',
    );
  });

  test('addCandidate should throw an error for duplicate email', async () => {
    (Candidate.prototype.save as jest.Mock).mockRejectedValue({
      code: 'P2002',
    });

    await expect(addCandidate(mockCandidateData)).rejects.toThrow(
      'Error: Invalid candidate data',
    );
  });

  test('addCandidate should throw an error for other database errors', async () => {
    const dbError = new Error('Database connection failed');
    (Candidate.prototype.save as jest.Mock).mockRejectedValue(dbError);

    await expect(addCandidate(mockCandidateData)).rejects.toThrow(
      'Error: Invalid candidate data',
    );
  });
});
