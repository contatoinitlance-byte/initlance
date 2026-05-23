import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { consumeSupabaseOAuthHash } from '@/api/supabaseClient'

const root = ReactDOM.createRoot(document.getElementById('root'))

consumeSupabaseOAuthHash('/marketplace').finally(() => {
  root.render(<App />)
})
