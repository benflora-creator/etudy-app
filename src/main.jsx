import React from 'react'
import { createRoot } from 'react-dom/client'

// Polyfill: window.storage (Claude.ai artifact API) → localStorage
if (!window.storage) {
  window.storage = {
    async get(key) {
      const val = localStorage.getItem(key);
      if (val === null) throw new Error('Key not found: ' + key);
      return { key, value: val };
    },
    async set(key, value) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!prefix || k.startsWith(prefix)) keys.push(k);
      }
      return { keys };
    }
  };
}

import Etudy from './jazz-licks-app.jsx'

createRoot(document.getElementById('root')).render(
  React.createElement(Etudy)
)
