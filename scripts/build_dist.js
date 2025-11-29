import fs from 'fs';

const commits = JSON.parse(fs.readFileSync('commits.json'));

const sorting_by_type = ['metro', 'tram', 'trolley', 'bus'];

if(!fs.existsSync('src/lib/data')) {
    fs.mkdirSync('src/lib/data');
}
for(const type of sorting_by_type) {
    if(!fs.existsSync(`src/lib/data/${type}`)) {
        fs.mkdirSync(`src/lib/data/${type}`);
    }
}

const routes_files = sorting_by_type.flatMap(type => {
    if(!fs.existsSync(`data/${type}`)) {
        return;
    }
    const files = fs.readdirSync(`data/${type}`);
    const list = files.map(file => {
        const data = JSON.parse(fs.readFileSync(`data/${type}/${file}`, 'utf-8'));
        const is_active = data.schedules.some(schedule => !schedule.end_date);
        fs.writeFileSync(`src/lib/data/${type}/${file}`, JSON.stringify(data));
        return {
            type: data.type,
            subtype: data.subtype || undefined,
            route_ref: data.route_ref,
            is_active
        };
    })
    .toSorted((a, b) => {
        if(sorting_by_type.indexOf(a.type) < sorting_by_type.indexOf(b.type)) {
            return -1;
        }
        if(sorting_by_type.indexOf(a.type) > sorting_by_type.indexOf(b.type)) {
            return 1;
        }
        const numeric_a = parseInt(a.route_ref.replaceAll(/[^0-9]/g, ''));
        const numeric_b = parseInt(b.route_ref.replaceAll(/[^0-9]/g, ''));
        return numeric_a - numeric_b;
    });
    return list;
});

fs.writeFileSync('src/lib/data/commits.json', JSON.stringify(commits));
fs.writeFileSync('src/lib/data/routes.json', JSON.stringify(routes_files));