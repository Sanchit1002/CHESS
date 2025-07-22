import React from 'react';

const TestEnv: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px' }}>
      <h3>Environment Variables Test</h3>
      <p><strong>API Key:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? 'Present' : 'Missing'}</p>
      <p><strong>Auth Domain:</strong> {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Missing'}</p>
      <p><strong>Project ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing'}</p>
      <p><strong>Storage Bucket:</strong> {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'Missing'}</p>
      <p><strong>Messaging Sender ID:</strong> {import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'Missing'}</p>
      <p><strong>App ID:</strong> {import.meta.env.VITE_FIREBASE_APP_ID || 'Missing'}</p>
      <p><strong>Measurement ID:</strong> {import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'Missing'}</p>
    </div>
  );
};

export default TestEnv; 