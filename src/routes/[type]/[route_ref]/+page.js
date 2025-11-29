import routes from '$lib/data/routes.json';
export const trailingSlash = 'ignore';

export async function entries() {
	return routes
	.map(route => ({
		type: route.type,
		route_ref: route.route_ref
	}));
}

export async function load({ fetch, params }) {
	const route_type = params.type;
	const route_ref = decodeURIComponent(params.route_ref);
	const route = routes.find(r => r.type === route_type && r.route_ref === route_ref);
	console.log(route, route_type, route_ref);
	if(!route) {
		return {
			status: 404,
			error: new Error('Route not found')
		};
	}
	const is_active = route.is_active;
	// const route_data_res = await fetch(`$lib/data/routes/${route_type}/${route_ref}.json`);
	const route_data = await import(`$lib/data/${route_type}/${route_ref}.json`);
	route_data.schedules.sort((a, b) => b.start_date.localeCompare(a.start_date));
	const weekday_schedules = route_data.schedules.filter(s => !s.is_weekend);
	const weekend_schedules = route_data.schedules.filter(s => s.is_weekend);

	return { weekday_schedules, weekend_schedules, route_type, route_ref, route, is_active };
}