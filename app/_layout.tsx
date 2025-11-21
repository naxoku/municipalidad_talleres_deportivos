import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { QueryProvider } from '../src/contexts/QueryContext';
import DrawerLayout from '../src/components/DrawerLayout';

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <DrawerLayout>
            <Slot />
          </DrawerLayout>
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}