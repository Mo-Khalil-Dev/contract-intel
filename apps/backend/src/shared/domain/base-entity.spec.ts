import { BaseEntity } from './base-entity';

class TestEntity extends BaseEntity<string> {
  constructor(id: string) {
    super(id);
  }
}

describe('BaseEntity<T>', () => {
  describe('constructor', () => {
    it('should create an entity with an id', () => {
      const id = 'entity-1';
      const entity = new TestEntity(id);

      expect(entity.id).toBe(id);
    });
  });

  describe('id getter', () => {
    it('should return the id', () => {
      const id = 'test-id-123';
      const entity = new TestEntity(id);

      expect(entity.id).toBe(id);
    });

    it('should return the same id across multiple calls', () => {
      const id = 'immutable-id';
      const entity = new TestEntity(id);

      expect(entity.id).toBe(entity.id);
    });
  });

  describe('equals()', () => {
    it('should return true when comparing entities with same id', () => {
      const id = 'same-id';
      const entity1 = new TestEntity(id);
      const entity2 = new TestEntity(id);

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should return false when comparing entities with different ids', () => {
      const entity1 = new TestEntity('id-1');
      const entity2 = new TestEntity('id-2');

      expect(entity1.equals(entity2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const entity = new TestEntity('id-1');

      expect(entity.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const entity = new TestEntity('id-1');

      expect(entity.equals(undefined as any)).toBe(false);
    });

    it('should follow identity equality principle', () => {
      const entity = new TestEntity('same-id');

      expect(entity.equals(entity)).toBe(true);
    });

    it('should be symmetric (a.equals(b) === b.equals(a))', () => {
      const entity1 = new TestEntity('id');
      const entity2 = new TestEntity('id');

      expect(entity1.equals(entity2)).toBe(entity2.equals(entity1));
    });

    it('should be transitive (a.equals(b) && b.equals(c) => a.equals(c))', () => {
      const entity1 = new TestEntity('id');
      const entity2 = new TestEntity('id');
      const entity3 = new TestEntity('id');

      expect(entity1.equals(entity2)).toBe(true);
      expect(entity2.equals(entity3)).toBe(true);
      expect(entity1.equals(entity3)).toBe(true);
    });
  });

  describe('with different id types', () => {
    class NumericEntity extends BaseEntity<number> {
      constructor(id: number) {
        super(id);
      }
    }

    it('should work with numeric ids', () => {
      const entity1 = new NumericEntity(1);
      const entity2 = new NumericEntity(1);

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should distinguish between different numeric ids', () => {
      const entity1 = new NumericEntity(1);
      const entity2 = new NumericEntity(2);

      expect(entity1.equals(entity2)).toBe(false);
    });
  });
});
