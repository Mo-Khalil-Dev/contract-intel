import { TestFactory } from './test-factory';

interface SampleEntity {
  id: string;
  name: string;
  age: number;
  active: boolean;
}

class SampleFactory extends TestFactory<SampleEntity> {
  private counter = 0;

  build(overrides?: Partial<SampleEntity>): SampleEntity {
    this.counter += 1;
    return {
      id: `entity-${this.counter}`,
      name: 'Default Name',
      age: 30,
      active: true,
      ...overrides,
    };
  }
}

describe('TestFactory', () => {
  let factory: SampleFactory;

  beforeEach(() => {
    factory = new SampleFactory();
  });

  describe('build', () => {
    it('produces an entity with default values', () => {
      const entity = factory.build();

      expect(entity).toEqual({
        id: 'entity-1',
        name: 'Default Name',
        age: 30,
        active: true,
      });
    });

    it('applies overrides on top of defaults', () => {
      const entity = factory.build({ name: 'Custom Name', age: 99 });

      expect(entity.name).toBe('Custom Name');
      expect(entity.age).toBe(99);
      expect(entity.active).toBe(true);
    });

    it('produces unique entities on successive calls', () => {
      const first = factory.build();
      const second = factory.build();

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('buildMany', () => {
    it('produces the requested number of entities', () => {
      const entities = factory.buildMany(5);

      expect(entities).toHaveLength(5);
    });

    it('applies the same overrides to each entity', () => {
      const entities = factory.buildMany(3, { name: 'Bulk Name' });

      entities.forEach((entity) => {
        expect(entity.name).toBe('Bulk Name');
      });
    });

    it('produces entities with unique ids', () => {
      const entities = factory.buildMany(3);
      const ids = entities.map((e) => e.id);

      expect(new Set(ids).size).toBe(3);
    });

    it('returns empty array for count 0', () => {
      expect(factory.buildMany(0)).toEqual([]);
    });
  });

  describe('buildList', () => {
    it('produces entities matching the override list', () => {
      const entities = factory.buildList([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 40 },
      ]);

      expect(entities).toHaveLength(2);
      expect(entities[0].name).toBe('Alice');
      expect(entities[0].age).toBe(25);
      expect(entities[1].name).toBe('Bob');
      expect(entities[1].age).toBe(40);
    });

    it('preserves defaults for fields not overridden', () => {
      const entities = factory.buildList([{ name: 'Alice' }]);

      expect(entities[0].active).toBe(true);
      expect(entities[0].age).toBe(30);
    });

    it('returns empty array for empty list', () => {
      expect(factory.buildList([])).toEqual([]);
    });
  });
});
