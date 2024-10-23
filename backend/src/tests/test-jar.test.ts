import { addCandidate } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';
import { Candidate } from '../domain/models/Candidate';
import { Education } from '../domain/models/Education';
import { WorkExperience } from '../domain/models/WorkExperience';
import { Resume } from '../domain/models/Resume';

jest.mock('../application/validator');
jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');

describe('addCandidate', () => {
    const mockCandidateData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        educations: [{ degree: 'B.Sc', institution: 'University' }],
        workExperiences: [{ company: 'Company', role: 'Developer' }],
        cv: { fileName: 'resume.pdf' }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Ensure that the mocked Candidate instances have the necessary properties initialized
        Object.defineProperty(Candidate.prototype, 'education', {
            value: [],
            writable: true
        });
        Object.defineProperty(Candidate.prototype, 'workExperience', {
            value: [],
            writable: true
        });
        Object.defineProperty(Candidate.prototype, 'resumes', {
            value: [],
            writable: true
        });
    });

    it('should throw an error if validation fails', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {
            throw new Error('Validation error');
        });

        await expect(addCandidate(mockCandidateData)).rejects.toThrow('Validation error');
    });

    it('should add a candidate successfully', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockResolvedValue({ id: '1' });
        (Education.prototype.save as jest.Mock).mockResolvedValue({});
        (WorkExperience.prototype.save as jest.Mock).mockResolvedValue({});
        (Resume.prototype.save as jest.Mock).mockResolvedValue({});

        const result = await addCandidate(mockCandidateData);

        expect(result).toEqual({ id: '1' });
        expect(Candidate.prototype.save).toHaveBeenCalled();
        expect(Education.prototype.save).toHaveBeenCalled();
        expect(WorkExperience.prototype.save).toHaveBeenCalled();
        expect(Resume.prototype.save).toHaveBeenCalled();
    });

    it('should throw an error if saving candidate fails', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(addCandidate(mockCandidateData)).rejects.toThrow('Database error');
    });

    it('should throw an error if saving education fails', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockResolvedValue({ id: '1' });
        (Education.prototype.save as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(addCandidate(mockCandidateData)).rejects.toThrow('Database error');
    });

    it('should throw an error if saving work experience fails', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockResolvedValue({ id: '1' });
        (Education.prototype.save as jest.Mock).mockResolvedValue({});
        (WorkExperience.prototype.save as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(addCandidate(mockCandidateData)).rejects.toThrow('Database error');
    });

    it('should throw an error if saving resume fails', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockResolvedValue({ id: '1' });
        (Education.prototype.save as jest.Mock).mockResolvedValue({});
        (WorkExperience.prototype.save as jest.Mock).mockResolvedValue({});
        (Resume.prototype.save as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(addCandidate(mockCandidateData)).rejects.toThrow('Database error');
    });

    it('should throw an error if email already exists', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockRejectedValue({ code: 'P2002' });

        await expect(addCandidate(mockCandidateData)).rejects.toThrow('The email already exists in the database');
    });
});