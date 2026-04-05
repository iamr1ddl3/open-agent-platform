#!/bin/bash
# ============================================================
# Push OpenAgentPlatform to GitHub Private Repo
# ============================================================
# Run this script from inside the open-agent-platform/ folder
# Prerequisites: git, gh CLI (GitHub CLI) installed and authenticated
# ============================================================

set -e

echo "🚀 Setting up OpenAgentPlatform GitHub repo..."

# Step 1: Initialize git (if not already)
if [ ! -d ".git/objects" ]; then
    # If .git-ready exists (from Cowork session), use it
    if [ -d ".git-ready" ]; then
        rm -rf .git
        mv .git-ready .git
        echo "✅ Restored git repo from session"
    else
        git init
        git checkout -b main
        git add -A
        git commit -m "Initial commit: OpenAgentPlatform — open-source local-first AI agent desktop app

A full-featured Electron + TypeScript + React clone inspired by Accio Work.
Includes multi-provider LLM gateway (OpenAI, Anthropic, Google, Ollama),
40+ built-in tools, MCP protocol support, multi-agent teams, scheduling,
skills/plugin system, and channel integrations (Telegram, Discord, Slack).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
        echo "✅ Git initialized and committed"
    fi
fi

# Step 2: Create private GitHub repo
echo "📦 Creating private GitHub repo..."
gh repo create open-agent-platform --private --source=. --remote=origin --push

echo ""
echo "============================================"
echo "✅ Done! Your repo is live at:"
echo "   https://github.com/iamr1ddl3/open-agent-platform"
echo "============================================"
