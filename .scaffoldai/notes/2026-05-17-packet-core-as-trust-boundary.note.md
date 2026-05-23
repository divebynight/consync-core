# Packet Core as Trust Boundary

Date: 2026-05-17
Area: scaffoldai, process, architecture
Status: raw-note
Source: discussion

## Note

core sees packets  
planner sees goals  
expo sees sequence  
user sees progress

Packet lifecycle should remain the trust boundary. Higher-level planners or expo systems may organize work, but they should not bypass packet intake, activation, verification, or closeout.

## Why it matters

If packet processing stays strict and fail-closed, future orchestration layers can be more flexible without corrupting lifecycle state.

## Possible future use

Could become:
- architecture principle
- packet lifecycle contract
- planner/expo design constraint
- future SDC intake note