import fs from 'fs';
import { build_commit_history } from './utils.js';

const commits_file = 'data/commits.json';
const old_commits = JSON.parse(fs.readFileSync(commits_file));
const new_commits = await build_commit_history(0, old_commits[0][1]);
const final_commits = new_commits.concat(old_commits);
fs.writeFileSync(commits_file, JSON.stringify(final_commits, null, 2), 'utf-8');