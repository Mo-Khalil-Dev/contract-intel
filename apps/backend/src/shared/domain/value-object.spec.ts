import { ValueObject } from './value-object';

interface EmailProps {
  value: string;
}

class Email extends ValueObject<EmailProps> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): Email {
    return new Email(value);
  }
}

interface AddressProps {
  street: string;
  city: string;
  zipCode: string;
}

class Address extends ValueObject<AddressProps> {
  constructor(street: string, city: string, zipCode: string) {
    super({ street, city, zipCode });
  }

  static create(street: string, city: string, zipCode: string): Address {
    return new Address(street, city, zipCode);
  }
}

describe('ValueObject<T>', () => {
  describe('constructor', () => {
    it('should freeze props to prevent mutation', () => {
      const email = Email.create('test@example.com');

      expect(() => {
        (email as unknown as { props: Record<string, string> }).props.value = 'changed@example.com';
      }).toThrow();
    });
  });

  describe('equals()', () => {
    it('should return true for value objects with same props', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for value objects with different props', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const email = Email.create('test@example.com');

      expect(email.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const email = Email.create('test@example.com');

      expect(email.equals(undefined as any)).toBe(false);
    });

    it('should return false when comparing with object missing props', () => {
      const email = Email.create('test@example.com');
      const other = { something: 'else' } as any;

      expect(email.equals(other)).toBe(false);
    });

    it('should follow value equality principle', () => {
      const email = Email.create('test@example.com');

      expect(email.equals(email)).toBe(true);
    });

    it('should be symmetric', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(email2.equals(email1));
    });

    it('should be transitive', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      const email3 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
      expect(email2.equals(email3)).toBe(true);
      expect(email1.equals(email3)).toBe(true);
    });
  });

  describe('with complex properties', () => {
    it('should handle objects with multiple properties', () => {
      const addr1 = Address.create('123 Main St', 'Springfield', '12345');
      const addr2 = Address.create('123 Main St', 'Springfield', '12345');
      const addr3 = Address.create('456 Oak Ave', 'Shelbyville', '54321');

      expect(addr1.equals(addr2)).toBe(true);
      expect(addr1.equals(addr3)).toBe(false);
    });

    it('should be immutable - partial property changes should not equal', () => {
      const addr1 = Address.create('123 Main St', 'Springfield', '12345');
      const addr2 = Address.create('123 Main St', 'Shelbyville', '12345');

      expect(addr1.equals(addr2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should prevent modification of props', () => {
      const email = Email.create('test@example.com');

      expect(() => {
        (email as unknown as { props: Record<string, string> }).props.value = 'hacked@example.com';
      }).toThrow();
    });

    it('should prevent adding new properties', () => {
      const email = Email.create('test@example.com');

      expect(() => {
        (email as unknown as { props: Record<string, string> }).props.newProp = 'value';
      }).toThrow();
    });
  });
});
