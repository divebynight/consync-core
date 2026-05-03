const assert = require("node:assert");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const TEST_NAME = "unit-standalone-notes-grouping";

async function loadModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "notes-panel.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const { groupStandaloneNotesByIdea } = await loadModule();

  console.log(`[${TEST_NAME}] Running`);

  // 1. empty array
  {
    const result = groupStandaloneNotesByIdea([]);
    assert.deepStrictEqual(result.groups, {});
    assert.deepStrictEqual(result.other, []);
    console.log("  PASS: empty array");
  }

  // 2. null / non-array input
  {
    const result = groupStandaloneNotesByIdea(null);
    assert.deepStrictEqual(result.groups, {});
    assert.deepStrictEqual(result.other, []);
    console.log("  PASS: null input treated as empty");
  }

  // 3. all notes without idea (undefined, null, empty, whitespace)
  {
    const notes = [
      { id: "a", note: "note a" },
      { id: "b", note: "note b", idea: null },
      { id: "c", note: "note c", idea: "" },
      { id: "d", note: "note d", idea: "   " },
    ];
    const result = groupStandaloneNotesByIdea(notes);
    assert.deepStrictEqual(result.groups, {});
    assert.deepStrictEqual(result.other, notes);
    console.log("  PASS: all notes without valid idea go to other");
  }

  // 4. all notes with distinct ideas — groups sorted alphabetically
  {
    const noteZ = { id: "z", note: "note z", idea: "Zebra" };
    const noteA = { id: "a", note: "note a", idea: "apple" };
    const noteM = { id: "m", note: "note m", idea: "Mango" };
    const notes = [noteZ, noteA, noteM];
    const result = groupStandaloneNotesByIdea(notes);
    assert.deepStrictEqual(Object.keys(result.groups), ["apple", "Mango", "Zebra"]);
    assert.deepStrictEqual(result.groups["apple"], [noteA]);
    assert.deepStrictEqual(result.groups["Mango"], [noteM]);
    assert.deepStrictEqual(result.groups["Zebra"], [noteZ]);
    assert.deepStrictEqual(result.other, []);
    console.log("  PASS: all notes with ideas, groups sorted case-insensitive alphabetically");
  }

  // 5. mixed notes — some with ideas, some without
  {
    const noteWithIdea = { id: "1", note: "arranged", idea: "Song 3" };
    const noteWithoutIdea = { id: "2", note: "random thought" };
    const noteWithSameIdea = { id: "3", note: "bridge section", idea: "Song 3" };
    const notes = [noteWithIdea, noteWithoutIdea, noteWithSameIdea];
    const result = groupStandaloneNotesByIdea(notes);
    assert.deepStrictEqual(Object.keys(result.groups), ["Song 3"]);
    assert.deepStrictEqual(result.groups["Song 3"], [noteWithIdea, noteWithSameIdea]);
    assert.deepStrictEqual(result.other, [noteWithoutIdea]);
    console.log("  PASS: mixed notes — ideas grouped, no-idea goes to other");
  }

  // 6. multiple notes with same idea preserve insertion order within group
  {
    const n1 = { id: "1", note: "first", idea: "Chapter 1" };
    const n2 = { id: "2", note: "second", idea: "Chapter 1" };
    const n3 = { id: "3", note: "third", idea: "Chapter 1" };
    const result = groupStandaloneNotesByIdea([n1, n2, n3]);
    assert.deepStrictEqual(result.groups["Chapter 1"], [n1, n2, n3]);
    assert.deepStrictEqual(result.other, []);
    console.log("  PASS: multiple notes with same idea preserve insertion order");
  }

  // 7. whitespace-only idea treated as no idea
  {
    const note = { id: "1", note: "trimmed away", idea: "   " };
    const result = groupStandaloneNotesByIdea([note]);
    assert.deepStrictEqual(result.groups, {});
    assert.deepStrictEqual(result.other, [note]);
    console.log("  PASS: whitespace-only idea treated as no idea");
  }

  // 8. input array is not mutated
  {
    const notes = [
      { id: "1", note: "a", idea: "Alpha" },
      { id: "2", note: "b" },
    ];
    const original = notes.slice();
    groupStandaloneNotesByIdea(notes);
    assert.deepStrictEqual(notes, original);
    console.log("  PASS: input array not mutated");
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main().catch(error => {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
});
