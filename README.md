# Comparación de Documentos de Embarque

Este repositorio contiene un boilerplate completo para una plataforma de comparación de documentos de comercio exterior. La solución incluye un frontend construido con Next.js 14, TailwindCSS y shadcn/ui, un backend desarrollado con NestJS y PostgreSQL como base de datos, junto con una infraestructura preparada para ejecutarse mediante Docker.

## Estructura del proyecto

```
.
├── backend/               # API REST construida con NestJS + TypeORM
├── frontend/              # Aplicación web con Next.js 14 (App Router)
├── docker-compose.yml     # Orquestación de servicios (frontend, backend, db)
├── Dockerfile.backend     # Imagen del backend
├── Dockerfile.frontend    # Imagen del frontend
├── README.md              # Este archivo
├── .env.example           # Variables de entorno de referencia
└── scripts/               # Scripts de utilidad
```

## Funcionalidades clave

### Frontend (Next.js 14 + TailwindCSS + shadcn/ui)
- Pantalla de inicio de sesión con validación (roles Analista y Supervisor).
- Dashboard con carga de múltiples documentos y ejecución de comparaciones reales contra la API.
- Tabla comparativa dinámica con colores según coincidencias, diferencias y campos faltantes.
- Búsqueda y filtros sobre los campos comparados.
- Botones para solicitar la descarga de reportes en Excel o PDF.
- Panel de historial para visualizar comparaciones previas.

### Backend (NestJS + PostgreSQL)
- Endpoints REST para autenticación (`/auth/login`, `/auth/register`).
- Endpoints para carga, extracción (OCR/Parsing) y comparación de documentos.
- Generación de reportes en Excel y PDF.
- Persistencia de documentos y resultados de comparación mediante TypeORM.
- Autenticación basada en JWT lista para integrar con guards.

### Procesamiento de documentos
- OCR con `tesseract.js` para documentos escaneados.
- Parsing de PDF, CSV, Excel y Word (pdf-parse, csv-parse, xlsx, mammoth).
- Normalización de campos críticos (exportador, consignatario, puertos, contenedor, peso, cantidad, valor, incoterms, descripción de mercadería).
- Detección de discrepancias y alertas críticas en campos sensibles.

## Requisitos previos

- Docker y Docker Compose
- Node.js 18+ (opcional si se ejecuta sin Docker)
- pnpm 8+ o npm 9+

## Puesta en marcha con Docker

```bash
docker compose up --build
```

Esto iniciará los siguientes servicios:

- **frontend** en `http://localhost:3000`
- **backend** en `http://localhost:3001`
- **postgres** en `localhost:5432`

Las credenciales por defecto para PostgreSQL están definidas en el archivo `.env` (ver sección de configuración).

## Configuración de variables de entorno

Copie el archivo `.env.example` a `.env` en la raíz del proyecto y ajuste los valores necesarios.

```bash
cp .env.example .env
```

El archivo contiene las variables para el backend, frontend y base de datos.

## Migraciones y base de datos

El backend utiliza TypeORM. Para ejecutar migraciones una vez dentro del contenedor del backend:

```bash
npm run migration:run
```

## Datos de ejemplo

El repositorio incluye documentos de prueba (`sample-data/bill-of-lading.csv` e `sample-data/invoice.csv`) que cubren al menos cinco campos críticos. Con ellos puede verificar de punta a punta la carga, extracción, comparación y generación de reportes.

## Scripts útiles

Se incluyen scripts para poblar datos de ejemplo y limpiar el entorno dentro del directorio `scripts/`. Utilice `scripts/seed-example.sh` (o ejecute `node scripts/seed-example.mjs`) una vez que el stack esté levantado para:

1. Crear un usuario analista (`analista@example.com` / `Secret123`) si no existe.
2. Subir los documentos CSV de ejemplo y procesarlos.
3. Ejecutar automáticamente una comparación y dejar un registro en el historial.

El script utiliza la API estándar de Node.js, por lo que no requiere dependencias adicionales.

## Próximos pasos sugeridos

1. Implementar el flujo completo de autenticación y autorización con guards y refresh tokens.
2. Conectar los servicios de extracción (OCR) reales en `ExtractionService` y ajustar expresiones regulares según el formato de documentos reales.
3. Ajustar el mapeo de campos y las reglas de comparación según requerimientos específicos de negocio.
4. Completar la generación de reportes en PDF/Excel con identidades visuales corporativas e integraciones con sistemas externos (ERP/Aduanas).

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulte el archivo `LICENSE` para más detalles.
