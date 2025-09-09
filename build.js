import fs from 'fs';
import { fetch_file, get_date, get_latest_data_commit } from './utils.js';

const MAIN_TYPES = ['bus', 'trolley', 'tram', 'metro'];

const route_overrides = JSON.parse(fs.readFileSync('./route_overrides.json', 'utf-8') || '{}');

function normalise_route(route, date) {
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
        if(MAIN_TYPES.includes(type)) {
            return type;
        }
        console.error('Unknown route type:', type);
        return type;
    }
    function get_route_ref(route) {
        let route_ref = (route.route_ref?route.route_ref:route.line).toString().trim().replaceAll(' ', '');
        if(route_ref.startsWith('Y')) {
            route_ref = 'У'+route_ref.slice(1);
        }
        //                          Cyrl                         Latn
        else if(route_ref.endsWith('ТМ') || route_ref.endsWith('TM')) {
            route_ref = route_ref.slice(0, -2) + 'ТМ'; // Cyrl
        }
        //                         Cyrl                         Latn
        else if(route_ref.endsWith('А') || route_ref.endsWith('A')) {
            route_ref = route_ref.slice(0, -1) + 'А'; // Cyrl
        }
        //                          Cyrl                         Latn
        else if(route_ref.startsWith('Х') || route_ref.startsWith('X')) {
            route_ref = 'X'+route_ref.slice(1); // Latn
        }
        if(route_ref.includes('-')) {
            route_ref = route_ref.replace('-', '');
        }
        return route_ref;
    }
    function get_route_subtype(route) {
        if(route.type !== 'bus') {
            return null;
        }
        if(route.route_ref.startsWith('У')) {
            return 'school';
        }
        else if(route.route_ref.startsWith('N')) {
            return 'night';
        }
        else if(route.route_ref.endsWith('ТМ')) {
            return 'temporary';
        }
        return null;
    }
    route.type = determine_route_type(route.type);
    route.route_ref = get_route_ref(route);
    for(const override of route_overrides) {
        if(override.old.type != route.type || override.old.route_ref != route.route_ref) {
            continue;
        }
        if(date < override.start_date || date > override.end_date) {
            continue;
        }
        route.type = override.new.type;
        route.route_ref = override.new.route_ref;
        break;
    }
    route.subtype = get_route_subtype(route);
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

export async function get_data(routes_data, processed_routes, commit, current_date, yesterday_date) {
    if(!commit) {
        commit = await get_latest_data_commit();
    }

    if(!current_date) {
        current_date = get_date();
        yesterday_date = get_date(-1);
    }

    const metadata = await fetch_file('metadata.json', commit, current_date);
    if(metadata.retrieval_date !== current_date) {
        console.error('Metadata is outdated');
        return;
    }

    const remote_routes = await fetch_file('routes.json', commit, current_date);
    const trips = await fetch_file('trips.json', commit, current_date);

    remote_routes.forEach((route, route_index) => {
        normalise_route(route, current_date);
        
        const type = route.type;
        const route_ref = route.route_ref;
        const subtype = route.subtype || null;

        const data = routes_data.get(`${type}/${route_ref}`) || {
            type: type,
            route_ref: route_ref,
            subtype: subtype,
            schedules: []
        };
        processed_routes.add(`${type}/${route_ref}`);

        trips
        .filter(trip => trip.route_index === route_index)
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
            const not_metro_m1_or_m2 = (type !== 'metro' && route_ref !== 'M1' && route_ref !== 'M2');
            for(const schedule of similar_schedules) {
                if(!schedule.end_date && not_metro_m1_or_m2) {
                    schedule.end_date = yesterday_date;
                }
            }
            data.schedules.push({
                code: trip.code,
                is_weekend: trip.is_weekend,
                start_date: trip.valid_from?trip.valid_from:current_date
            });
        });

        if(!routes_data.has(`${type}/${route_ref}`)) {
            routes_data.set(`${type}/${route_ref}`, data);
        }
    });
}