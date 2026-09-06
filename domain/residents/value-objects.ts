/**
 * Resident value objects.
 *
 * Value objects are immutable domain concepts with no identity of their own.
 * They are defined by their attributes, not their ID.
 */

/**
 * Represents a CNIC (Computerized National Identity Card) number.
 * Format: XXXXX-XXXXXXX-X
 */
export class Cnic {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Cnic | null {
    const cleaned = raw.replace(/\s/g, '');
    const pattern = /^\d{5}-\d{7}-\d$/;
    if (!pattern.test(cleaned)) return null;
    return new Cnic(cleaned);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Cnic): boolean {
    return this.value === other.value;
  }
}

/**
 * Represents a Pakistani phone number.
 */
export class PhoneNumber {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): PhoneNumber | null {
    const cleaned = raw.replace(/[\s\-()]/g, '');
    const pattern = /^(\+92|0)[0-9]{10}$/;
    if (!pattern.test(cleaned)) return null;
    return new PhoneNumber(cleaned);
  }

  toString(): string {
    return this.value;
  }
}
