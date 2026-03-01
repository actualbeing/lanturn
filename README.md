# Lanturn Weekly

Real news. Real actions. No noise.

## Setup — Cloudflare Pages

### 1. Push this repo to GitHub

```bash
# Fresh start (or reset existing repo)
cd lanturn
rm -rf .git
git init
git add .
git commit -m "Lanturn Weekly v2 — clean start"
git remote add origin git@github.com:actualbeing/lanturn.git
git branch -M main
git push -u origin main --force
```

### 2. Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Select **Pages** → **Connect to Git**
3. Authorize GitHub and select the `lanturn` repository
4. Configure build settings:
   - **Framework preset:** Hugo
   - **Build command:** `hugo --minify`
   - **Build output directory:** `public`
   - **Environment variable:** `HUGO_VERSION` = `0.146.6`
5. Click **Save and Deploy**

### 3. Custom domain

After first deploy:
1. Go to your Pages project → **Custom domains**
2. Add `lanturnweekly.com`
3. Cloudflare will provide DNS records to add
4. If domain is already on Cloudflare DNS, it auto-configures

### 4. Remove old Hostinger deploy

Once Cloudflare Pages is confirmed working:
- Delete the `.github/workflows/deploy.yaml` (no longer needed)
- Remove Hostinger FTP secrets from GitHub repo settings
- Optionally cancel Hostinger hosting

## Weekly Workflow

Requires: [Claude Code](https://docs.claude.com/en/docs/claude-code/overview), Node.js 18+, and `ANTHROPIC_API_KEY` in your environment.

```bash
# 1. Search for this week's news (uses Anthropic API + web search)
./lanturn research

# 2. Open editorial/candidates.md and mark your picks with [x]

# 3. Draft articles from your picks (uses Claude Code)
./lanturn draft

# 4. Review the drafts (optional — opens Claude Code interactively)
./lanturn review

# 5. Publish (commits and pushes → Cloudflare auto-deploys)
./lanturn publish
```

## How It Works

- `./lanturn research` calls the Anthropic API with web search enabled, finds 8-12 candidate stories, and writes them to `editorial/candidates.md` with checkboxes
- `./lanturn draft` reads your selections, then uses Claude Code (`claude -p`) to write the digest and glow posts directly into `content/posts/`
- `./lanturn review` opens Claude Code interactively so you can ask for edits
- `./lanturn publish` commits everything and pushes — Cloudflare Pages auto-deploys

Editorial guidelines live in `CLAUDE.md`, which Claude Code reads automatically.

## Local Preview

```bash
hugo server -D    # -D includes drafts
```

## Content Format

See `CLAUDE.md` for full editorial guidelines and frontmatter format.
