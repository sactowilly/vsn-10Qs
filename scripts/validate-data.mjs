import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(projectRoot, 'src', 'data');

const CUSTOMER_TYPES = new Set([
  'bakery',
  'food manufacturer',
  '3PL',
  'warehouse',
  'e-commerce shipper',
  'industrial manufacturer',
]);
const REQUIRED_QUESTION_IDS = Array.from({ length: 10 }, (_, index) => index + 1);

const fail = (message) => {
  throw new Error(message);
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const assertNonEmptyString = (value, location) => {
  assert(
    typeof value === 'string' && value.trim().length > 0,
    `${location} must be a non-empty string.`,
  );
};

const assertStringArray = (value, location, minimumLength = 1) => {
  assert(Array.isArray(value), `${location} must be an array.`);
  assert(
    value.length >= minimumLength,
    `${location} must contain at least ${minimumLength} item(s).`,
  );
  value.forEach((item, index) =>
    assertNonEmptyString(item, `${location}[${index}]`),
  );
};

const assertUnique = (values, location) => {
  assert(
    new Set(values).size === values.length,
    `${location} must contain unique values.`,
  );
};

const readJson = (fileName) => {
  const filePath = path.join(dataDirectory, fileName);
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`Unable to read ${fileName}: ${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON in ${fileName}: ${error.message}`);
  }
};

const validateQuestions = (questions) => {
  assert(Array.isArray(questions), 'questions.json must contain an array.');
  assert(
    questions.length === REQUIRED_QUESTION_IDS.length,
    `questions.json must contain exactly ${REQUIRED_QUESTION_IDS.length} questions.`,
  );

  const ids = questions.map(({ id }) => id);
  assertUnique(ids, 'Question IDs');
  assert(
    REQUIRED_QUESTION_IDS.every((id) => ids.includes(id)),
    `Question IDs must be ${REQUIRED_QUESTION_IDS.join(', ')}.`,
  );

  for (const [index, question] of questions.entries()) {
    const location = `questions.json[${index}]`;
    assert(isPlainObject(question), `${location} must be an object.`);
    assert(
      Number.isInteger(question.id),
      `${location}.id must be an integer.`,
    );

    for (const field of [
      'originalQuestion',
      'purpose',
      'casualVersion',
      'objectionHandle',
      'commonMistake',
      'managerCoachingNote',
    ]) {
      assertNonEmptyString(question[field], `${location}.${field}`);
    }

    assertStringArray(question.alternateAsks, `${location}.alternateAsks`, 1);
    assertStringArray(question.followUps, `${location}.followUps`, 1);

    if (question.conversationVersions !== undefined) {
      assert(
        isPlainObject(question.conversationVersions),
        `${location}.conversationVersions must be an object when present.`,
      );

      for (const [customerType, text] of Object.entries(
        question.conversationVersions,
      )) {
        assert(
          CUSTOMER_TYPES.has(customerType),
          `${location}.conversationVersions contains unsupported customer type "${customerType}".`,
        );
        assertNonEmptyString(
          text,
          `${location}.conversationVersions.${customerType}`,
        );
      }
    }
  }
};

const validateRecallBank = (recallBank) => {
  assert(isPlainObject(recallBank), 'recallBank.json must contain an object.');
  assert(
    Array.isArray(recallBank.rewordings),
    'recallBank.rewordings must be an array.',
  );

  const rewordingTexts = [];
  const countsByQuestion = new Map(
    REQUIRED_QUESTION_IDS.map((id) => [id, 0]),
  );
  recallBank.rewordings.forEach((rewording, index) => {
    const location = `recallBank.json.rewordings[${index}]`;
    assert(isPlainObject(rewording), `${location} must be an object.`);
    assert(
      countsByQuestion.has(rewording.qId),
      `${location}.qId must reference a canonical question.`,
    );
    assertNonEmptyString(rewording.text, `${location}.text`);
    countsByQuestion.set(
      rewording.qId,
      countsByQuestion.get(rewording.qId) + 1,
    );
    rewordingTexts.push(rewording.text);
  });
  assertUnique(rewordingTexts, 'Recall rewording text');

  for (const [qId, count] of countsByQuestion) {
    assert(count > 0, `Question ${qId} must have at least one recall rewording.`);
  }

  assertStringArray(recallBank.fakes, 'recallBank.json.fakes', 5);
  assertUnique(recallBank.fakes, 'Recall decoys');
};

const validateScenarios = (scenarios) => {
  assert(Array.isArray(scenarios), 'scenarios.json must contain an array.');
  assert(scenarios.length > 0, 'scenarios.json must not be empty.');
  assertUnique(
    scenarios.map(({ id }) => id),
    'Scenario IDs',
  );

  scenarios.forEach((scenario, index) => {
    const location = `scenarios.json[${index}]`;
    assert(isPlainObject(scenario), `${location} must be an object.`);
    assert(Number.isInteger(scenario.id), `${location}.id must be an integer.`);
    for (const field of [
      'setting',
      'customerLine',
      'bestResponse',
      'coaching',
      'trap',
    ]) {
      assertNonEmptyString(scenario[field], `${location}.${field}`);
    }
  });
};

const validateFlashcards = (flashcards, questions) => {
  assert(isPlainObject(flashcards), 'flashcards.json must contain an object.');
  assert(
    Array.isArray(flashcards.responseCards),
    'flashcards.responseCards must be an array.',
  );
  assert(
    flashcards.responseCards.length === REQUIRED_QUESTION_IDS.length,
    `flashcards.responseCards must contain exactly ${REQUIRED_QUESTION_IDS.length} cards.`,
  );

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  assertUnique(
    flashcards.responseCards.map(({ id }) => id),
    'Response-card IDs',
  );
  assertUnique(
    flashcards.responseCards.map(({ questionId }) => questionId),
    'Response-card question references',
  );

  flashcards.responseCards.forEach((card, index) => {
    const location = `flashcards.json.responseCards[${index}]`;
    assert(isPlainObject(card), `${location} must be an object.`);
    assert(Number.isInteger(card.id), `${location}.id must be an integer.`);
    assert(
      questionsById.has(card.questionId),
      `${location}.questionId must reference a canonical question.`,
    );
    for (const field of ['customerSays', 'questionLabel', 'coaching']) {
      assertNonEmptyString(card[field], `${location}.${field}`);
    }
    assert(
      card.questionLabel === questionsById.get(card.questionId).originalQuestion,
      `${location}.questionLabel must match question ${card.questionId}.originalQuestion.`,
    );
  });
};

try {
  const questions = readJson('questions.json');
  const scenarios = readJson('scenarios.json');
  const recallBank = readJson('recallBank.json');
  const flashcards = readJson('flashcards.json');

  validateQuestions(questions);
  validateScenarios(scenarios);
  validateRecallBank(recallBank);
  validateFlashcards(flashcards, questions);

  console.log(
    `Data validation passed: ${questions.length} questions, ` +
      `${scenarios.length} scenarios, ${recallBank.rewordings.length} rewordings, ` +
      `${recallBank.fakes.length} decoys, and ${flashcards.responseCards.length} response cards.`,
  );
} catch (error) {
  console.error(`Data validation failed: ${error.message}`);
  process.exitCode = 1;
}
