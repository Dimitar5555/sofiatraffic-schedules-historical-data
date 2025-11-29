import fs from 'fs';
function rollback_data_to_date(target_date) {
    for(const type of ['bus', 'trolley', 'tram', 'metro']) {
        const files = fs.readdirSync(`/data/${type}`);
        for(const file of files) {
            const path = `/data/${type}/${file}`;
            const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
            for(let i = data.schedules.length - 1; i >= 0; i--) {
                const schedule = data.schedules[i];
                if(schedule.start_date > target_date) {
                    data.schedules.splice(i, 1);
                }
                else if(schedule.end_date && schedule.end_date > target_date) {
                    delete schedule.end_date;
                }
            }
            if(data.schedules.length === 0) {
                fs.rmSync(path);
                continue;
            }
            fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
        }
    }
    fs.writeFileSync('/data/last_run.txt', target_date, 'utf-8');
}

rollback_data_to_date('2025-03-07');