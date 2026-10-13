import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router';
import { TopProgressBar } from './components/ui/TopProgressBar';
import { ToastContainer } from './components/ui/Toast';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        {/* Luminous Top Route Transition Indicator */}
        <TopProgressBar />

        {/* Global Toast Notification Container across all routes */}
        <ToastContainer />

        {/* Master Route Dispatcher */}
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
