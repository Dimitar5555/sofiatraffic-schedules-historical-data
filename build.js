import fs from 'fs';
import { fetch_file, fetch_remote_json } from './utilities.js';

function get_date(offset=0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
}

export function init() {
    if(!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    get_data();
}

async function get_data() {
    const yesterday_date = get_date(-1);
    const current_date = get_date();

    const metadata = await fetch_file('metadata.json');
    if(metadata.retrieval_date !== current_date) {
        console.error('Metadata is outdated');
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
            const same_schedule = data.schedules.find(schedule => !schedule.end_date && schedule.code === trip.code);
            if(same_schedule) {
                return;
            }
            const similar_schedule = data.schedules.find(schedule => !schedule.end_date && schedule.is_weekend === trip.is_weekend);
            if(similar_schedule) {
                similar_schedule.end_date = yesterday_date;
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