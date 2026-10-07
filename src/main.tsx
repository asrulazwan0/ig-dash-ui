import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import './style.css'
import { readEmailLink } from './features/accounts/EmailAction'
const initialEmailLink = readEmailLink()
const client = new QueryClient()
createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={client}><App initialEmailLink={initialEmailLink} /></QueryClientProvider></StrictMode>)
