#!/usr/bin/env node
import { readFile } from 'fs/promises';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api';
const EMAIL = process.env.SEED_EMAIL ?? 'analista@example.com';
const PASSWORD = process.env.SEED_PASSWORD ?? 'Secret123';
const ROLE = process.env.SEED_ROLE ?? 'ANALYST';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SAMPLE_DIR = path.resolve(ROOT_DIR, 'sample-data');

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error ${response.status} en ${endpoint}: ${text}`);
  }
  return response;
}

async function login() {
  const response = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const data = await response.json();
  return data.accessToken;
}

async function register() {
  try {
    await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, role: ROLE })
    });
  } catch (error) {
    if (error.message.includes('409')) {
      return;
    }
    throw error;
  }
}

async function ensureToken() {
  try {
    return await login();
  } catch (error) {
    console.log('No se pudo iniciar sesión, creando usuario de ejemplo...');
    await register();
    return login();
  }
}

async function readSampleFile(name) {
  const filePath = path.join(SAMPLE_DIR, name);
  const buffer = await readFile(filePath);
  return new Blob([buffer], { type: 'text/csv' });
}

async function uploadDocuments(token) {
  const form = new FormData();
  form.append('files', await readSampleFile('bill-of-lading.csv'), 'bill-of-lading.csv');
  form.append('files', await readSampleFile('invoice.csv'), 'invoice.csv');
  form.append(
    'metadata',
    JSON.stringify([
      { originalName: 'bill-of-lading.csv', type: 'BILL_OF_LADING' },
      { originalName: 'invoice.csv', type: 'INVOICE' }
    ])
  );

  const response = await request('/documents/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  return response.json();
}

async function runComparison(token, documentIds) {
  const response = await request('/comparison/run', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ documentIds })
  });
  return response.json();
}

async function main() {
  console.log(`Sembrando datos de ejemplo en ${API_URL}`);
  const token = await ensureToken();
  console.log('Sesión obtenida correctamente. Subiendo documentos de ejemplo...');
  const documents = await uploadDocuments(token);
  const documentIds = documents.map((doc) => doc.id);
  console.log('Documentos subidos:', documentIds);
  const comparison = await runComparison(token, documentIds);
  console.log('Comparación ejecutada con ID:', comparison.id);
  const criticalFields = comparison.result.filter((row) => row.critical).map((row) => row.field);
  console.log('Campos con alerta crítica:', criticalFields.length ? criticalFields : 'Sin alertas críticas');
}

main().catch((error) => {
  console.error('Error al sembrar datos de ejemplo:', error);
  process.exit(1);
});
