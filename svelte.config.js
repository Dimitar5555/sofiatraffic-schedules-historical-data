import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true,
		}),
		prerender: {
			handleUnseenRoutes: 'ignore'
		},
		paths: {
			base: process.argv.includes('dev') ? '' : '/sofiatraffic-schedules-historical-data'
		}
	}
};

export default config;
