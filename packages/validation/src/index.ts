export interface ValidationRule<T> {
  parse: (value: unknown) => T;
}

export function createPassthroughRule<T>(): ValidationRule<T> {
  return {
    parse(value: unknown) {
      return value as T;
    }
  };
}
