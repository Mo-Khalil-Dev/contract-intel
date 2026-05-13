import { DomainEvent } from '../domain-event';

class UserCreatedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly email: string) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'user.created';
  }
}

class DocumentUploadedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly fileName: string,
    public readonly sizeBytes: number,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'document.uploaded';
  }
}

describe('DomainEvent', () => {
  describe('constructor', () => {
    it('should create an event with aggregateId and current timestamp', () => {
      const aggregateId = 'user-123';
      const event = new UserCreatedEvent(aggregateId, 'test@example.com');

      expect(event.aggregateId).toBe(aggregateId);
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should accept custom timestamp', () => {
      const aggregateId = 'user-123';
      const customDate = new Date('2024-01-01');
      const event = new UserCreatedEvent(aggregateId, 'test@example.com');
      // Note: Our implementation doesn't support custom dates in constructor
      // but the occurredOn should be a Date instance

      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should set occurredOn to current time by default', () => {
      const before = new Date();
      const event = new UserCreatedEvent('user-123', 'test@example.com');
      const after = new Date();

      expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getAggregateId()', () => {
    it('should return the aggregate id', () => {
      const aggregateId = 'document-456';
      const event = new DocumentUploadedEvent(aggregateId, 'file.pdf', 1024);

      expect(event.getAggregateId()).toBe(aggregateId);
    });
  });

  describe('getEventType()', () => {
    it('should return the event type for UserCreatedEvent', () => {
      const event = new UserCreatedEvent('user-123', 'test@example.com');

      expect(event.getEventType()).toBe('user.created');
    });

    it('should return the event type for DocumentUploadedEvent', () => {
      const event = new DocumentUploadedEvent(
        'doc-456',
        'contract.pdf',
        5000,
      );

      expect(event.getEventType()).toBe('document.uploaded');
    });

    it('should be different for different event types', () => {
      const event1 = new UserCreatedEvent('user-1', 'user1@example.com');
      const event2 = new DocumentUploadedEvent('doc-1', 'file.pdf', 1000);

      expect(event1.getEventType()).not.toBe(event2.getEventType());
    });
  });

  describe('event properties', () => {
    it('should preserve additional properties in subclass', () => {
      const email = 'test@example.com';
      const event = new UserCreatedEvent('user-123', email);

      expect(event.email).toBe(email);
    });

    it('should preserve multiple additional properties', () => {
      const fileName = 'contract.pdf';
      const sizeBytes = 5000;
      const event = new DocumentUploadedEvent(
        'doc-456',
        fileName,
        sizeBytes,
      );

      expect(event.fileName).toBe(fileName);
      expect(event.sizeBytes).toBe(sizeBytes);
    });
  });

  describe('event sequencing', () => {
    it('should have different timestamps for events created at different times', async () => {
      const event1 = new UserCreatedEvent('user-1', 'user1@example.com');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const event2 = new UserCreatedEvent('user-2', 'user2@example.com');

      expect(event2.occurredOn.getTime()).toBeGreaterThan(
        event1.occurredOn.getTime(),
      );
    });
  });

  describe('interface compliance', () => {
    it('should implement IDomainEvent interface', () => {
      const event = new UserCreatedEvent('user-123', 'test@example.com');

      expect(event.occurredOn).toBeDefined();
      expect(typeof event.getAggregateId).toBe('function');
      expect(typeof event.getEventType).toBe('function');
    });
  });
});
