.PHONY: help status \
	verify verify-scaffold verify-consync verify-full \
	scaffold-status scaffold-intake scaffold-activate scaffold-start scaffold-close scaffold-cancel \
	scaffold-discuss scaffold-plan scaffold-work \
	scaffold-probe-e2e scaffold-probe-clean \
	scaffold-mcp-operator scaffold-mcp-readonly scaffold-mcp-operator-stdio scaffold-mcp-readonly-stdio

.DEFAULT_GOAL := help

help:
	@echo "Consync / ScaffoldAI operator surface"
	@echo ""
	@echo "Status:"
	@echo "  make status            Show branch and git status"
	@echo ""
	@echo "Verify:"
	@echo "  make verify            Run full default verification"
	@echo "  make verify-scaffold   Run ScaffoldAI verification"
	@echo "  make verify-consync    Run Consync verification"
	@echo "  make verify-full       Run full/heavy verification when available"
	@echo ""
	@echo "ScaffoldAI lifecycle:"
	@echo "  make scaffold-status    Show ScaffoldAI status"
	@echo "  make scaffold-intake    Intake latest valid inbox candidate"
	@echo "  make scaffold-activate  Activate latest accepted packet"
	@echo "  make scaffold-start     Intake + activate latest candidate"
	@echo "  make scaffold-close     Closeout + cleanup when safe"
	@echo "  make scaffold-cancel    Cancel stale/mistaken active work without marking PASS"
	@echo ""
	@echo "ScaffoldAI runners:"
	@echo "  make scaffold-plan      Read-only planning/analysis mode (no file writes)"
	@echo "  make scaffold-discuss   Alias for scaffold-plan (backward compat)"
	@echo "  make scaffold-work      Execute approved next-action (bounded write access)"
	@echo ""
	@echo "ScaffoldAI probe:"
	@echo "  make scaffold-probe-e2e   Run deterministic lifecycle probe (isolated fixture)"
	@echo "  make scaffold-probe-clean Remove any leftover probe fixtures from .scaffoldai/tmp/"
	@echo ""
	@echo "ScaffoldAI MCP servers:"
	@echo "  make scaffold-mcp-operator        Start operator HTTP MCP server (port 3133)"
	@echo "  make scaffold-mcp-readonly        Start readonly HTTP MCP server (port 3000)"
	@echo "  make scaffold-mcp-operator-stdio  Start operator stdio MCP server"
	@echo "  make scaffold-mcp-readonly-stdio  Start readonly stdio MCP server"

status:
	@echo "[status] current branch"
	@git branch --show-current 2>/dev/null || true
	@echo ""
	@echo "[status] git status --short"
	@git status --short

verify:
	@npm run verify

verify-scaffold:
	@npm run verify:scaffoldai

verify-consync:
	@if node -e "process.exit(require('./package.json').scripts?.['verify:consync'] ? 0 : 1)"; then \
		npm run verify:consync; \
	else \
		echo "[verify-consync] npm run verify:consync not found"; \
		exit 1; \
	fi

verify-full:
	@if node -e "process.exit(require('./package.json').scripts?.['verify:full'] ? 0 : 1)"; then \
		npm run verify:full; \
	else \
		echo "[verify-full] npm run verify:full not found; falling back to npm run verify"; \
		npm run verify; \
	fi

scaffold-status:
	@npm run scaffoldai:status

scaffold-intake:
	@npm run scaffoldai:intake-latest

scaffold-activate:
	@npm run scaffoldai:activate-latest

scaffold-start:
	@npm run scaffoldai:start-latest

scaffold-close:
	@npm run scaffoldai:close-feature

scaffold-discuss:
	@npm run scaffoldai:discuss

scaffold-plan:
	@npm run scaffoldai:plan

scaffold-work:
	@npm run scaffoldai:work

scaffold-cancel:
	@npm run scaffoldai:cancel-packet

scaffold-probe-e2e:
	@npm run scaffoldai:probe

scaffold-probe-clean:
	@node -e "const fs=require('fs'),path=require('path'),t=path.join('.scaffoldai','tmp');if(fs.existsSync(t)){fs.readdirSync(t).filter(n=>n.startsWith('lifecycle-probe-')).forEach(n=>{fs.rmSync(path.join(t,n),{recursive:true,force:true});console.log('removed: '+n);});console.log('[probe-clean] done');}else{console.log('[probe-clean] nothing to clean');}"

scaffold-mcp-operator:
	@npm run scaffoldai:mcp:operator:http

scaffold-mcp-readonly:
	@npm run scaffoldai:mcp:readonly:http

scaffold-mcp-operator-stdio:
	@npm run scaffoldai:mcp:operator:stdio

scaffold-mcp-readonly-stdio:
	@npm run scaffoldai:mcp:readonly:stdio