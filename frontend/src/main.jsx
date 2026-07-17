import './index.css'
import './assets/fonts/alpino.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'sonner'
import router from './routes'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141414',
            border: '1px solid rgba(211, 171, 57, 0.3)',
            color: '#fff',
            fontSize: '13px',
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>,
)
