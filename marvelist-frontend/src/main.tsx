import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './styles/main.scss'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { Provider } from 'react-redux'
import { store } from './store/store.ts'
import { api } from './services/api.ts'
import { unlockAudio } from './utils/sfx.ts'

// Appena si apre il sito si sveglia il backend, così i dati arrivano prima
api.get('/ping').catch(() => {})
unlockAudio()

// App installabile: il service worker si registra solo nella versione pubblicata (in sviluppo intralcerebbe Vite)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)