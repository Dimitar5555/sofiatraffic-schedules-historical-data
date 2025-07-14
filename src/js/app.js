routes = [];

const type_mappings = {
    'metro': 'Метролиния',
    'tram': 'Трамвай',
    'trolley': 'Тролейбус',
    'bus': 'Автобус'
};

const cache = new Map();

function navigate_to_hash() {
    const hash = document.location.hash.replace('#!', '');
    const params = decodeURIComponent(hash).split('/').filter(param => param);
    const [route_type, route_ref] = params;
    if(route_type && route_ref) {
        display_route_data(route_type, route_ref);
        document.querySelector('#route_details_pane').classList.remove('d-none');
        document.querySelector('#routes_pane').classList.add('d-none');
    }
    else {
        display_routes_list();
        document.querySelector('#route_details_pane').classList.add('d-none');
        document.querySelector('#routes_pane').classList.remove('d-none');
    }
}

window.onhashchange = async function() {
    navigate_to_hash();
};

loaded_routes = false;

async function display_routes_list() {
    if(loaded_routes) {
        return;
    }
    loaded_routes = true;
    function populate_routes_list(routes, container_id) {
        const container = document.querySelector(`#${container_id}`);
        container.innerHTML = routes.map(route => {
            let bg_color_class = '';
            if(!route.is_active) {
                bg_color_class = 'bg-secondary';
            }
            else if(route.type === 'metro') {
                bg_color_class = `${route.route_ref}-bg-color`;
            }
            else {
                bg_color_class = `${route.type}-bg-color`;
            }
            return `
        <a class="line_selector_btn ${bg_color_class} rounded-1 fw-bolder fs-5 fw-bolder text-light" href="#!${route.type}/${route.route_ref}/">
            ${route.route_ref}
        </a>
        `;
        }).join('');
    }
    routes = await fetch('./data/routes.json').then(response => response.json());
    ['metro', 'tram', 'trolley', 'bus'].forEach(type => {
        const filtered_routes = routes.filter(route => route.type === type && !route.subtype);
        const container = document.querySelector(`#${type}_routes`);
        populate_routes_list(filtered_routes, `${type}_routes`);
    });
    ['temporary', 'night', 'school'].forEach(subtype => {
        const filtered_routes = routes.filter(route => route.subtype === subtype);
        populate_routes_list(filtered_routes, `${subtype}_routes`);
    });
}

async function fetch_route_data(route_type, route_ref) {
    if(cache.has(`${route_type}/${route_ref}`)) {
        return cache.get(`${route_type}/${route_ref}`);
    }
    const response = await fetch(`./data/${route_type}/${route_ref}.json`);
    const data = await response.json();
    cache.set(`${route_type}/${route_ref}`, data);
    return data;
}

async function display_route_data(route_type, route_ref) {
    const route = routes.find(route => route.route_ref === route_ref);
    const route_data = await fetch_route_data(route_type, route_ref);
    const grouped_schedules = {
        'weekday': [],
        'weekend': []
    };
    document.querySelector('#route_name').textContent = `${type_mappings[route_type]} ${route_ref}`;
    document.querySelector('#route_name').setAttribute('class', `${route_data.type === 'metro' ? route_data.route_ref : route_data.type}-bg-color text-light w-auto px-3 py-1 fs-3 fw-bolder rounded-1`);
    for(const schedule of route_data.schedules) {
        let group_to_push = grouped_schedules.weekday;
        if(schedule.is_weekend) {
            group_to_push = grouped_schedules.weekend;
        }

        if(group_to_push.length > 0) {
            group_to_push[0].end_date = schedule.start_date;
        }
        group_to_push.unshift(schedule);
    }
    console.log(grouped_schedules);
    const date_options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    for(const type of ['weekday', 'weekend']) {
        const table = document.querySelector(`#${type}_table`).querySelector('tbody');
        if(grouped_schedules[type].length === 0) {
            table.innerHTML = `<tr><th colspan="3" class="text-center">Няма разписания</th></tr>`;
            continue;
        }
        let text = '';
        for (const schedule of grouped_schedules[type]) {
            const start_date = new Date(schedule.start_date).toLocaleDateString('bg', date_options);
            const end_date = schedule.end_date ? new Date(schedule.end_date).toLocaleDateString('bg', date_options) : "неопределен";
            const tr = `<tr>
                <td>${schedule.code.includes('FIXME') ? `<i>(неизвестен код)</i>` : schedule.code}</td>
                <td>${start_date}</td>
                <td>${end_date}</td>
                </tr>`;
                text += tr;
        }
        table.innerHTML = text;
    }
}

window.onload = async function() {
    toggle_theme();
    navigate_to_hash();
    document.querySelector('#loading_pane').classList.add('d-none');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    toggle_theme();
});

function toggle_theme() {
    let new_theme = 'light';
    if(window.matchMedia('(prefers-color-scheme: dark)').matches) {
        new_theme = 'dark';
    }
    document.documentElement.setAttribute('data-bs-theme', new_theme);
}