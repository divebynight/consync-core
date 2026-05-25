# SDC — Test Async Executor Plan Flow

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI async executor planning lifecycle validation

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Create a minimal validation packet for testing the async executor planning flow end-to-end through the operator HTTP MCP surface.

BACKGROUND:
The new async executor planning system is now implemented:
- scaffoldai_executor_plan_start
- scaffoldai_executor_plan_status
- scaffoldai_executor_plan_result
- scaffoldai_executor_plan_cleanup

We need a safe lightweight packet to validate:
- active packet detection
- async job creation
- polling behavior
- result artifact retrieval
- bounded refusal behavior
- Copilot planning invocation
- durable runtime artifact generation

TASKS:
1. Validate async planning lifecycle.

Expected validation flow:
- intake packet
- activate packet
- call scaffoldai_executor_plan_start
- poll scaffoldai_executor_plan_status
- retrieve scaffoldai_executor_plan_result

2. Verify artifact generation.

Expected runtime artifacts:
- request.json
- status.json
- stdout.md
- stderr.log
- result.json

3. Verify bounded planning behavior.

Confirm:
- no arbitrary prompt injection
- no arbitrary shell execution
- planning-only execution surface
- deterministic active packet resolution

4. Verify polling lifecycle.

Expected lifecycle states:
- queued
- running
- completed OR failed OR timed_out

5. Verify result retrieval behavior.

Confirm:
- result retrieval does not re-run Copilot
- status polling does not re-run Copilot
- artifacts persist after completion

VERIFY:
Run:
- async MCP planning flow manually through ChatGPT MCP integration

OUTPUT:
Return:
1. job_id
2. observed lifecycle states
3. artifact generation results
4. result retrieval behavior
5. timeout behavior if encountered
6. any architecture issues discovered

CONSTRAINTS:
- no arbitrary shell execution
- no arbitrary prompt execution
- no work-mode execution
- no lifecycle mutation outside normal intake/activate flow
- no .consync usage
- human-controlled commits only
