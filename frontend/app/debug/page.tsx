'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface TestResult {
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  response?: string;
  error?: string;
}

export default function DebugPage() {
  const [username, setUsername] = useState('guana_admin');
  const [password, setPassword] = useState('guana_pass69');
  const [token, setToken] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Events (GET /api/events/)', status: 'idle' },
    { name: 'Plans (GET /api/subscriptions/plans/)', status: 'idle' },
    { name: 'Token (POST /api/users/token/)', status: 'idle' },
    { name: 'Me (GET /api/users/me/)', status: 'idle' },
    { name: 'Venues (GET /api/venues/)', status: 'idle' },
  ]);

  const updateResult = (index: number, status: TestResult['status'], response?: string, error?: string) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], status, response, error };
      return newResults;
    });
  };

  const testEvents = async () => {
    updateResult(0, 'loading');
    try {
      const response = await fetch(`${API_BASE_URL}/events/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        updateResult(0, 'success', JSON.stringify(data, null, 2));
      } else {
        updateResult(0, 'error', undefined, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      updateResult(0, 'error', undefined, String(err));
    }
  };

  const testPlans = async () => {
    updateResult(1, 'loading');
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/plans/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        updateResult(1, 'success', JSON.stringify(data, null, 2));
      } else {
        updateResult(1, 'error', undefined, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      updateResult(1, 'error', undefined, String(err));
    }
  };

  const testToken = async () => {
    updateResult(2, 'loading');
    try {
      const response = await fetch(`${API_BASE_URL}/users/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.access);
        updateResult(2, 'success', JSON.stringify(data, null, 2));
      } else {
        updateResult(2, 'error', undefined, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      updateResult(2, 'error', undefined, String(err));
    }
  };

  const testMe = async () => {
    if (!token) {
      updateResult(3, 'error', undefined, 'Token no disponible. Primero haz login en prueba 3.');
      return;
    }
    updateResult(3, 'loading');
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        updateResult(3, 'success', JSON.stringify(data, null, 2));
      } else {
        updateResult(3, 'error', undefined, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      updateResult(3, 'error', undefined, String(err));
    }
  };

  const testVenues = async () => {
    if (!token) {
      updateResult(4, 'error', undefined, 'Token no disponible. Primero haz login en prueba 3.');
      return;
    }
    updateResult(4, 'loading');
    try {
      const response = await fetch(`${API_BASE_URL}/venues/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        updateResult(4, 'success', JSON.stringify(data, null, 2));
      } else {
        updateResult(4, 'error', undefined, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      updateResult(4, 'error', undefined, String(err));
    }
  };

  const runTest = (index: number) => {
    const testFunctions = [testEvents, testPlans, testToken, testMe, testVenues];
    testFunctions[index]();
  };

  const runAllTests = async () => {
    // Run public tests first (0, 1)
    await testEvents();
    await testPlans();
    // Then token test (2)
    await testToken();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Debug API</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Configuración</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2"><strong>API Base URL:</strong> {API_BASE_URL}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
              />
            </div>
          </div>
          
          <button
            onClick={runAllTests}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Ejecutar todas las pruebas
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{result.name}</h3>
                <div className="flex items-center gap-2">
                  {result.status === 'idle' && <span className="text-gray-400">⚪</span>}
                  {result.status === 'loading' && <span className="text-yellow-500 animate-spin">⏳</span>}
                  {result.status === 'success' && <span className="text-green-500">✅</span>}
                  {result.status === 'error' && <span className="text-red-500">❌</span>}
                  <button
                    onClick={() => runTest(index)}
                    disabled={result.status === 'loading'}
                    className="ml-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                  >
                    Probar
                  </button>
                </div>
              </div>

              {result.response && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Respuesta:</p>
                  <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-64 text-xs text-gray-800">
                    {result.response}
                  </pre>
                </div>
              )}

              {result.error && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Error:</p>
                  <pre className="bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-64 text-xs text-red-800">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {token && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Token Almacenado</h2>
            <p className="text-xs text-gray-600 break-all font-mono bg-gray-50 p-3 rounded">
              {token}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
