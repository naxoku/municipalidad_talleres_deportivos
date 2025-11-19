import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import DrawerLayout from '../src/components/DrawerLayout';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        {/* The drawer layout is specific to the (drawer) group now; Slot renders routes */}
        <DrawerLayout>
          <Slot />
        </DrawerLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
