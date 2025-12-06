import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Function to inject React app
function injectApp() {
  // Wikipedia's main content wrapper usually has the ID "bodyContent"
  const contentBody = document.getElementById('bodyContent');
  
  if (contentBody) {
    // Create a container for our extension
    const appContainer = document.createElement('div');
    appContainer.id = 'wikitube-extension-root';
    
    // Insert it at the top of the bodyContent
    contentBody.prepend(appContainer);

    // Mount React
    const root = createRoot(appContainer);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

// Run injection
injectApp();