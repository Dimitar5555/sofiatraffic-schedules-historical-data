import dotenv from 'dotenv';
import { Octokit } from 'octokit';

dotenv.config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

async function fetch_from_github(url, options) {
    const req = await octokit.request(url, options);
    return req.data;
}

export function fetch_file(filename, commit=false, current_date=false) {
    let url = 'https://raw.githubusercontent.com/dimitar5555/sofiatraffic-schedules';
    if(commit) {
        if(current_date && current_date >= '2025-09-01') {
            url += `/${commit}/data`;
        }
        else {
            url += `/${commit}/docs/data`;
        }
        return fetch_remote_json(`${url}/${filename}`);
    }
    else {
        url += '/master/docs/data';
    }
    return fetch_remote_json(`${url}/${filename}`);
}

async function fetch_remote_json(url) {
    const request = await fetch(url);
    if(!request.ok) {
        console.error(request.headers);
    }
    return request.json();
}

export function get_date(offset=0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
}

export async function build_commit_history(limit=0, up_to_commit='c1cb5ae381e2480e5637e1340854c0effba50c82') {
    async function get_latest_commit() {
        const branches = await fetch_from_github('GET /repos/{owner}/{repo}/branches', {
            owner: 'dimitar5555',
            repo: 'sofiatraffic-schedules'
        });
        const master_branch = branches.find(branch => branch.name === 'master');
        return master_branch.commit.sha;
    }
    let current_commit = await get_latest_commit();
    const target_commit = up_to_commit;
    let commits = [];
    do {
        const commit = await fetch_from_github('GET /repos/{owner}/{repo}/commits/{ref}', {
            owner: 'dimitar5555',
            repo: 'sofiatraffic-schedules',
            ref: current_commit
        });

        current_commit = commit.parents[0].sha;
        console.log(current_commit, target_commit);
        if(commit.files.some(file => file.filename.includes('metadata.json'))) {
            const date = commit.commit.author.date.split('T')[0];
            console.log(date);
            if(commits.find(c => c[0] === date)) {
                continue;
            }
            commits.push([date, commit.sha]);
        }
        limit--;

        if(limit == 0) {
            break;
        }
    } while(current_commit !== target_commit)
    return commits;
}

export async function get_latest_data_commit() {
    const commits = await build_commit_history(1);
    console.log('Latest commit:', commits);
    return commits[0][1];
} 