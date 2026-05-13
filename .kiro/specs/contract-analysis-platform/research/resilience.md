# External API Resilience

Uses **`cockatiel`** — TypeScript equivalent of .NET's Polly.

## Policy Per External API

| API | Retry | Circuit Breaker | Timeout |
|---|---|---|---|
| Claude API | 3 attempts, exponential backoff | Yes — open after 5 failures | 60s |
| Google Document AI | 3 attempts, exponential backoff | Yes — open after 5 failures | 30s |
| Auth0 token exchange | 2 attempts, fixed 1s delay | No | 10s |
| GCS upload/download | 3 attempts, exponential backoff | No | 30s |

## Implementation Pattern

```typescript
import { retry, ExponentialBackoff, circuitBreaker, ConsecutiveBreaker, timeout, TimeoutStrategy, wrap, handleAll } from 'cockatiel'

@Injectable()
export class ClaudeAdapter implements AIAnalysisService {
  private readonly policy = wrap(
    timeout(60_000, TimeoutStrategy.Cooperative),
    circuitBreaker(handleAll, { halfOpenAfter: 30_000, breaker: new ConsecutiveBreaker(5) }),
    retry(handleAll, { maxAttempts: 3, backoff: new ExponentialBackoff() }),
  )

  constructor(@Inject(LOGGER_SERVICE) private readonly logger: LoggerService) {
    this.policy.onBreakCircuit((reason) => this.logger.warn('Claude API circuit breaker opened', { reason }))
    this.policy.onResetCircuit(() => this.logger.info('Claude API circuit breaker reset'))
  }

  async analyzeDocument(text: string): Promise<ClauseAnalysisResult> {
    try {
      return await this.policy.execute(() => this.anthropic.messages.create({ ... }))
    } catch (err) {
      throw new ExternalServiceUnavailableException('Claude API')
    }
  }
}
```

## Circuit Breaker Behaviour

- When open: calls fail immediately → `ExternalServiceUnavailableException` → global filter returns `503`
- After `halfOpenAfter` ms: one test request allowed through
- Success → circuit closes. Failure → stays open.

## Processing Pipeline Resilience

```
Job fails (circuit open or retries exhausted)
  → Queue marks job as failed
  → Queue-level retry after backoff
  → Document status → 'failed' after all retries exhausted
  → User notified
```
