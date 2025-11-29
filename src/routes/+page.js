import routes from '$lib/data/routes.json';

export async function load({ fetch, params }) {
    return { routes };
}