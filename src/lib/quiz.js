const DEFAULT_QUESTION_IDS = Object.freeze(
  Array.from({ length: 10 }, (_, index) => index + 1),
);

const randomValue = (rng) => {
  if (typeof rng !== 'function') {
    throw new TypeError('rng must be a function.');
  }

  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('rng must return a finite number from 0 (inclusive) to 1 (exclusive).');
  }

  return value;
};

const randomIndex = (length, rng) => Math.floor(randomValue(rng) * length);

export function shuffle(items, rng = Math.random) {
  if (!Array.isArray(items)) {
    throw new TypeError('shuffle items must be an array.');
  }

  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, rng);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function generateRound(
  recallBank,
  requiredQuestionIds = DEFAULT_QUESTION_IDS,
  rng = Math.random,
) {
  if (!recallBank || typeof recallBank !== 'object') {
    throw new TypeError('recallBank must be an object.');
  }
  if (!Array.isArray(recallBank.rewordings)) {
    throw new TypeError('recallBank.rewordings must be an array.');
  }
  if (!Array.isArray(recallBank.fakes)) {
    throw new TypeError('recallBank.fakes must be an array.');
  }
  if (!Array.isArray(requiredQuestionIds) || requiredQuestionIds.length === 0) {
    throw new TypeError('requiredQuestionIds must be a non-empty array.');
  }

  const questionIds = [...requiredQuestionIds];
  if (new Set(questionIds).size !== questionIds.length) {
    throw new Error('requiredQuestionIds must not contain duplicates.');
  }

  const realItems = questionIds.map((qId) => {
    const pool = recallBank.rewordings.filter(
      (rewording) =>
        rewording?.qId === qId &&
        typeof rewording.text === 'string' &&
        rewording.text.trim().length > 0,
    );

    if (pool.length === 0) {
      throw new Error(`No valid recall rewordings found for question ID ${String(qId)}.`);
    }

    const picked = pool[randomIndex(pool.length, rng)];
    return {
      id: `real-${String(qId)}`,
      text: picked.text,
      isReal: true,
      qId,
    };
  });

  const uniqueDecoys = [
    ...new Set(
      recallBank.fakes.filter(
        (text) => typeof text === 'string' && text.trim().length > 0,
      ),
    ),
  ];

  if (uniqueDecoys.length < 5) {
    throw new Error(
      `At least 5 unique, non-empty decoys are required; received ${uniqueDecoys.length}.`,
    );
  }

  const decoyItems = shuffle(uniqueDecoys, rng)
    .slice(0, 5)
    .map((text, index) => ({
      id: `fake-${index}`,
      text,
      isReal: false,
      qId: null,
    }));

  return shuffle([...realItems, ...decoyItems], rng);
}

export function scoreRound(items, checkedIds) {
  if (!Array.isArray(items)) {
    throw new TypeError('scoreRound items must be an array.');
  }
  if (checkedIds == null || typeof checkedIds[Symbol.iterator] !== 'function') {
    throw new TypeError('checkedIds must be an iterable of item IDs.');
  }

  const checked = new Set(checkedIds);
  const realItems = items.filter((item) => item?.isReal === true);
  const correctReal = realItems.filter((item) => checked.has(item.id)).length;
  const missedReal = realItems.length - correctReal;
  const falsePositives = items.filter(
    (item) => item?.isReal !== true && checked.has(item?.id),
  ).length;

  return {
    correctReal,
    missedReal,
    falsePositives,
    isPerfect:
      realItems.length > 0 &&
      missedReal === 0 &&
      falsePositives === 0,
  };
}

export function pickDifferentIndex(current, count, rng = Math.random) {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('count must be a positive integer.');
  }
  if (!Number.isInteger(current) || current < 0 || current >= count) {
    throw new RangeError('current must be an index within count.');
  }
  if (count === 1) {
    return current;
  }

  const offset = 1 + randomIndex(count - 1, rng);
  return (current + offset) % count;
}
