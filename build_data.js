import fs from 'fs';
import { get_data } from './build.js';
import { start } from 'repl';

if(!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
//     fs.rmdirSync('./data', { recursive: true });
}

for(const type of ['bus', 'trolley', 'tram', 'metro']) {
    if(!fs.existsSync(`./data/${type}`)) {
        fs.mkdirSync(`./data/${type}`);
    }
}

const commits = JSON.parse(fs.readFileSync('commits.json')).toReversed();
try {
    var start_date = fs.readFileSync('data/last_run.txt', 'utf-8');
}
catch(e) {
    start_date = '2023-10-01';
}

let limit = 500;
let yesterday, today;

const routes_data = new Map();
for(const type of ['bus', 'trolley', 'tram', 'metro']) {
    const files = fs.readdirSync(`./data/${type}`);
    for(const file of files) {
        const route_ref = file.replace('.json', '');
        const data = JSON.parse(fs.readFileSync(`./data/${type}/${file}`, 'utf-8'));
        routes_data.set(`${type}/${route_ref}`, data);
    }
}

for(const [commit_date, commit] of commits) {
    if(commit_date <= start_date) {
        continue;
    }
    
    yesterday = new Date(commit_date);
    today = new Date(commit_date);
    yesterday.setDate(yesterday.getDate() - 1);
    console.log(today);
    const processed_routes = new Set();
    await get_data(routes_data, processed_routes, commit, today.toISOString().split('T')[0], yesterday.toISOString().split('T')[0]);

    for(const route_tag of routes_data.keys()) {
        if(!processed_routes.has(route_tag)) {
            const data = routes_data.get(route_tag);
            // This route was not processed, so we mark its open schedules as ended
            data.schedules.forEach(schedule => {
                if(!schedule.end_date) {
                    schedule.end_date = yesterday.toISOString().split('T')[0];
                }
            });

        }
    }

    limit--;
    if(limit === 0) {
        break;
    }
}
fs.writeFileSync('data/last_run.txt', new Date().toISOString().split('T')[0], 'utf-8');

routes_data.entries().forEach(([route_tag, data]) => {
    const [type, route_ref] = route_tag.split('/');
    const filename = `./data/${type}/${route_ref}.json`;
    if(!fs.existsSync(`./data/${type}`)) {
        fs.mkdirSync(`./data/${type}`);
    }
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
});