interface Iterable<T> {
  [Symbol.iterator](): Iterator<T>;
}

type QueryableType<T> = NumberQueryable | Queryable<T>;

interface Queryable<T> extends Iterable<T> {
  filter(predicate: (value: T, index: number) => boolean): QueryableType<T>;
  //map<U>(selector: (value: T, index: number) => U): QueryableType<U>;
  map<U>(selector: (value: T, index: number) => U): QueryableType<U>;
  join<U, R>(
    inner: Iterable<U>,
    predicate: (outer: T, inner: U) => boolean,
    selector: (outer: T, inner: U) => R
  ): QueryableType<R>;
  reduce(reducer: (accumulator: T, current: T, index: number) => T): T;
  reduce(
    initialValue: T,
    reducer: (accumulator: T, current: T, index: number) => T
  ): T;
  reduce<U>(
    initialValue: U,
    reducer: (accumulator: U, current: T, index: number) => U
  ): U;
  some(): boolean;
  empty(): boolean;
  first(): T | undefined;
  last(): T | undefined;
  toArray(): T[];
}

interface NumberQueryable extends Queryable<number> {
  sum(): number;
}

class QueryProvider<T> implements Queryable<T> {
  private readonly iterable: Iterable<T>;

  constructor(iterable: Iterable<T>) {
    this.iterable = iterable;

    this[Symbol.iterator].bind(this);
  }

  *[Symbol.iterator]() {
    yield* this.iterable;
  }

  filter = (
    predicate: (value: T, index: number) => boolean
  ): QueryableType<T> => {
    const self = this;
    let index = 0;

    const iterable = {
      *[Symbol.iterator]() {
        for (let current of self) {
          if (predicate(current, index++)) {
            yield current;
          }
        }
      }
    };

    return from(iterable);
  };

  map = <U>(selector: (value: T, index: number) => U): QueryableType<U> => {
    const self = this;
    let index = 0;

    const iterable = {
      *[Symbol.iterator]() {
        for (let current of self) {
          yield selector(current, index++);
        }
      }
    };

    return from(iterable);
  };

  join = <U, R>(
    inner: Iterable<U>,
    predicate: (outer: T, inner: U) => boolean,
    selector: (outer: T, inner: U) => R
  ): QueryableType<R> => {
    const self = this;

    const iterable = {
      *[Symbol.iterator]() {
        for (let outerValue of self) {
          for (let innerValue of inner) {
            if (predicate(outerValue, innerValue)) {
              yield selector(outerValue, innerValue);
            }
          }
        }
      }
    };

    return from<R>(iterable);
  };

  reduce = <U = T>(
    param1: ((accumulator: T, current: T, index: number) => T) | U,
    reducer?: (accumulator: U, current: T, index: number) => U
  ): U => {
    const iterable = this[Symbol.iterator]();
    let index = 0;
    let acc;
    let reducerFunc;

    if (typeof param1 === "function") {
      acc = iterable.next().value as T;
      reducerFunc = param1 as (accumulator: T, current: T, index: number) => T;
      index++;
    } else {
      acc = param1 as U;
      reducerFunc = reducer as (accumulator: U, current: T, index: number) => U;
    }

    if (!reducerFunc) {
      throw new Error("missing reducer function");
    }

    if (acc === undefined) {
      return acc as U;
    }

    for (let value of iterable) {
      acc = reducerFunc(acc as T & U, value, index++);
    }

    return acc as U;
  };

  some = (): boolean => this.first() !== undefined;

  empty = (): boolean => this.first() === undefined;

  first = (): T | undefined =>
    this[Symbol.iterator]().next().value || undefined;

  last = (): T | undefined => {
    const iterable = this[Symbol.iterator]();
    let current: IteratorResult<T, void>;
    let prev: IteratorResult<T, void> | undefined;

    do {
      current = iterable.next();
      if (!current.done) {
        prev = current;
      }
    } while (!current.done);

    // TODO ?. syntax
    return (prev && prev.value) || undefined;
  };

  toArray = (): T[] => [...this];
}

class NumberQueryProvider extends QueryProvider<number>
  implements NumberQueryable {
  sum = (): number => {
    const iterable = this[Symbol.iterator]();
    let total: number = 0;
    for (let value of iterable) {
      total += value;
    }
    return total;
  };
}

function isIterableNumber(iterable: any): iterable is Iterable<number> {
  if (iterable == null) {
    return false;
  }
  if (typeof iterable[Symbol.iterator] !== "function") {
    return false;
  }
  for (let value of iterable) {
    if (typeof value !== "number") {
      return false;
    }
  }
  return true;
}

export function from(iterable: Iterable<number>): NumberQueryable;
export function from<T>(iterable: Iterable<T>): Queryable<T>;
export function from<T>(iterable: Iterable<T>): QueryableType<T> {
  if (isIterableNumber(iterable)) {
    return new NumberQueryProvider(iterable);
  } else {
    return new QueryProvider(iterable);
  }
}

/*
function isType<T>(typeToCheck: any): typeToCheck is T {
  return !!((typeToCheck as T) as any).type;
}
*/
