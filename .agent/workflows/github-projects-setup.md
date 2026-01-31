---
description: Set up and use GitHub Projects for automated Kanban board
---

# GitHub Projects Setup & Usage

This workflow guides you through setting up an automated Kanban board using GitHub Projects that updates based on your commits.

## Initial Setup

### 1. Create a New GitHub Project

1. Navigate to https://github.com/ZumiCoWorks/NE-DPM-V5
2. Click the **Projects** tab
3. Click **New project** (green button)
4. Choose **Board** template
5. Name it: "NE DPM V5 Development"
6. Click **Create project**

### 2. Configure Board Columns

Set up the following columns (drag to reorder if needed):

- **📋 Backlog** - New issues and planned features
- **🔄 In Progress** - Currently being worked on
- **👀 In Review** - Pull requests under review
- **✅ Done** - Completed work

### 3. Set Up Automation Rules

For each column, configure automation:

#### Backlog Column
- ✅ Auto-add: New issues
- ✅ Auto-add: Newly added items

#### In Progress Column
- ✅ Auto-move: When PR is created from issue
- ✅ Auto-move: When issue is assigned

#### In Review Column
- ✅ Auto-move: When PR is opened
- ✅ Auto-move: When PR is marked as ready for review

#### Done Column
- ✅ Auto-move: When PR is merged
- ✅ Auto-move: When issue is closed

## Creating Issues for Existing Work

### 4. Create Issues from Current Tasks

Based on your README.md, create issues for:

**High Priority (AFDA Pilot)**
- [ ] Complete manual testing guide (12 tests)
- [ ] Validate GPS calibration workflow
- [ ] Test QR code scanning on-site
- [ ] Verify offline PWA functionality
- [ ] Load test with expected user count
- [ ] Prepare rollback plan

**Post-Pilot Improvements**
- [ ] Fix Classic Editor floorplan display issue
- [ ] Create organizations table migration
- [ ] Implement organization management UI
- [ ] Add code splitting for bundle size optimization
- [ ] Optimize profile fetch query
- [ ] Add automated test suite

**Technical Debt**
- [ ] Replace TypeScript `as any` casts with proper types
- [ ] Extract DB changes into formal migration files
- [ ] Wire SponsorManagement to Supabase data

### 5. Add Labels to Issues

Create and apply labels for better organization:

- `priority: critical` (red)
- `priority: high` (orange)
- `priority: medium` (yellow)
- `priority: low` (green)
- `type: bug` (red)
- `type: feature` (blue)
- `type: enhancement` (purple)
- `type: documentation` (gray)
- `area: frontend` (cyan)
- `area: backend` (teal)
- `area: database` (brown)
- `pilot: afda` (pink)

## Using Commit Messages for Automation

### 6. Commit Message Conventions

Use these keywords in commit messages to auto-update the board:

**Close an issue:**
```bash
git commit -m "feat: add GPS calibration validation (closes #12)"
git commit -m "fix: resolve floorplan display bug (fixes #8)"
```

**Reference an issue (without closing):**
```bash
git commit -m "refactor: improve map editor performance (refs #15)"
git commit -m "docs: update README with new features (see #20)"
```

**Multiple issues:**
```bash
git commit -m "feat: complete AFDA pilot checklist (closes #12, closes #13, closes #14)"
```

### 7. Conventional Commit Format

Follow this format for better changelog generation:

```
<type>(<scope>): <description> (closes #<issue-number>)

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat(map-editor): add GPS calibration wizard (closes #12)"
git commit -m "fix(leaflet): resolve marker positioning bug (fixes #8)"
git commit -m "docs(readme): add GitHub Projects workflow (refs #25)"
```

## Pull Request Workflow

### 8. Create PRs from Issues

When starting work on an issue:

1. Create a branch from the issue:
   ```bash
   git checkout -b feature/12-gps-calibration-validation
   ```

2. Make your changes and commit with references:
   ```bash
   git commit -m "feat: add GPS calibration tests (refs #12)"
   ```

3. Push and create PR:
   ```bash
   git push origin feature/12-gps-calibration-validation
   ```

4. In the PR description, reference the issue:
   ```markdown
   Closes #12
   
   ## Changes
   - Added GPS calibration validation
   - Created manual test guide
   - Updated documentation
   ```

5. The issue will automatically move to "In Review" when PR is opened
6. The issue will automatically move to "Done" when PR is merged

## Viewing and Managing the Board

### 9. Board Views

Create custom views for different perspectives:

**Sprint View:**
- Filter: `milestone:current-sprint`
- Group by: Status

**Priority View:**
- Filter: `label:priority-high OR label:priority-critical`
- Sort by: Priority

**AFDA Pilot View:**
- Filter: `label:pilot-afda`
- Group by: Status

### 10. Regular Maintenance

**Weekly:**
- Review and triage new issues
- Update issue priorities
- Close stale issues
- Update milestone progress

**Before Each Commit:**
- Check which issue you're working on
- Include issue reference in commit message
- Verify issue moves to correct column

## Advanced Features

### 11. GitHub Actions Integration (Optional)

Create `.github/workflows/project-automation.yml` for advanced automation:

```yaml
name: Project Automation

on:
  issues:
    types: [opened, closed, assigned]
  pull_request:
    types: [opened, closed, ready_for_review]

jobs:
  update-project:
    runs-on: ubuntu-latest
    steps:
      - name: Update project board
        uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/orgs/ZumiCoWorks/projects/1
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 12. Milestones for Release Planning

Create milestones for major releases:

- **AFDA Pilot (Feb 2026)** - Pre-deployment tasks
- **v5.1 - Post-Pilot Fixes** - Bug fixes and improvements
- **v5.2 - Multi-tenant** - Organization management
- **v6.0 - AR Features** - AR advertisements

Assign issues to milestones to track progress toward releases.

## Quick Reference

**Issue Keywords:**
- `closes #123` - Closes issue when PR is merged
- `fixes #123` - Same as closes
- `resolves #123` - Same as closes
- `refs #123` - References without closing
- `see #123` - References without closing

**Branch Naming:**
- `feature/123-description` - New features
- `fix/123-description` - Bug fixes
- `docs/123-description` - Documentation
- `refactor/123-description` - Code refactoring

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

---

**Next Steps:**
1. Create your GitHub Project
2. Set up automation rules
3. Create issues from README tasks
4. Start using commit message conventions
5. Watch your board update automatically! 🎉
