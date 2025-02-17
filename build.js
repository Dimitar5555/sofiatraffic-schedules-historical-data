import fs from 'fs';
import { fetch_file, get_date, get_latest_data_commit } from './utilities.js';

export function init() {
    if(!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    get_data();
}

function determine_route_type(type) {
    const bindings = {
        'autobus': 'bus',
        'trolleybus': 'trolley',
        'tramway': 'tram',
        'metro': 'metro'
    };
    if(bindings[type]) {
        return bindings[type];
    }
    if(['bus', 'trolley', 'tram', 'metro'].includes(type)) {
        return type;
    }
    console.error('Unknown route type:', type);
    return type;
}

function get_route_ref(route) {
    let route_ref = (route.route_ref?route.route_ref:route.line).toString();
    if(route_ref.startsWith('Y')) {
        route_ref = 'У'+route_ref.slice(1);
    }
    //                          Cyrl                         Latn
    else if(route_ref.endsWith('-ТМ') || route_ref.endsWith('-TM')) {
        route_ref = route_ref.slice(0, -3) + 'ТМ'; //Cyrl
    }
    //                         Cyrl                         Latn
    else if(route_ref.endsWith('-А') || route_ref.endsWith('-A')) {
        route_ref = route_ref.slice(0, -2) + 'А'; //Cyrl
    }
    return route_ref;
}

function is_weekend(valid_thru) {
    if(valid_thru === '100') {
        return false;
    }
    else if(valid_thru === '011') {
        return true;
    }
    return valid_thru;
}

function generate_schedule_code(valid_thru, valid_from) {
    let code = ['FIXME'];
    if(valid_thru === true) {
        valid_thru = '011';
    }
    else if(valid_thru === false) {
        valid_thru = '100';
    }

    const [weekday, saturday, sunday] = valid_thru.split('').map(char => char === '1');
    if(weekday) {
        code.push('Делник');
    }
    if(saturday) {
        code.push('Събота');
    }
    if(sunday) {
        code.push('Неделя');
    }
    code.push(valid_from);
    return code.join(' ');
}

function do_schedules_overlap(old_schedule, new_schedule) {
    if(typeof old_schedule === 'boolean') {
        old_schedule = old_schedule?'011':'100';
    }
    if(typeof new_schedule === 'boolean') {
        new_schedule = new_schedule?'011':'100';
    }
    if(old_schedule === new_schedule) {
        return true;
    }
    const [old_weekday, old_saturday, old_sunday] = old_schedule.split('').map(char => char === '1');
    const [new_weekday, new_saturday, new_sunday] = new_schedule.split('').map(char => char === '1');
    if(old_weekday && new_weekday || old_saturday && new_saturday || old_sunday && new_sunday) {
        return true;
    }
    return false;
}

export async function get_data(commit, current_date, yesterday_date) {
    if(!commit) {
        commit = await get_latest_data_commit();
    }

    if(!current_date) {
        current_date = get_date();
        yesterday_date = get_date(-1);
    }

    const metadata = await fetch_file('metadata.json', commit);
    if(metadata.retrieval_date !== current_date) {
        console.error('Metadata is outdated');
        return;
    }

    const remote_routes = await fetch_file('routes.json', commit);
    const trips = await fetch_file('trips.json', commit);

    remote_routes.forEach((route, index) => {
        route.route_index = index;
    });

    for(const route of remote_routes) {
        const type = determine_route_type(route.type);
        const route_ref = get_route_ref(route);

        const filename = `./data/${type}_${route_ref}.json`;
        let data;
        if(!fs.existsSync(filename)) {
            data = {
                type: type,
                route_ref: route_ref,
                schedules: []
            }
        }
        else {
            data = JSON.parse(fs.readFileSync(filename));
        }

        trips
        .filter(trip => trip.route_index === route.route_index)
        .forEach(trip => {
            if(trip.valid_from) {
                trip.valid_from = trip.valid_from.split('.').toReversed().join('-');
                if(trip.valid_from === '2026-03-16') {
                    // for bus 64
                    trip.valid_from = '2024-03-16';
                }
            }
            if(trip.valid_thru) {
                trip.is_weekend = is_weekend(trip.valid_thru);
            }
            if(!trip.code) {
                if(trip.valid_thru && trip.valid_from) {
                    trip.code = generate_schedule_code(trip.valid_thru, trip.valid_from);
                }
                else {
                    trip.code = generate_schedule_code(trip.is_weekend);
                }
            }
            const same_schedule = data.schedules.find(schedule => !schedule.end_date && (schedule.code === trip.code || schedule.start_date === trip.valid_from));
            if(same_schedule) {
                return;
            }
            const similar_schedules = data.schedules.filter(schedule => !schedule.end_date && do_schedules_overlap(schedule.is_weekend, trip.is_weekend));
            for(const schedule of similar_schedules) {
                if(!schedule.end_date) {
                    schedule.end_date = yesterday_date;
                }
            }
            data.schedules.push({
                code: trip.code,
                is_weekend: trip.is_weekend,
                start_date: trip.valid_from?trip.valid_from:current_date
            });
        });

        console.log(`Writing to ${filename} for date ${current_date}`);
        fs.writeFileSync(filename, JSON.stringify(data));
    }

    const local_routes = fs.readdirSync('./data');
    const remote_route_tags = new Set();
    remote_routes.forEach(route => {
        remote_route_tags.add(`${determine_route_type(route.type)}_${get_route_ref(route)}`);
    });
    
    const local_route_tags = new Set();
    local_routes.forEach(route => {
        local_route_tags.add(route.split('.')[0]);
    });

    const to_remove = local_route_tags.difference(remote_route_tags);
    to_remove.forEach(tag => {
        console.log(`Removing ${tag}`);
        const data  = JSON.parse(fs.readFileSync(`./data/${tag}.json`));
        data.schedules.forEach(schedule => {
            if(!schedule.end_date) {
                schedule.end_date = yesterday_date;
            }
        });
        fs.writeFileSync(`./data/${tag}.json`, JSON.stringify(data));
    });
}

// init();