// CSS first: base.css declares `@layer base, theme, ui`, and the kit's
// component CSS (layer `ui`) is injected as soon as an entry is evaluated.
import '@constructor/globals/base.css';
import '@constructor/globals/themes/constructor/styles.css';
import './styles/app.css';

import { createGoBasePlugin } from '@constructor/ui/base';
import { createGoColorSchemeProviderPlugin } from '@constructor/ui/color-scheme';
import { createGoFormPlugin, generateErrorMessage } from '@constructor/ui/form';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);
// Order matters: the kit's base plugin reads a pinia store while installing.
app.use(createPinia());
app.use(router);
app.use(createGoBasePlugin());
app.use(createGoColorSchemeProviderPlugin());
app.use(createGoFormPlugin({ generateMessage: (ctx) => generateErrorMessage(ctx, {}, {}) }));
app.mount('#app');
