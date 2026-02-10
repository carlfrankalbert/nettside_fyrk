/**
 * OKR API Load Test
 *
 * This k6 load test script tests the OKR evaluation endpoint under various load conditions.
 * It tests both streaming and non-streaming modes.
 *
 * Usage:
 *   # Run smoke test (quick validation)
 *   k6 run --env SCENARIO=smoke load-tests/okr-api.js
 *
 *   # Run load test (sustained load)
 *   k6 run --env SCENARIO=load load-tests/okr-api.js
 *
 *   # Run stress test (find breaking point)
 *   k6 run --env SCENARIO=stress load-tests/okr-api.js
 *
 *   # Run spike test (sudden traffic surge)
 *   k6 run --env SCENARIO=spike load-tests/okr-api.js
 *
 *   # Run against local server
 *   k6 run --env BASE_URL=http://localhost:4321 load-tests/okr-api.js
 *
 * Environment Variables:
 *   BASE_URL: API base URL (default: https://fyrk.no)
 *   SCENARIO: Test scenario - smoke|load|stress|spike (default: smoke)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const okrRequests = new Counter('okr_requests');
const okrErrors = new Rate('okr_errors');
const okrDuration = new Trend('okr_duration');
const rateLimited = new Counter('rate_limited');
const cacheHits = new Counter('cache_hits');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://fyrk.no';
const SCENARIO = __ENV.SCENARIO || 'smoke';

// Test scenarios
const scenarios = {
  // Quick validation - 1 VU, 10 iterations
  smoke: {
    executor: 'shared-iterations',
    vus: 1,
    iterations: 10,
    maxDuration: '2m',
  },

  // Sustained load - ramp up to 10 concurrent users
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 5 },   // Ramp up to 5 users
      { duration: '3m', target: 10 },  // Ramp up to 10 users
      { duration: '5m', target: 10 },  // Stay at 10 users
      { duration: '1m', target: 0 },   // Ramp down
    ],
    gracefulRampDown: '30s',
  },

  // Stress test - find breaking point
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 10 },  // Ramp to normal load
      { duration: '5m', target: 20 },  // Ramp to stress level
      { duration: '5m', target: 30 },  // Push further
      { duration: '5m', target: 40 },  // Breaking point?
      { duration: '2m', target: 0 },   // Recovery
    ],
    gracefulRampDown: '1m',
  },

  // Spike test - sudden traffic surge
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 5 },   // Normal load
      { duration: '10s', target: 50 },  // Sudden spike!
      { duration: '1m', target: 50 },   // Stay at spike
      { duration: '10s', target: 5 },   // Drop back
      { duration: '1m', target: 5 },    // Recovery
      { duration: '30s', target: 0 },   // Ramp down
    ],
  },
};

// Export options based on scenario
export const options = {
  scenarios: {
    [SCENARIO]: scenarios[SCENARIO] || scenarios.smoke,
  },
  thresholds: {
    // Response time thresholds
    http_req_duration: ['p(95)<10000', 'p(99)<15000'], // 95% under 10s, 99% under 15s
    okr_duration: ['p(95)<12000'],                     // OKR-specific threshold

    // Error rate thresholds
    http_req_failed: ['rate<0.1'],  // Less than 10% failures
    okr_errors: ['rate<0.1'],        // Less than 10% OKR errors

    // Rate limiting should be minimal under normal load
    rate_limited: ['count<10'],
  },
  // Don't fail on thresholds during smoke tests
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Sample OKRs for testing
const sampleOKRs = [
  `Objective: Øke kundetilfredsheten
KR1: Øke NPS fra 45 til 60
KR2: Redusere responstid på support fra 4 timer til 1 time
KR3: Øke andel positive anmeldelser fra 70% til 85%`,

  `Objective: Bli markedsleder i Norden
KR1: Øke markedsandel fra 15% til 25%
KR2: Lansere i 2 nye land
KR3: Øke årlig omsetning fra 50M til 80M NOK`,

  `Objective: Bygge en verdensklasse ingeniørkultur
KR1: Redusere tid til produksjon fra 2 uker til 2 dager
KR2: Øke kodedekning fra 60% til 85%
KR3: Ansette 5 senior-ingeniører`,

  `Objective: Forbedre produktkvalitet
KR1: Redusere kritiske bugs fra 10 til 2 per måned
KR2: Øke oppetid fra 99.5% til 99.9%
KR3: Implementere automatisert testing for 80% av kodebasen`,

  `Objective: Styrke bærekraft i organisasjonen
KR1: Redusere CO2-utslipp fra 100 til 50 tonn
KR2: Oppnå ISO 14001-sertifisering
KR3: 90% av leverandører skal møte våre bærekraftskrav`,
];

// Get a random OKR with some variation
function getRandomOKR() {
  const baseOKR = sampleOKRs[Math.floor(Math.random() * sampleOKRs.length)];
  // Add minor variation to avoid cache hits for stress testing
  const variation = Math.random() > 0.5 ? `\n\n[Test ID: ${Date.now()}-${Math.random().toString(36).substring(7)}]` : '';
  return baseOKR + variation;
}

// Test non-streaming endpoint
function testNonStreaming() {
  const okrInput = getRandomOKR();

  const response = http.post(
    `${BASE_URL}/api/okr-sjekken`,
    JSON.stringify({
      input: okrInput,
      stream: false,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '30s',
    }
  );

  okrRequests.add(1);
  okrDuration.add(response.timings.duration);

  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has output': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.output && body.output.length > 0;
      } catch {
        return false;
      }
    },
    'response time < 15s': (r) => r.timings.duration < 15000,
  });

  // Track specific outcomes
  if (response.status === 429) {
    rateLimited.add(1);
  }

  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.cached) {
        cacheHits.add(1);
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (!success) {
    okrErrors.add(1);
    console.log(`Error: ${response.status} - ${response.body}`);
  } else {
    okrErrors.add(0);
  }

  return response;
}

// Test streaming endpoint
function testStreaming() {
  const okrInput = getRandomOKR();

  const response = http.post(
    `${BASE_URL}/api/okr-sjekken`,
    JSON.stringify({
      input: okrInput,
      stream: true,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      timeout: '30s',
    }
  );

  okrRequests.add(1);
  okrDuration.add(response.timings.duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'content-type is SSE': (r) => r.headers['Content-Type']?.includes('text/event-stream'),
    'has streaming data': (r) => r.body && r.body.includes('data:'),
  });

  if (response.status === 429) {
    rateLimited.add(1);
  }

  if (!success) {
    okrErrors.add(1);
  } else {
    okrErrors.add(0);
  }

  return response;
}

// Test validation (should return 400)
function testValidation() {
  const response = http.post(
    `${BASE_URL}/api/okr-sjekken`,
    JSON.stringify({
      input: '', // Empty input should fail
      stream: false,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(response, {
    'empty input returns 400': (r) => r.status === 400,
    'has error message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.error && body.error.length > 0;
      } catch {
        return false;
      }
    },
  });

  return response;
}

// Main test function
export default function () {
  group('OKR API Tests', function () {
    // 70% non-streaming, 20% streaming, 10% validation
    const rand = Math.random();

    if (rand < 0.7) {
      group('Non-streaming request', function () {
        testNonStreaming();
      });
    } else if (rand < 0.9) {
      group('Streaming request', function () {
        testStreaming();
      });
    } else {
      group('Validation test', function () {
        testValidation();
      });
    }
  });

  // Think time between requests (1-3 seconds)
  sleep(1 + Math.random() * 2);
}

// Lifecycle hooks
export function setup() {
  console.log(`Starting ${SCENARIO} test against ${BASE_URL}`);
  console.log(`Scenario config:`, JSON.stringify(scenarios[SCENARIO], null, 2));

  // Verify endpoint is reachable
  const healthCheck = http.get(`${BASE_URL}/`);
  if (healthCheck.status !== 200) {
    console.error(`Warning: Base URL returned status ${healthCheck.status}`);
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(1)} seconds`);
}

// Custom summary
export function handleSummary(data) {
  const summary = {
    scenario: SCENARIO,
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: data.metrics.okr_requests?.values?.count || 0,
      errorRate: data.metrics.okr_errors?.values?.rate || 0,
      rateLimited: data.metrics.rate_limited?.values?.count || 0,
      cacheHits: data.metrics.cache_hits?.values?.count || 0,
      avgDuration: data.metrics.okr_duration?.values?.avg || 0,
      p95Duration: data.metrics.okr_duration?.values?.['p(95)'] || 0,
      p99Duration: data.metrics.okr_duration?.values?.['p(99)'] || 0,
    },
    thresholds: data.thresholds,
  };

  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    'load-tests/results/summary.json': JSON.stringify(summary, null, 2),
    'load-tests/results/full-report.json': JSON.stringify(data, null, 2),
  };
}

// Helper for text summary
function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};

  const green = enableColors ? '\x1b[32m' : '';
  const red = enableColors ? '\x1b[31m' : '';
  const reset = enableColors ? '\x1b[0m' : '';

  let output = `\n${indent}${green}=== OKR API Load Test Summary ===${reset}\n\n`;

  output += `${indent}Scenario: ${SCENARIO}\n`;
  output += `${indent}Target: ${BASE_URL}\n\n`;

  output += `${indent}Requests:\n`;
  output += `${indent}  Total: ${data.metrics.okr_requests?.values?.count || 0}\n`;
  output += `${indent}  Error Rate: ${((data.metrics.okr_errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  output += `${indent}  Rate Limited: ${data.metrics.rate_limited?.values?.count || 0}\n`;
  output += `${indent}  Cache Hits: ${data.metrics.cache_hits?.values?.count || 0}\n\n`;

  output += `${indent}Response Times:\n`;
  output += `${indent}  Average: ${(data.metrics.okr_duration?.values?.avg || 0).toFixed(0)}ms\n`;
  output += `${indent}  p95: ${(data.metrics.okr_duration?.values?.['p(95)'] || 0).toFixed(0)}ms\n`;
  output += `${indent}  p99: ${(data.metrics.okr_duration?.values?.['p(99)'] || 0).toFixed(0)}ms\n\n`;

  // Threshold results
  output += `${indent}Thresholds:\n`;
  for (const [name, result] of Object.entries(data.thresholds || {})) {
    const status = result.ok ? `${green}PASS${reset}` : `${red}FAIL${reset}`;
    output += `${indent}  ${name}: ${status}\n`;
  }

  return output;
}
