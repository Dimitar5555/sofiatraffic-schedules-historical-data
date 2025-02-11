export function fetch_file(filename, commit=false) {
    let url = 'https://raw.githubusercontent.com/dimitar5555/sofiatraffic-schedules';
    if(commit) {
        url += `/${commit}/docs/data`;
        return fetch_remote_json(`${url_start}/${filename}`);
    }
    else {
        url += '/master/docs/data';
    }
    return fetch_remote_json(`${url}/${filename}`);
}

export async function fetch_remote_json(url) {
    const request = await fetch(url);
    if(!request.ok) {
        console.error(request.headers);
    }
    return request.json();
}