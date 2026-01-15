# Load Testing

This directory contains load tests for the Fyrk website, specifically targeting the AI-powered API endpoints.

> **Note:** The same testing patterns apply to all AI tools (OKR-sjekken, Konseptspeilet, Antakelseskart) since they all use the Claude API with similar latency characteristics.

## Prerequisites

Install k6 (load testing tool):

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (with Chocolatey)
choco install k6

# Docker
docker pull grafana/k6
```

## Available Test Scenarios

### 1. Smoke Test (Default)
Quick validation that the API is working correctly.
- 1 virtual user
- 10 iterations
- ~2 minutes

```bash
npm run test:load
# or
k6 run load-tests/okr-api.js
```

### 2. Load Test
Sustained load to verify normal operation under expected traffic.
- Ramps up to 10 concurrent users
- Maintains load for 5 minutes
- ~10 minutes total

```bash
npm run test:load:sustained
# or
k6 run --env SCENARIO=load load-tests/okr-api.js
```

### 3. Stress Test
Find the breaking point of the API.
- Ramps up to 40 concurrent users
- Progressive increase
- ~19 minutes

```bash
npm run test:load:stress
# or
k6 run --env SCENARIO=stress load-tests/okr-api.js
```

### 4. Spike Test
Test behavior under sudden traffic spikes.
- Sudden jump from 5 to 50 users
- Tests recovery
- ~4 minutes

```bash
npm run test:load:spike
# or
k6 run --env SCENARIO=spike load-tests/okr-api.js
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Target API URL | `https://fyrk.no` |
| `SCENARIO` | Test scenario | `smoke` |

### Testing Against Local Server

```bash
# Start local server first
npm run preview

# Run tests against localhost
k6 run --env BASE_URL=http://localhost:4321 load-tests/okr-api.js
```

## Test Coverage

The load tests cover:

1. **Non-streaming requests** (70% of traffic)
   - Standard POST to `/api/okr-sjekken`
   - Validates response structure
   - Measures response time

2. **Streaming requests** (20% of traffic)
   - SSE streaming endpoint
   - Validates content-type header
   - Checks for streaming data

3. **Validation** (10% of traffic)
   - Empty input handling
   - Error response format

## Thresholds

The tests enforce these thresholds:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_duration p95` | < 10s | 95% of requests under 10 seconds |
| `http_req_duration p99` | < 15s | 99% of requests under 15 seconds |
| `http_req_failed` | < 10% | Less than 10% failure rate |
| `rate_limited` | < 10 | Minimal rate limiting under normal load |

## Results

Test results are saved to:
- `load-tests/results/summary.json` - Key metrics summary
- `load-tests/results/full-report.json` - Complete test report

## Interpreting Results

### Key Metrics

- **okr_requests**: Total number of OKR API calls
- **okr_errors**: Error rate for OKR calls
- **okr_duration**: Response time for OKR calls
- **rate_limited**: Number of 429 responses
- **cache_hits**: Number of cached responses

### Performance Guidelines

| Response Time | Rating |
|---------------|--------|
| < 5s | Excellent |
| 5-10s | Good (Claude API latency) |
| 10-15s | Acceptable |
| > 15s | Poor |

Note: All AI endpoints call the Anthropic Claude API, which has inherent latency of 3-10 seconds per request. This is expected behavior for OKR-sjekken, Konseptspeilet, and Antakelseskart.

## CI/CD Integration

For automated load testing in CI:

```yaml
- name: Run load tests
  run: |
    # Install k6
    sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update && sudo apt-get install k6

    # Run smoke test
    k6 run --env SCENARIO=smoke load-tests/okr-api.js
```

## Troubleshooting

### High Error Rate
- Check if the Anthropic API key is configured
- Verify the target URL is correct
- Check for rate limiting (429 responses)

### Slow Response Times
- Expected: Claude API calls take 3-10 seconds
- Check network latency to the target
- Verify caching is working (cache_hits metric)

### Rate Limiting
- The API has per-IP rate limiting
- Expected during stress/spike tests
- If occurring during smoke tests, check configuration
