
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1 and problem set Task 1.
// Property-based tests for Wordle matchGuess.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Generate random five-letter uppercase words.
const word = fc
  .array(fc.constantFrom(...ALPHABET), {
    minLength: 5,
    maxLength: 5,
  })
  .map(letters => letters.join(''));

describe('matchGuess', () => {
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);

        expect(result).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Feedback only contains G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);

        for (const color of result) {
          expect(['G', 'Y', 'B']).toContain(color);
        }
      }),
    );
  });

  // Pattern: algebraic. Guessing the secret gives five greens.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, secret => {
        const result = matchGuess(secret, secret);

        expect(Array.from(result)).toEqual([
          'G', 'G', 'G', 'G', 'G',
        ]);
      }),
    );
  });

  // Pattern: invariant. A letter cannot receive more
  // green or yellow credits than its frequency in the secret.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);

        for (const letter of ALPHABET) {
          const available = [...secret]
            .filter(c => c === letter).length;

          const credited = [...guess]
            .filter((c, i) =>
              c === letter &&
              (result[i] === 'G' || result[i] === 'Y')
            ).length;

          expect(credited).toBeLessThanOrEqual(available);
        }
      }),
    );
  });
  
  // Pattern: conditional. Swapped distinct letters receive yellow feedback.
  it('marks misplaced matching letters yellow', () => {
    const distinctLetters = fc.shuffledSubarray(
      [...'ABCDEFGHIJKLMNOPQRSTUVWXY'],
      { minLength: 2, maxLength: 2 },
    );

    fc.assert(
      fc.property(distinctLetters, ([a, b]) => {
        const secret = a + b + 'ZZZ';
        const guess = b + a + 'ZZZ';

        expect(matchGuess(secret, guess)).toEqual([
          'Y', 'Y', 'G', 'G', 'G',
        ]);
      }),
    );
  });

    // Pattern: conditional. Exact matches take priority over misplaced matches.
  it('prioritizes green matches when letters repeat', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALPHABET),
        fc.constantFrom(...ALPHABET),
        (a, b) => {
          fc.pre(a !== b);

          const secret = a + b + 'ZZZ';
          const guess = b + b + 'ZZZ';

          const result = matchGuess(secret, guess);

          expect(result).toEqual(['B', 'G', 'G', 'G', 'G']);
        },
      ),
    );
  });

  // Pattern: metamorphic. Consistently renaming letters preserves feedback.
  it('preserves feedback when letters are renamed', () => {
    const shift = (text: string) =>
      [...text].map(c =>
        String.fromCharCode(
          65 + (c.charCodeAt(0) - 65 + 1) % 26
        )
      ).join('');

    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const original = matchGuess(secret, guess);
        const renamed = matchGuess(shift(secret), shift(guess));

        expect(renamed).toEqual(original);
      }),
    );
  });
});
