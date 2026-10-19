import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> =
  fc.tuple(fc.integer(), fc.nat({ max: 100 }))
    .map(([start, length]) => [start, start + length]);
const intervalList = fc.array(interval);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. Output intervals are sorted by start.
  it('returns intervals sorted by start', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);

        for (let i = 1; i < out.length; i++) {
          expect(out[i][0]).toBeGreaterThanOrEqual(out[i - 1][0]);
        }
      }),
    );
  });

    // Pattern: algebraic. Merging twice gives the same result as merging once.
  it('merging intervals is idempotent', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        const twice = mergeIntervals(once);

        expect(twice).toEqual(once);
      }),
    );
  });

  // Pattern: metamorphic. Reversing input order does not change the result.
  it('produces the same result regardless of input order', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const original = mergeIntervals(xs);
        const reversed = mergeIntervals([...xs].reverse());

        expect(reversed).toEqual(original);
      }),
    );
  });

    // Pattern: differential. Compare covered integer points with a reference model.
  it('preserves the set of covered integer points', () => {
    const smallInterval = fc
      .tuple(
        fc.integer({ min: -20, max: 20 }),
        fc.integer({ min: -20, max: 20 }),
      )
      .map(([a, b]): Interval => [Math.min(a, b), Math.max(a, b)]);

    const coveredPoints = (intervals: Interval[]): number[] => {
      const points = new Set<number>();

      for (const [start, end] of intervals) {
        for (let x = start; x <= end; x++) {
          points.add(x);
        }
      }

      return [...points].sort((a, b) => a - b);
    };

    fc.assert(
      fc.property(fc.array(smallInterval), xs => {
        const result = mergeIntervals(xs);

        expect(coveredPoints(result)).toEqual(coveredPoints(xs));
      }),
    );
  });

    // Pattern: conditional. Already sorted, non-overlapping intervals stay unchanged.
  it('preserves already sorted non-overlapping intervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const sorted = [...xs].sort((a, b) => a[0] - b[0]);

        const nonOverlapping = sorted.every(
          ([start], i) => i === 0 || sorted[i - 1][1] < start
        );

        fc.pre(nonOverlapping);

        expect(mergeIntervals(sorted)).toEqual(sorted);
      }),
    );
  });

    // Pattern: conditional. Adjacent integer intervals remain separate.
  it('does not merge adjacent non-overlapping intervals', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 1000 }), start => {
        const input: Interval[] = [
          [start, start + 1],
          [start + 2, start + 3],
        ];

        expect(mergeIntervals(input)).toEqual(input);
      }),
    );
  });
    // Pattern: invariant. The result array does not alias the input array.
  it('returns a new array instead of the input array', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const result = mergeIntervals(xs);

        expect(result).not.toBe(xs);
      }),
    );
  });
    // Pattern: conditional. Intervals sharing an endpoint are merged.
  it('merges intervals that share an endpoint', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.nat({ max: 100 }),
        fc.nat({ max: 100 }),
        (start, firstLength, secondLength) => {
          const middle = start + firstLength;
          const end = middle + secondLength;

          const input: Interval[] = [
            [start, middle],
            [middle, end],
          ];

          expect(mergeIntervals(input)).toEqual([[start, end]]);
        },
      ),
    );
  });
    // Pattern: invariant. Output intervals do not alias input intervals.
  it('does not reuse input interval references', () => {
    fc.assert(
      fc.property(interval, x => {
        const input: Interval[] = [x];
        const result = mergeIntervals(input);

        expect(result).toEqual(input);
        expect(result).not.toBe(input);
        expect(result[0]).not.toBe(input[0]);
      }),
    );
  });
});
