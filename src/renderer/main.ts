import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import ConfirmationService from 'primevue/confirmationservice';
import { createPinia } from 'pinia';

// Primevue css
import 'primevue/resources/primevue.min.css'

// Primeflex css
import 'primeflex/primeflex.css'

import 'primeicons/primeicons.css'

const app = createApp(App);

app.use(createPinia())
app.use(ToastService)
app.use(ConfirmationService)
app.use(PrimeVue, { ripple: true })
app.directive('tooltip', Tooltip);

app.mount('#app');
