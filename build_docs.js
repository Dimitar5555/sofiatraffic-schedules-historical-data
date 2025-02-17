import fs from 'fs';

const commits = JSON.parse(fs.readFileSync('commits.json'));

const routes_files = fs.readdirSync('./data')
.map(file => {
    const data = file.split('.')[0].split('_');
    const type = data[0];
    const route_ref = data[1];
    return {type, route_ref};
});

if(!fs.existsSync('./docs/data')) {
    fs.mkdirSync('./docs/data');
}

fs.writeFileSync('./docs/data/commits.json', JSON.stringify(commits));
fs.writeFileSync('./docs/data/routes.json', JSON.stringify(routes_files));
for(const [route_type, route_ref] of routes_files) {
    const route_data = fs.readFileSync(`./data/${route_type}_${route_ref}.json`);
    fs.writeFileSync(`./docs/data/${route_type}_${route_ref}.json`, route_data);
}