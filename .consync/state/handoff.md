TYPE: PROCESS
PACKAGE: define_agent_routing_policy

STATUS

PASS

SUMMARY

Added a small routing policy doc that explains when to run `consync-integrity-agent`, `consync-process-agent`, both agents, or neither.

The new guidance keeps agent use lightweight by focusing checks where they add value: integrity for behavior, tests, and drift risk; process for package-loop, state, stream, and doc alignment; both for larger or mixed-impact packages; neither for trivial low-risk edits. It also makes human override explicit so extra checks remain acceptable when confidence is low.

Added one light pointer from the system overview so the routing guidance is easy to find without rewriting the loop docs.

FILES CREATED

- `.consync/docs/agent-routing-policy.md` — defines a small manual routing policy for integrity agent, process agent, both agents, or neither.

FILES MODIFIED

- `.consync/docs/current-system.md` — adds a light pointer to the new agent-routing-policy doc.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Open `.consync/docs/agent-routing-policy.md` and confirm it clearly separates when to run integrity agent, process agent, both agents, and neither.
2. Confirm the guidance is short and practical rather than theoretical or mandatory.
3. Confirm the human-override section explicitly allows extra checks when more confidence is useful, including low-energy or high-fatigue cases.
4. Open `.consync/docs/current-system.md` and confirm it includes a pointer to the new routing-policy doc.
5. If the routing doc adds heavy framework, hard rules, or unnecessary complexity, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based.
- Confirmed the new doc distinguishes integrity-agent use, process-agent use, both-agent use, and cases where neither is usually needed.
- Confirmed the policy stays manual and judgment-based, with explicit human override rather than hard routing rules.
- Confirmed supporting changes remained light: one new doc and one pointer update, with no loop rewrite or agent-behavior changes.

NOTES

- Kept the policy lightweight by using a single small doc instead of spreading routing rules across multiple process docs.
- Avoided prescriptive thresholds so the guidance reduces ambiguity without turning into a framework.