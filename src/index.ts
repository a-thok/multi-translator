import App from './components/App.svelte';

const wrapper = document.createElement('div');
document.body.append(wrapper);
wrapper.attachShadow({ mode: 'open' });

if (wrapper.shadowRoot) {
  // eslint-disable-next-line no-new
  new App({
    target: wrapper.shadowRoot,
  });
}
