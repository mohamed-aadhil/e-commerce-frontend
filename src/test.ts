/**
 * This file is used to configure the test environment for Angular applications.
 * It initializes the Angular testing environment and sets up any necessary mocks.
 */

// First, initialize the Angular testing environment.
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import 'zone.js';
import 'zone.js/testing';
import { environment } from './environments/environment';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { 
    teardown: { 
      // Use destroyAfterEach: true for better test isolation
      // Set to false only if you have tests that rely on previous test state
      destroyAfterEach: true,
      // Re-usable test module configuration
      rethrowErrors: false
    } 
  }
);

// Add jasmine type declaration
declare const jasmine: any;

// Mock global objects used in tests
Object.defineProperty(window, 'CSS', { 
  value: { 
    supports: () => false,
    escape: (ident: string) => ident
  } 
});

// Configure test environment
console.log(`Running tests in ${(environment as any).environmentName || 'test'} environment`);

// If you're using some setup that needs to be mocked in all tests
// For example, localStorage or other browser APIs
interface StorageMock {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const mockStorage = (): StorageMock => {
  let storage: { [key: string]: string } = {};
  return {
    getItem: (key: string) => (key in storage ? storage[key] : null),
    setItem: (key: string, value: string) => (storage[key] = value || ''),
    removeItem: (key: string) => delete storage[key],
    clear: () => (storage = {}),
  };
};

Object.defineProperty(window, 'localStorage', { value: mockStorage() });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage() });

// Output more information when a test fails
if (typeof jasmine !== 'undefined') {
  const env = jasmine.getEnv();
  
  interface SpecResult {
    fullName: string;
    failedExpectations: Array<{
      message: string;
      stack?: string;
    }>;
  }

  env.addReporter({
    specDone: function (result: SpecResult) {
      if (result.failedExpectations && result.failedExpectations.length > 0) {
        console.error('Test failed:', result.fullName);
        result.failedExpectations.forEach((failed) => {
          console.error(failed.message);
          if (failed.stack) {
            console.error(failed.stack);
          }
        });
      }
    },
  });

  // Fail tests that take too long (10 seconds by default)
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
}
