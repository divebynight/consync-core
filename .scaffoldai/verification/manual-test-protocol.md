# Manual Test Protocol (SDC)

## Purpose
Establish a simple, repeatable loop for testing Consync on real folders.  
Build trust in system behavior and identify cases worth promoting to fixtures.

---

## 1. Test Setup

Use one of the following:

### A. Controlled Mess (recommended)
- 5–20 files
- Mixed types (image, audio, text, etc.)
- Flat or lightly nested
- Imperfect / inconsistent naming

### B. Early Creative Session
- Real session folder
- Minimal prior organization
- Represents actual workflow output

### Rules
- Do not modify or pre-clean the folder
- Do not rename files before testing
- Keep scope small and readable

---

## 2. Commands to Run

Run in order:

1. `node src/index.js sandbox-scan <path>`
2. `node src/index.js sandbox-describe <path>`
3. `node src/index.js sandbox-propose <path>`

Do not skip steps.  
Observe output at each stage.

---

## 3. Evaluation Rubric

Evaluate the `sandbox-propose` output:

### Obviousness
- Are suggestions immediately understandable?
- Do they match intuitive human grouping?

### Correctness
- Are files grouped logically?
- Any clearly wrong or misleading suggestions?

### Restraint
- Does the system avoid over-grouping?
- Does it stop when structure is already reasonable?

### Signal vs Noise
- Is output concise and useful?
- Any unnecessary or low-value suggestions?

---

## 4. Outcome Classification

Classify the result:

- PASS  
  → Useful, correct, and restrained

- WEAK PASS  
  → Mostly correct, minor noise or issues

- FAIL  
  → Misleading, overreaching, or incorrect

---

## 5. Promotion Rule (→ Fixture)

Promote a test when:

- Behavior is clearly correct and repeatable
- Folder reflects a common real-world pattern
- Output provides strong signal

Steps:
1. Copy folder → `sandbox/fixtures/<name>`
2. Add to `verify.js`
3. Confirm deterministic output

---

## 6. Loop

Repeat:

1. Select folder
2. Run commands
3. Evaluate
4. Classify
5. (Optional) Promote to fixture

Keep loops fast and focused.

---

## Constraints

- Do not modify existing commands
- Do not introduce automation
- Do not expand scope beyond manual testing

Focus:
- simplicity
- determinism
- real-world usefulness
