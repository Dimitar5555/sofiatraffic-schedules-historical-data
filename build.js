import fs from 'fs';

function get_date(yesterday=false) {
    const date = new Date();
    if(yesterday) {
        date.setDate(date.getDate() - 1);
    }
    return date.toISOString().split('T')[0];
}

function fetch_file(filename) {
    const url_start = 'https://dimitar5555.github.io/sofiatraffic-schedules/data';
    return fetch(`${url_start}/${filename}`)
        .then(response => response.json());
}

function init() {
    if(!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    get_data();
}

async function get_data() {
    const yesterday_date = get_date(true);
    const current_date = get_date();

    const metadata = await fetch_file('metadata.json');
    if(metadata.retrieval_date !== current_date) {
        console.log('Metadata is outdated');
        return;
    }

    const routes = await fetch_file('routes.json');
    const trips = await fetch_file('trips.json');
    const directions = await fetch_file('directions.json');

    routes.forEach((route, index) => {
        route.route_index = index;
    });

    for(const route of routes) {
        const filename = `./data/${route.type}_${route.route_ref}.json`;
        let data;
        if(!fs.existsSync(filename)) {
            data = {
                type: route.type,
                route_ref: route.route_ref,
                schedules: []
            }
        }
        else {
            data = JSON.parse(fs.readFileSync(filename));
        }

        trips
        .filter(trip => trip.route_index === route.route_index)
        .forEach(trip => {
            if(data.schedules[data.schedules.length - 1]?.code === trip.code) {
                return;
            }
            if(data.schedules.length > 0) {
                data.schedules[data.schedules.length - 1].end_date = yesterday_date;
            }
            data.schedules.push({
                code: trip.code,
                is_weekend: trip.is_weekend,
                stops: directions.find(direction => direction.code === trip.direction).stops,
                start_date: current_date
            });
        });

        fs.writeFileSync(filename, JSON.stringify(data));
    }
}

init();