import fs from 'fs';
import { build_commit_history } from './utils.js';


const old_commits = JSON.parse(fs.readFileSync('commits.json'));
const new_commits = await build_commit_history(0, old_commits[0][1]);
const final_commits = new_commits.concat(old_commits);
fs.writeFileSync('commits.json', JSON.stringify(final_commits));