import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components/ToastProvider';

export default function App() {
  return (
    <ToastProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </ToastProvider>
  );
}
