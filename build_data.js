import fs from 'fs';
import { get_data } from './build.js';

if(fs.existsSync('./data')) {
    fs.rmdirSync('./data', { recursive: true });
}
fs.mkdirSync('./data');

const ordered_commits = final_commits.toReversed();
let limit = 0;
for(const [date, commit] of ordered_commits) {
    const today = date;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    console.log(today);
    await get_data(commit, today, yesterday.toISOString().split('T')[0]);
    limit--;
    if(limit === 0) {
        break;
    }
}