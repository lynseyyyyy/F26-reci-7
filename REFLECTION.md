# Reflection

**Name / Andrew ID: Lynsey Li / xiaomol**

**Recitation group members (Task 2): LETZ**

---

### 1. Valid but weak

One property I wrote that was valid but relatively weak was checking whether matchGuess always returns exactly five colors. This is a valid property because Wordle has five letters, so the function should always return five colors no matter what the guess or secret is. However, this property doesn't actually check if the colors are correct, which is why it doesn't catch many mutants. For example, if there was a bug where the function accidentally returned six colors instead of five, this property would be able to catch it even though it wouldn't detect mistakes in how the colors are assigned.

### 2. A generator problem, not a property problem

One mutant I struggled with was touchingNotMerged, which was initially flaky and only killed in 1 out of 5 runs. The problem was that my original generator created random intervals, so it was very unlikely to generate two intervals that shared exactly the same endpoint. The property itself was correct, but the inputs weren't specifically targeting this situation.

To fix this, I added a targeted generator that creates two intervals [start, middle] and [middle, end], which guarantees that they share an endpoint. After this change, the mutant was consistently killed in all runs.

Before:

~ touchingNotMerged flaky: killed in 1/5 runs
Counterexample: [[[2147483636,2147483637],[2147483636,2147483636]]]

After:

✔ touchingNotMerged killed by: merges intervals that share an endpoint
Counterexample: [0,0,0]
AssertionError: expected [ [ +0, +0 ], [ +0, +0 ] ]
to deeply equal [ [ +0, +0 ] ]

This helped me understand that even when a property is correct, the generator still needs to produce the right kind of inputs to actually catch the bug.

### 3. Reading a counterexample

For the mergesIntegerNeighbors mutant, the runner gave the following counterexample:

Counterexample: [[[1,1],[2,2]]]
AssertionError: expected [ [ 1, 2 ] ]
to deeply equal [ [ 1, 1 ], [ 2, 2 ] ]

According to the specification, intervals should only be merged when they overlap or share an endpoint. In this case, [1,1] and [2,2] don't overlap or touch, so they should remain as two separate intervals. However, the mutant incorrectly merged them because the endpoints are consecutive integers, which goes against the specification.

### 4. Your project

For our team's OpenCode project, I think the repository_overview feature that I worked on would benefit from property-based testing, since it needs to handle different repository structures and package metadata.

Invariant: When the root file listing is truncated, the repository overview should still be able to show valid package metadata.

Metamorphic: Adding an unrelated file to the repository shouldn't change the workspace packages that are detected.

For the generator, I would create different mock repository structures with root files, package.json files, and nested workspace folders. I would also vary the number of files to test situations where the root listing becomes too large. One problem with a naive generator is that it might create invalid folder structures or incorrect package metadata, which could cause the tests to fail for reasons unrelated to what I'm actually testing. So I would make sure the generator produces valid repository structures first, while still allowing variations in their size and organization.
