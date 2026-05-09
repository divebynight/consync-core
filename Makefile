.PHONY: help \
	scaffoldai-status scaffoldai-docs-check scaffoldai-drift-check scaffoldai-link-audit scaffoldai-leak-check scaffoldai-test \
	consync-test consync-e2e \
	repo-status repo-test repo-full-audit verify-full \
	status verify-scaffoldai verify-consync docs-check drift-check leak-check kick-tires

.DEFAULT_GOAL := help

help:
	@echo "ScaffoldAI / Consync deterministic check surface"
	@echo ""
	@echo "ScaffoldAI:"
	@echo "  make scaffoldai-status       Print branch and git status for process work"
	@echo "  make scaffoldai-docs-check   Check expected ScaffoldAI docs exist"
	@echo "  make scaffoldai-drift-check  Scan ScaffoldAI docs for drift warnings"
	@echo "  make scaffoldai-link-audit   Audit ScaffoldAI doc links and command references"
	@echo "  make scaffoldai-leak-check   Print manual Leak Check prompts"
	@echo "  make scaffoldai-test         Run ScaffoldAI status, docs, link audit, drift, verify, leak prompts"
	@echo ""
	@echo "Consync:"
	@echo "  make consync-test            Run npm run verify:consync (fast product/runtime checks, no e2e)"
	@echo "  make consync-e2e             Run npm run verify:consync:e2e (Electron/Playwright)"
	@echo ""
	@echo "Repo-level:"
	@echo "  make repo-status             Print current branch and git status"
	@echo "  make repo-test               Run ScaffoldAI test bundle and Consync fast checks"
	@echo "  make repo-full-audit         Run repo-test plus full verify; Playwright may bind 127.0.0.1"
	@echo "  make verify-full             Run npm run verify:full, or closest fallback"
	@echo ""
	@echo "Legacy aliases:"
	@echo "  make status                  Alias for repo-status"
	@echo "  make docs-check              Alias for scaffoldai-docs-check"
	@echo "  make drift-check             Alias for scaffoldai-drift-check"
	@echo "  make leak-check              Alias for scaffoldai-leak-check"
	@echo "  make kick-tires              Alias for scaffoldai-test"
	@echo "  make verify-scaffoldai       Alias for scaffoldai-test"
	@echo "  make verify-consync          Alias for consync-test"

repo-status:
	@echo "[repo-status] current branch"
	@git branch --show-current 2>/dev/null || true
	@echo ""
	@echo "[repo-status] git status --short"
	@git status --short

scaffoldai-status:
	@echo "[scaffoldai-status] repo status for ScaffoldAI process work"
	@$(MAKE) repo-status

scaffoldai-docs-check:
	@node scripts/check-scaffoldai-docs.js docs

scaffoldai-drift-check:
	@node scripts/check-scaffoldai-docs.js drift

scaffoldai-link-audit:
	@node scripts/check-scaffoldai-links-and-commands.js

scaffoldai-leak-check:
	@echo "[scaffoldai-leak-check] Manual prompts only. No answers are inferred."
	@echo ""
	@echo "Core Leak Check Questions:"
	@echo "- Are terms drifting?"
	@echo "- Are docs contradicting each other?"
	@echo "- Are file locations still meaningful?"
	@echo "- Are manual-only boundaries still true?"
	@echo "- Are examples implying behavior the contracts forbid?"
	@echo "- Are tests covering the thing we now believe is important?"
	@echo "- Are we quietly depending on a temporary workaround?"
	@echo "- Are we learning something from usage that invalidates an assumption?"
	@echo ""
	@echo "UNASKED QUESTIONS:"
	@echo "- What question should the human have asked but did not?"
	@echo "- What assumption did this task rely on?"
	@echo "- What seam could widen later?"
	@echo "- What temporary thing is at risk of becoming permanent?"
	@echo "- What feels obviously fine but has not actually been pressure-tested?"
	@echo "- What dependency or behavior are we trusting implicitly?"
	@echo ""
	@echo "Source: .scaffoldai/process/leak-check.process.md"

scaffoldai-test:
	@echo "[scaffoldai-test] ScaffoldAI process/harness checks"
	@$(MAKE) scaffoldai-status
	@$(MAKE) scaffoldai-docs-check
	@$(MAKE) scaffoldai-link-audit
	@$(MAKE) scaffoldai-drift-check
	@echo "[scaffoldai-test] npm run verify:scaffoldai"
	@npm run verify:scaffoldai
	@$(MAKE) scaffoldai-leak-check

consync-test:
	@if node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts['verify:consync'] ? 0 : 1)"; then \
		echo "[consync-test] npm run verify:consync"; \
		echo "[consync-test] fast product/runtime checks; Electron/Playwright e2e is not included"; \
		npm run verify:consync; \
	else \
		echo "[consync-test] npm run verify:consync not found; using closest equivalent: npm run verify"; \
		npm run verify; \
	fi

consync-e2e:
	@if node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts['verify:consync:e2e'] ? 0 : 1)"; then \
		echo "[consync-e2e] npm run verify:consync:e2e"; \
		echo "[consync-e2e] Electron/Playwright surface; may require local server permission on 127.0.0.1"; \
		npm run verify:consync:e2e; \
	elif node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts['verify:full'] ? 0 : 1)"; then \
		echo "[consync-e2e] npm run verify:consync:e2e not found; using repo-level npm run verify:full"; \
		npm run verify:full; \
	else \
		echo "[consync-e2e] no existing e2e verification command found"; \
		exit 1; \
	fi

repo-test:
	@echo "[repo-test] ScaffoldAI checks plus Consync fast checks"
	@$(MAKE) scaffoldai-test
	@$(MAKE) consync-test

verify-full:
	@if node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts['verify:full'] ? 0 : 1)"; then \
		echo "[verify-full] npm run verify:full"; \
		echo "[verify-full] heavy full path; Playwright/Electron may bind 127.0.0.1"; \
		npm run verify:full; \
	else \
		echo "[verify-full] npm run verify:full not found; using closest equivalent: npm run verify"; \
		npm run verify; \
	fi

repo-full-audit:
	@echo "[repo-full-audit] Heavy full audit: repo-test plus verify-full"
	@echo "[repo-full-audit] Playwright/Electron may require local server permission on 127.0.0.1"
	@$(MAKE) repo-test
	@$(MAKE) verify-full

status:
	@echo "[status] legacy alias -> make repo-status"
	@$(MAKE) repo-status

verify-scaffoldai:
	@echo "[verify-scaffoldai] legacy alias -> make scaffoldai-test"
	@$(MAKE) scaffoldai-test

verify-consync:
	@echo "[verify-consync] legacy alias -> make consync-test"
	@$(MAKE) consync-test

docs-check:
	@echo "[docs-check] legacy alias -> make scaffoldai-docs-check"
	@$(MAKE) scaffoldai-docs-check

drift-check:
	@echo "[drift-check] legacy alias -> make scaffoldai-drift-check"
	@$(MAKE) scaffoldai-drift-check

leak-check:
	@echo "[leak-check] legacy alias -> make scaffoldai-leak-check"
	@$(MAKE) scaffoldai-leak-check

kick-tires:
	@echo "[kick-tires] legacy alias -> make scaffoldai-test"
	@$(MAKE) scaffoldai-test
