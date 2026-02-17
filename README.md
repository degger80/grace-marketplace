# GRACE Framework — Claude Code Plugin

**GRACE** (Graph-RAG Anchored Code Engineering) is a methodology for AI-driven code generation with semantic markup, knowledge graphs, and contracts. Originally created by **Vladimir Ivanov** ([@turboplanner](https://t.me/turboplanner)).

GRACE provides structured scaffolding that helps LLMs generate, navigate, and maintain code with high reliability. Every module gets a contract before code exists, every code block gets semantic markers for RAG navigation, and a knowledge graph keeps the entire project map current.

This plugin packages Vladimir's methodology as a reusable Claude Code marketplace plugin so any project can adopt GRACE.

## Installation

### Via Claude Code Plugin Marketplace

```bash
# Add the marketplace
/plugin marketplace add osovv/grace-marketplace

# Install the plugin
/plugin install grace@grace-marketplace
```

### Via npx skills (Vercel Skills CLI)

```bash
# Install GRACE skill to Claude Code
npx skills add osovv/grace-marketplace

# Or install globally (available across all projects)
npx skills add osovv/grace-marketplace -g

# Install to a specific agent
npx skills add osovv/grace-marketplace -a claude-code
```

> Browse more skills at [skills.sh](https://skills.sh)

## Quick Start

```bash
# Initialize GRACE structure in your project
/grace:init

# Define requirements, then plan the architecture
/grace:plan

# Generate code for a specific module
/grace:generate <module-name>

# Or execute the entire development plan
/grace:execute
```

## Commands

| Command | Description |
|---------|-------------|
| `/grace:init` | Bootstrap GRACE structure (docs/, CLAUDE.md, XML templates) |
| `/grace:plan` | Architectural planning: requirements → modules → contracts |
| `/grace:add <description>` | Add a new module with contract and knowledge graph entry |
| `/grace:generate <module>` | Generate code for a module with full GRACE markup |
| `/grace:execute` | Execute the full development plan with subagent orchestration |
| `/grace:fix <error>` | Debug using semantic navigation (knowledge graph → block) |
| `/grace:refresh` | Sync knowledge graph with actual codebase |
| `/grace:status` | Project health report |

## Skills

- **semantic-markup** — START/END block conventions, ~500 token granularity, unique block names
- **knowledge-graph** — How to maintain `docs/knowledge-graph.xml`
- **contract-driven-dev** — MODULE_CONTRACT, function contracts, governed autonomy (PCAM)
- **unique-tag-convention** — Unique ID-based XML tags that eliminate closing-tag polysemy

## Agents

- **grace-architect** (Opus) — Top-down architectural planning, module decomposition, knowledge graph design
- **grace-reviewer** (Sonnet) — Validates semantic markup integrity, contract completeness, graph consistency

## Origin

GRACE was designed and battle-tested by Vladimir Ivanov ([@turboplanner](https://t.me/turboplanner)). See the [TurboProject](https://t.me/turboproject) Telegram channel for more on the methodology. This plugin extracts GRACE into a standalone, project-agnostic format.

## License

MIT
