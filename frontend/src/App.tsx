import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router';
import { TopProgressBar } from './components/ui/TopProgressBar';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        {/* Luminous Top Route Transition Indicator */}
        <TopProgressBar />

        {/* Master Route Dispatcher */}
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
