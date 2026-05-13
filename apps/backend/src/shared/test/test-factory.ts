export abstract class TestFactory<T> {
  abstract build(overrides?: Partial<T>): T;

  buildMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  buildList(overridesList: Partial<T>[]): T[] {
    return overridesList.map((overrides) => this.build(overrides));
  }
}
