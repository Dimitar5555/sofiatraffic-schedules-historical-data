import fs from 'fs';
import { build_commit_history } from './utils.js';

const commits_file = 'data/commits.json';
if(!fs.existsSync(commits_file)) {
    fs.writeFileSync(commits_file, '[]', 'utf-8');
}
const old_commits = JSON.parse(fs.readFileSync(commits_file));
if(old_commits.length === 0) {
    console.log('No existing commits, building full history...');
    const all_commits = await build_commit_history();
    fs.writeFileSync(commits_file, JSON.stringify(all_commits, null, 2), 'utf-8');
}
else {
    const new_commits = await build_commit_history(0, old_commits[0][1]);
    const final_commits = new_commits.concat(old_commits);
    fs.writeFileSync(commits_file, JSON.stringify(final_commits, null, 2), 'utf-8');
}