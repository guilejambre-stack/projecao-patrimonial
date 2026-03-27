# CRM Enhancements — Design Spec

**Date:** 2026-03-27
**Context:** Meeting transcript — improve CRM visibility, tab UX, Salesforce-inspired interactions

## 1. Client Detail Tabs — Spacing Fix

**Problem:** Tab labels (Dados Pessoais, Perfil Financeiro, etc.) are too close together and font is too large.

**Solution:**
- Reduce tab trigger font from `text-sm` to `text-xs`
- Add explicit gap between tab triggers (`gap-1`)
- Add padding to triggers (`px-3 py-1.5`)
- The 5 tabs remain: Dados Pessoais, Perfil Financeiro, Projeção Patrimonial, Metas, Interações (CRM)
- Rename "Interações" tab to "CRM" for clarity

## 2. Clients List — Pipeline Filter + CRM Columns

**Problem:** No pipeline status filter, no CRM visibility on the list.

**Solution:**
- Add pipeline status filter buttons (Todos, Prospecto, Consulta, Proposta, Ativo, Inativo)
- Add columns: Pipeline Status (badge), Última Interação (date)
- Query `interactions` to get last interaction per client
- Filter via search params (`?status=active&q=search`)

## 3. Interactions Tab — Salesforce-Inspired Redesign

**Problem:** Current interactions tab is functional but doesn't feel like a CRM. Needs to be clearer and more intuitive.

**Inspiration:** Salesforce Activity Timeline + HubSpot activity feed

**Solution:**
- **Quick Action Bar** at top: 4 buttons (Reunião, Ligação, Email, Anotação) — one-click to open form pre-filled with type
- **Activity Feed** (replaces timeline + table dual view): single unified feed
  - Each card shows: icon, type badge, date, summary, outcome, next steps
  - Follow-up indicator with overdue highlighting
  - Expand/collapse for details
  - Delete action on hover
- **Quick Note** inline form: always visible at top for fast note-taking (like Salesforce "Log a Call")
- **Filters**: filter by interaction type (all, meetings, calls, emails, notes)
- Remove the separate table view — the feed IS the view

## 4. Dashboard — Pipeline Overview

**Problem:** Dashboard doesn't show pipeline/CRM overview.

**Solution:**
- Add a **Pipeline Summary** card after KPIs
- Horizontal bar or segmented display showing count per stage: Prospecto → Consulta → Proposta → Ativo → Inativo
- Clickable — filters client list by that status

## Architecture

All changes are frontend-only. No schema changes needed — existing `interactions` and `clients.pipeline_status` tables support everything.

**Files to modify:**
- `src/app/dashboard/clients/[id]/page.tsx` — tab styling
- `src/components/clients/interactions-tab.tsx` — full redesign
- `src/app/dashboard/clients/page.tsx` — add filters + columns
- `src/app/dashboard/clients/actions.ts` — update getClients to include last interaction
- `src/app/dashboard/page.tsx` — add pipeline overview
