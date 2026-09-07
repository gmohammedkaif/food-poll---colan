import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { ToastProvider } from './components/ui/Toast.js';
import { PushNotificationProvider } from './context/PushNotificationContext.js';
import { App } from './App.js';
import './index.css';

// Suppress external extension / DevTools runner VM script errors from polluting the console
window.addEventListener('error', (event) => {
  const msg = event.message || event.error?.message || '';
  const stack = event.error?.stack || '';
  const file = event.filename || '';

  if (
    msg.includes('reportAllChanges') ||
    msg.includes('startTime') ||
    stack.includes('reportAllChanges') ||
    stack.includes('reportAllChanges') ||
    file.includes('anonymous') ||
    file.startsWith('VM') ||
    !file
  ) {
    if (msg.includes('startTime') || msg.includes('reportAllChanges')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || '';
  const stack = event.reason?.stack || '';
  if (msg.includes('reportAllChanges') || msg.includes('startTime') || stack.includes('reportAllChanges')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <PushNotificationProvider>
                <App />
              </PushNotificationProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
