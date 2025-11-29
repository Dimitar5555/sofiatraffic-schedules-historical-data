<script>
    export let schedules = [];
    export let title = "";
</script>
<div class="col col-12 col-lg-6">
    <table class="table table-bordered">
        <thead class="text-center">
            <tr>
                <th colspan="3">{title}</th>
            </tr>
            <tr>
                <th>Код</th>
                <th>Начална дата</th>
                <th>Крайна дата</th>
            </tr>
        </thead>
        <tbody>
    {#each schedules as schedule}
        <tr>
            <td>{@html schedule.code.startsWith('FIXME') ? "<span class=\"fst-italic\">(неизвестен код)</span>" : schedule.code}</td>
            <td>{new Date(schedule.start_date).toLocaleDateString('bg-BG')}</td>
            <td>{@html schedule.end_date ? new Date(schedule.end_date).toLocaleDateString('bg-BG') : "<span class=\"fst-italic\">неопределена</span>"}</td>
        </tr>
    {:else}
        <tr>
            <td colspan="3" class="text-center fst-italic">Няма разписания</td>
        </tr>
    {/each}
        </tbody>
    </table>
</div>