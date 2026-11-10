import { h } from '../dom.js';
import { login } from '../auth.js';

export function renderLogin(container, onLoggedIn) {
  const message = h('p', { class: 'error' });
  const username = h('input', { type: 'text', autocomplete: 'username', required: true });
  const password = h('input', { type: 'password', autocomplete: 'current-password', required: true });

  const form = h('form', {
    onsubmit: async (event) => {
      event.preventDefault();
      message.textContent = '';
      if (!navigator.onLine) {
        message.textContent = 'É preciso estar online para entrar.';
        return;
      }
      try {
        const response = await login(username.value.trim(), password.value);
        if (response.ok) onLoggedIn();
        else message.textContent = 'Usuário ou senha incorretos.';
      } catch {
        message.textContent = 'Não foi possível conectar ao servidor.';
      }
    }
  },
  h('h1', {}, 'Inventário do Laboratório'),
  h('label', {}, 'Usuário', username),
  h('label', {}, 'Senha', password),
  h('button', { type: 'submit' }, 'Entrar'),
  message);

  container.replaceChildren(form);
}
