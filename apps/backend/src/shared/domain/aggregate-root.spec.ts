import { AggregateRoot } from '../aggregate-root';
import { DomainEvent } from '../domain-event';

class TestDomainEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly data: string) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'test.event';
  }
}

class TestAggregateRoot extends AggregateRoot<string> {
  constructor(id: string) {
    super(id);
  }

  raiseEvent(data: string): void {
    this.addDomainEvent(new TestDomainEvent(this.id, data));
  }
}

describe('AggregateRoot<T>', () => {
  describe('addDomainEvent()', () => {
    it('should add a domain event to the aggregate', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('test data');

      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TestDomainEvent);
    });

    it('should add multiple domain events', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');
      aggregate.raiseEvent('event 2');
      aggregate.raiseEvent('event 3');

      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(3);
    });

    it('should maintain event order', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('first');
      aggregate.raiseEvent('second');
      aggregate.raiseEvent('third');

      const events = aggregate.getDomainEvents();
      expect((events[0] as TestDomainEvent).data).toBe('first');
      expect((events[1] as TestDomainEvent).data).toBe('second');
      expect((events[2] as TestDomainEvent).data).toBe('third');
    });
  });

  describe('getDomainEvents()', () => {
    it('should return all domain events', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');
      aggregate.raiseEvent('event 2');

      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(2);
    });

    it('should return empty array if no events', () => {
      const aggregate = new TestAggregateRoot('agg-1');

      const events = aggregate.getDomainEvents();
      expect(events).toEqual([]);
    });

    it('should return copy of events (immutable reference)', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');

      const events1 = aggregate.getDomainEvents();
      const events2 = aggregate.getDomainEvents();

      expect(events1).toEqual(events2);
    });
  });

  describe('clearDomainEvents()', () => {
    it('should clear all domain events', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');
      aggregate.raiseEvent('event 2');

      expect(aggregate.getDomainEvents()).toHaveLength(2);

      aggregate.clearDomainEvents();

      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });

    it('should allow adding events after clearing', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');
      aggregate.clearDomainEvents();
      aggregate.raiseEvent('event 2');

      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as TestDomainEvent).data).toBe('event 2');
    });

    it('should do nothing if no events to clear', () => {
      const aggregate = new TestAggregateRoot('agg-1');

      expect(() => aggregate.clearDomainEvents()).not.toThrow();
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('pullDomainEvents()', () => {
    it('should return all events and clear them', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');
      aggregate.raiseEvent('event 2');

      const pulledEvents = aggregate.pullDomainEvents();

      expect(pulledEvents).toHaveLength(2);
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });

    it('should return events in order', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('first');
      aggregate.raiseEvent('second');

      const events = aggregate.pullDomainEvents();

      expect((events[0] as TestDomainEvent).data).toBe('first');
      expect((events[1] as TestDomainEvent).data).toBe('second');
    });

    it('should return empty array and not error if no events', () => {
      const aggregate = new TestAggregateRoot('agg-1');

      const events = aggregate.pullDomainEvents();

      expect(events).toEqual([]);
    });

    it('should allow adding new events after pull', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');
      aggregate.pullDomainEvents();
      aggregate.raiseEvent('event 2');

      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as TestDomainEvent).data).toBe('event 2');
    });

    it('should be idempotent - pulling again returns empty array', () => {
      const aggregate = new TestAggregateRoot('agg-1');
      aggregate.raiseEvent('event 1');

      aggregate.pullDomainEvents();
      const secondPull = aggregate.pullDomainEvents();

      expect(secondPull).toEqual([]);
    });
  });

  describe('event sourcing workflow', () => {
    it('should support typical event sourcing pattern', () => {
      const aggregate = new TestAggregateRoot('user-123');

      aggregate.raiseEvent('created');
      aggregate.raiseEvent('activated');
      aggregate.raiseEvent('updated');

      const events = aggregate.pullDomainEvents();

      expect(events).toHaveLength(3);
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });

    it('should support multiple aggregates with independent events', () => {
      const agg1 = new TestAggregateRoot('agg-1');
      const agg2 = new TestAggregateRoot('agg-2');

      agg1.raiseEvent('event from agg1');
      agg2.raiseEvent('event from agg2');
      agg2.raiseEvent('another from agg2');

      expect(agg1.getDomainEvents()).toHaveLength(1);
      expect(agg2.getDomainEvents()).toHaveLength(2);
    });
  });

  describe('inheritance from BaseEntity', () => {
    it('should maintain identity equality', () => {
      const agg1 = new TestAggregateRoot('same-id');
      const agg2 = new TestAggregateRoot('same-id');

      expect(agg1.equals(agg2)).toBe(true);
    });

    it('should distinguish different aggregates by id', () => {
      const agg1 = new TestAggregateRoot('id-1');
      const agg2 = new TestAggregateRoot('id-2');

      expect(agg1.equals(agg2)).toBe(false);
    });

    it('should combine aggregate identity with domain events', () => {
      const agg1 = new TestAggregateRoot('agg-1');
      const agg2 = new TestAggregateRoot('agg-1');

      agg1.raiseEvent('event 1');
      agg2.raiseEvent('event 2');

      expect(agg1.equals(agg2)).toBe(true);
      expect(agg1.getDomainEvents()).toHaveLength(1);
      expect(agg2.getDomainEvents()).toHaveLength(1);
    });
  });
});
