import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateRound,
  pickDifferentIndex,
  scoreRound,
  shuffle,
} from '../src/lib/quiz.js';

const sequenceRng = (...values) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
};

const makeRecallBank = () => ({
  rewordings: Array.from({ length: 10 }, (_, index) => ({
    qId: index + 1,
    text: `Question ${index + 1}`,
  })),
  fakes: Array.from({ length: 8 }, (_, index) => `Decoy ${index + 1}`),
});

test('shuffle performs a deterministic Fisher-Yates permutation without mutation', () => {
  const source = Object.freeze([1, 2, 3, 4]);
  const result = shuffle(source, sequenceRng(0, 0, 0));

  assert.deepEqual(result, [2, 3, 4, 1]);
  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.notStrictEqual(result, source);
});

test('generateRound creates the required structure without mutating its inputs', () => {
  const recallBank = makeRecallBank();
  const original = structuredClone(recallBank);
  const requiredIds = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  const round = generateRound(recallBank, requiredIds, () => 0);
  const realItems = round.filter((item) => item.isReal);
  const decoys = round.filter((item) => !item.isReal);

  assert.equal(round.length, 15);
  assert.equal(new Set(round.map((item) => item.id)).size, 15);
  assert.deepEqual(
    realItems.map((item) => item.qId).sort((a, b) => a - b),
    requiredIds,
  );
  assert.equal(decoys.length, 5);
  assert.equal(new Set(decoys.map((item) => item.text)).size, 5);
  assert.deepEqual(recallBank, original);
  assert.deepEqual(requiredIds, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('generateRound rejects missing real pools and insufficient unique decoys', () => {
  const missingReal = makeRecallBank();
  missingReal.rewordings = missingReal.rewordings.filter(({ qId }) => qId !== 4);
  assert.throws(
    () => generateRound(missingReal, [1, 2, 3, 4], () => 0),
    /question ID 4/,
  );

  const tooFewDecoys = makeRecallBank();
  tooFewDecoys.fakes = ['one', 'two', 'two', 'three', 'four'];
  assert.throws(
    () => generateRound(tooFewDecoys, [1], () => 0),
    /At least 5 unique/,
  );
});

test('scoreRound marks exactly the real items as perfect', () => {
  const round = generateRound(makeRecallBank(), undefined, () => 0);
  const realIds = round.filter((item) => item.isReal).map((item) => item.id);

  assert.deepEqual(scoreRound(round, realIds), {
    correctReal: 10,
    missedReal: 0,
    falsePositives: 0,
    isPerfect: true,
  });
});

test('scoreRound does not mark selecting all 15 items as perfect', () => {
  const round = generateRound(makeRecallBank(), undefined, () => 0);

  assert.deepEqual(
    scoreRound(round, round.map((item) => item.id)),
    {
      correctReal: 10,
      missedReal: 0,
      falsePositives: 5,
      isPerfect: false,
    },
  );
});

test('pickDifferentIndex never returns the current index when alternatives exist', () => {
  for (let current = 0; current < 5; current += 1) {
    for (const random of [0, 0.24, 0.5, 0.999999]) {
      const picked = pickDifferentIndex(current, 5, () => random);
      assert.notEqual(picked, current);
      assert.ok(picked >= 0 && picked < 5);
    }
  }

  assert.equal(pickDifferentIndex(0, 1, () => 0), 0);
});
