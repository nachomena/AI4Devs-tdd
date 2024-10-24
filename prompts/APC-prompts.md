# Using Github Copilot

## 1st prompt
Get the context of the backend part of the project. Design the unit tests in a whole file for the addCandidate feature

## 2nd prompt
I have the tests files in /src/tests/tests-APC.test.ts, where did you expect to insert these tests?

## 3rd prompt
I fixed the imports manually, it was "../domain/x" and not "../../domain/x". Now, after running the tests, I spotted this issue " TypeError: Cannot read properties of undefined (reading 'push')" for the test "should add a candidate successfully", could you fix it?

## 4th prompt
There are errors in the candidateInstance object with non-existent attributes

_Note: in this prompt, I added the files involved, because Copilot was not able to understand the context of the prompt._

## 5th prompt
I have this error "TS2352: Conversion of type typeof Candidate to type Mock<any, any, any> may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to unknown first." for the line: (Candidate as jest.Mock).mockImplementation(() => candidateInstance);
