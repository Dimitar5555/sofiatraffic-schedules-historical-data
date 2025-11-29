<script>
    import { page } from '$app/stores';
    import { get_route_classes } from 'sofiatraffic-library';
    import ScheduleTable from '/src/components/ScheduleTable.svelte';
    import Title from '/src/components/Title.svelte';
    import { base } from '$app/paths';

    export let data;
    const type_mappings = {
        'metro': 'Метро',
        'tram': 'Трамвай',
        'trolley': 'Тролей',
        'bus': 'Автобус',
    };
    const { weekday_schedules, weekend_schedules, route, route_type, route_ref, is_active } = data;
</script>

<Title title="{type_mappings[route_type] + ' ' + route_ref}" />

<a href={`${base}/`}
    class="btn btn-outline-secondary mb-3"
    >
    ← Обратно към всички маршрути
</a>

<br>

<span 
    class="{get_route_classes(route_type, route_ref, is_active)}
    w-auto px-3 fs-3 fw-bolder rounded-1"
    >
    {type_mappings[route_type]} {route_ref}
    </span>
<div class="row pt-2">
    <ScheduleTable schedules={weekday_schedules} title="Делник" />
    <ScheduleTable schedules={weekend_schedules} title="Празник" />
</div>