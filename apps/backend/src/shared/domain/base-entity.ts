import { v4 as uuid } from 'uuid';

export abstract class BaseEntity<T> {
  protected readonly _id: T;

  protected constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  equals(other: BaseEntity<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this._id === other._id) {
      return true;
    }
    return false;
  }
}
