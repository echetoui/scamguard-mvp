import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock jest for tests that use jest.fn()
global.jest = {
  fn: vi.fn,
};
