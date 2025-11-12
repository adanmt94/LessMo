/**
 * LessMo - Aplicación de gestión de gastos compartidos
 * App principal con navegación y autenticación
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { Navigation } from './src/navigation';
import './src/i18n/config'; // Inicializar i18n

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
