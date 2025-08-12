import express from 'express';
import crypto from 'node:crypto';
import { Octokit } from '@octokit/rest';

const app = express();
app.use(express.json({ type: '*/*' }));

const PORT = process.env.PORT || 8787;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.ORCHESTRATOR_GITHUB_TOKEN || '';

const octo = new Octokit({ auth: GITHUB_TOKEN });

function verifySignature(payload: string, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

app.post('/webhook', async (req, res) => {
  const sig = req.get('x-hub-signature-256');
  const raw = JSON.stringify(req.body);
  if (!verifySignature(raw, sig)) return res.status(401).send('Invalid signature');

  const event = req.get('x-github-event');
  try {
    if (event === 'issues') {
      await handleIssue(req.body);
    } else if (event === 'pull_request') {
      await handlePullRequest(req.body);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error', err);
    res.sendStatus(500);
  }
});

async function handleIssue(payload: any) {
  const action = payload.action;
  const issue = payload.issue;
  const repo = payload.repository;
  if (!issue || !repo) return;

  // Auto-assign labels-based routing comment and add to project if P0 milestone
  const owner = repo.owner.login;
  const name = repo.name;

  if (action === 'opened') {
    const labels = issue.labels.map((l: any) => (typeof l === 'string' ? l : l.name));
    const suggested = suggestAgent(labels);
    await octo.issues.createComment({
      owner,
      repo: name,
      issue_number: issue.number,
      body: `AI Orchestrator: routing to ${suggested} agent based on labels: ${labels.join(', ')}.\n\n- [ ] Confirm owner\n- [ ] Add due date\n- [ ] Break into subtasks if needed`,
    });
  }
}

function suggestAgent(labels: string[]): string {
  if (labels.includes('backend') || labels.includes('analytics')) return 'Backend';
  if (labels.includes('frontend') || labels.includes('a11y')) return 'Frontend';
  if (labels.includes('ai')) return 'AI';
  if (labels.includes('qa')) return 'QA';
  return 'Lead';
}

async function handlePullRequest(payload: any) {
  const action = payload.action;
  const pr = payload.pull_request;
  const repo = payload.repository;
  if (!pr || !repo) return;
  const owner = repo.owner.login;
  const name = repo.name;

  if (action === 'opened' || action === 'edited' || action === 'synchronize') {
    const titleOk = /^[a-z]+\([^)]+\):\s.+/.test(pr.title || '');
    if (!titleOk) {
      await octo.issues.createComment({
        owner,
        repo: name,
        issue_number: pr.number,
        body: 'Please use a conventional commit PR title, e.g., `feat(scope): summary`.',
      });
    }
  }
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Orchestrator listening on ${PORT}`);
});
