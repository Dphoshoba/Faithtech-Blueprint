// Optional: extend Jest's expect functionality with @testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder and TextDecoder for JSDOM
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder; // Cast to avoid type mismatch