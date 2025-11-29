<script>
    import { get_route_classes } from 'sofiatraffic-library';
    import Title from '/src/components/Title.svelte';

    export let data;
    const { routes } = data;
</script>
<Title title="Избор на маршрут" />
<h2>Метро</h2>
{#each routes as route}
    {#if route.type === 'metro'}
        <a 
        class="{get_route_classes(route.type, route.route_ref, route.is_active)}
        line_selector_btn rounded-1 fw-bolder fs-5 fw-bolder"
        href={"/metro/" + route.route_ref}
        >{route.route_ref}</a>
    {/if}
{/each}

<h2 class="mt-2 mb-0">Трамваи</h2>
{#each routes as route}
    {#if route.type === 'tram'}
        <a 
        class="{get_route_classes(route.type, route.route_ref, route.is_active)}
        line_selector_btn rounded-1 fw-bolder fs-5 fw-bolder"
        href={"/tram/" + route.route_ref + "/"}
        >{route.route_ref}</a>
    {/if}
{/each}

<h2 class="mt-2 mb-0">Тролейбуси</h2>
{#each routes as route}
    {#if route.type === 'trolley'}
        <a 
        class="{get_route_classes(route.type, route.route_ref, route.is_active)}
        line_selector_btn rounded-1 fw-bolder fs-5 fw-bolder"
        href={"/trolley/" + route.route_ref + "/"}
        >{route.route_ref}</a>
    {/if}
{/each}

<h2 class="mt-2 mb-0">Автобуси</h2>
{#each routes as route}
    {#if route.type === 'bus' && !route.subtype}
        <a 
        class="{get_route_classes(route.type, route.route_ref, route.is_active)}
        line_selector_btn rounded-1 fw-bolder fs-5 fw-bolder"
        href={"/bus/" + route.route_ref + "/"}
        >{route.route_ref}</a>
    {/if}
{/each}

<h2 class="mt-2 mb-0">Заместващи автобуси</h2>
{#each routes as route}
    {#if route.type === 'bus' && route.subtype === 'temporary'}
        <a 
        class="{get_route_classes(route.type, route.route_ref, route.is_active)}
        line_selector_btn rounded-1 fw-bolder fs-5 fw-bolder"
        href={"/bus/" + route.route_ref + "/"}
        >{route.route_ref}</a>
    {/if}
{/each}

<h2 class="mt-2 mb-0">Нощни автобуси</h2>
{#each routes as route}
    {#if route.type === 'bus' && route.subtype === 'night'}
        <a 
        class="{get_route_classes(route.type, route.route_ref, route.is_active)}
        line_selector_btn rounded-1 fw-bolder fs-5 fw-bolder"
        href={"/bus/" + route.route_ref + "/"}
        >{route.route_ref}</a>
    {/if}
{/each}

<h2 class="mt-2 mb-0">Училищни автобуси</h2>
{#each routes as route}
    {#if route.type === 'bus' && route.subtype === 'school'}
        <a 
        class="{get_route_classes(route.type, route.route_ref, route.is_active)}
        line_selector_btn rounded-1 fw-bolder fs-5 fw-bolder"
        href={"/bus/" + route.route_ref + "/"}
        >{route.route_ref}</a>
    {/if}
{/each}