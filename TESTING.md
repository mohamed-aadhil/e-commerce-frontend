# Testing Guide

This document provides an overview of the testing setup and best practices for the Angular application.

## Test Environment

The application uses the following testing tools:
- **Jasmine**: Test framework
- **Karma**: Test runner
- **Jasmine Spec Reporter**: For better test output
- **Karma Coverage**: For code coverage reports

## Running Tests

### Development Mode
Run tests in watch mode (recommended during development):
```bash
npm test
# or
ng test
```

### Watch Mode
Run tests in watch mode with coverage:
```bash
npm run test:watch
```

### CI Mode
Run tests once and exit (for CI/CD pipelines):
```bash
npm run test:ci
```

### Generate Coverage Report
Generate a coverage report:
```bash
npm run test:coverage
```
The coverage report will be available at `coverage/frontend-app/index.html`

### Debugging Tests
To debug tests in Chrome DevTools:
```bash
npm run test:debug
```
Then open Chrome and navigate to `chrome://inspect`

## Test Environment Configuration

The test environment uses a dedicated configuration (`environment.test.ts`) with the following features:
- Mock services enabled by default
- Test-specific logging
- Disabled animations for faster test execution

## Writing Tests

### Test File Naming
Test files should be named with the pattern `*.spec.ts` and placed next to the component/service they test.

### Example Test
```typescript
describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyModule],
      declarations: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Mocking

### HTTP Requests
Use Angular's `HttpClientTestingModule` to mock HTTP requests:

```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyService]
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  it('should fetch data', () => {
    const mockData = { id: 1, name: 'Test' };
    
    service.getData().subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('api/data');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on the state from other tests.
2. **Use Mocks**: Mock external dependencies to keep tests fast and reliable.
3. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it.
4. **Keep Tests Simple**: Each test should verify one specific behavior.
5. **Use Descriptive Test Names**: Test names should describe the expected behavior.

## Code Coverage

We aim to maintain at least 80% code coverage. The coverage report includes:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

To view the coverage report after running tests:
```bash
open coverage/frontend-app/index.html
```

## CI/CD Integration

The test suite runs automatically in the CI/CD pipeline. The build will fail if:
- Any test fails
- Code coverage falls below the threshold
- TypeScript compilation fails
- Linting fails

## Debugging Failed Tests

1. **Check the Error Message**: The error message usually points to the issue.
2. **Run a Single Test File**: Use `fdescribe` or `fit` to focus on a specific test.
3. **Debug in Browser**: Use `npm run test:debug` to debug in Chrome DevTools.
4. **Check Console Output**: Look for error messages in the console output.
5. **Verify Mocks**: Ensure all dependencies are properly mocked.
