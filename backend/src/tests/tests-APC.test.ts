import { addCandidate } from '../application/services/candidateService';
import { Candidate } from '../domain/models/Candidate';
import { Education } from '../domain/models/Education';
import { WorkExperience } from '../domain/models/WorkExperience';
import { Resume } from '../domain/models/Resume';
import { validateCandidateData } from '../application/validator';

jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');
jest.mock('../application/validator');

describe('addCandidate', () => {
    const candidateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        educations: [{ degree: 'B.Sc', institution: 'University' }],
        workExperiences: [{ company: 'Company', position: 'Developer' }],
        cv: { fileName: 'resume.pdf', filePath: '/path/to/resume.pdf' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should add a candidate successfully', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockResolvedValue({ id: 1 });
        (Education.prototype.save as jest.Mock).mockResolvedValue({});
        (WorkExperience.prototype.save as jest.Mock).mockResolvedValue({});
        (Resume.prototype.save as jest.Mock).mockResolvedValue({});

        // Ensure that the candidate object has the necessary properties
        const candidateInstance = new Candidate(candidateData);
        candidateInstance.education = [];
        candidateInstance.workExperience = [];
        candidateInstance.resumes = [];

        (Candidate as unknown as jest.Mock).mockImplementation(() => candidateInstance);

        const result = await addCandidate(candidateData);

        expect(validateCandidateData).toHaveBeenCalledWith(candidateData);
        expect(Candidate.prototype.save).toHaveBeenCalled();
        expect(Education.prototype.save).toHaveBeenCalled();
        expect(WorkExperience.prototype.save).toHaveBeenCalled();
        expect(Resume.prototype.save).toHaveBeenCalled();
        expect(result).toEqual({ id: 1 });
    });

    it('should throw a validation error', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {
            throw new Error('Validation error');
        });

        await expect(addCandidate(candidateData)).rejects.toThrow('Validation error');
        expect(Candidate.prototype.save).not.toHaveBeenCalled();
    });

    it('should throw an error if email already exists', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockRejectedValue({ code: 'P2002' });

        await expect(addCandidate(candidateData)).rejects.toThrow('The email already exists in the database');
    });

    it('should throw a generic error', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {});
        (Candidate.prototype.save as jest.Mock).mockRejectedValue(new Error('Generic error'));

        await expect(addCandidate(candidateData)).rejects.toThrow('Generic error');
    });
});