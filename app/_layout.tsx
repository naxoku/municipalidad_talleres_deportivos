import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import DrawerLayout from '../src/components/DrawerLayout';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DrawerLayout>
          <Slot />
        </DrawerLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
