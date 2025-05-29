import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test homepage
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  });
  sleep(1);

  // Test features page
  const featuresRes = http.get(`${BASE_URL}/features`);
  check(featuresRes, {
    'features page status is 200': (r) => r.status === 200,
    'features page loads fast': (r) => r.timings.duration < 500,
  });
  sleep(1);

  // Test pricing page
  const pricingRes = http.get(`${BASE_URL}/pricing`);
  check(pricingRes, {
    'pricing page status is 200': (r) => r.status === 200,
    'pricing page loads fast': (r) => r.timings.duration < 500,
  });
  sleep(1);

  // Test about page
  const aboutRes = http.get(`${BASE_URL}/about`);
  check(aboutRes, {
    'about page status is 200': (r) => r.status === 200,
    'about page loads fast': (r) => r.timings.duration < 500,
  });
  sleep(1);

  // Test contact page
  const contactRes = http.get(`${BASE_URL}/contact`);
  check(contactRes, {
    'contact page status is 200': (r) => r.status === 200,
    'contact page loads fast': (r) => r.timings.duration < 500,
  });
  sleep(1);
} 