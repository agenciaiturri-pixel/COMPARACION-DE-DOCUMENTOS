'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentUpload, type LocalFile } from '@/components/document-upload';
import { ComparisonTable, type ComparisonField } from '@/components/comparison-table';
import { HistoryList, type HistoryEntry } from '@/components/history-list';
import { Button } from '@/components/ui/button';
import { ApiService, type ComparisonResultResponse, type UploadResponse } from '@/lib/api';
import { Download, FilePlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentSummary {
  id: string;
  name: string;
}

function mapComparisonRows(result: ComparisonResultResponse): ComparisonField[] {
  return result.result.map((row) => ({
    field: row.field,
    label: row.label ?? row.field,
    values: row.values,
    status: row.status,
    critical: row.critical ?? false
  }));
}

function mapDocuments(documents: UploadResponse[], order?: string[]): DocumentSummary[] {
  const mapped = documents.map((doc) => ({
    id: doc.id,
    name: doc.originalName ?? doc.filename
  }));

  if (!order?.length) {
    return mapped;
  }

  const byId = new Map(mapped.map((doc) => [doc.id, doc]));
  return order
    .map((id) => byId.get(id))
    .filter((item): item is DocumentSummary => Boolean(item));
}

function mapHistoryEntries(history: ComparisonResultResponse[]): HistoryEntry[] {
  return history.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    hasCriticalAlerts: item.hasCriticalAlerts,
    documents: item.documents.map((doc) => ({
      id: doc.id,
      name: doc.originalName ?? doc.filename,
      type: doc.type
    }))
  }));
}

export default function DashboardPage() {
  const router = useRouter();

  const [selectedFiles, setSelectedFiles] = useState<LocalFile[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [comparison, setComparison] = useState<ComparisonField[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastComparisonId, setLastComparisonId] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isDownloading, setIsDownloading] = useState<'excel' | 'pdf' | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await ApiService.getHistory();
      const mappedHistory = mapHistoryEntries(data);
      setHistory(mappedHistory);
      if (!lastComparisonId && data.length) {
        setLastComparisonId(data[0].id);
      }
    } catch (error) {
      console.error('No se pudo cargar el historial', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    ApiService.setAuthToken(token);
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = (files: LocalFile[]) => {
    setSelectedFiles(files);
    if (files.length >= 2 && compareError) {
      setCompareError(null);
    }
  };

  const handleCompare = async () => {
    if (selectedFiles.length < 2) {
      setCompareError('Selecciona al menos dos documentos para ejecutar la comparación.');
      return;
    }

    const formData = new FormData();
    const metadata = selectedFiles.map((file) => ({
      type: file.type,
      originalName: file.file.name
    }));

    selectedFiles.forEach((file) => {
      formData.append('files', file.file, file.file.name);
    });
    formData.append('metadata', JSON.stringify(metadata));

    setCompareError(null);
    setIsComparing(true);

    try {
      const uploaded = await ApiService.uploadDocuments(formData);
      const documentIds = uploaded.map((item) => item.id);
      const result = await ApiService.compare(documentIds);

      setDocuments(mapDocuments(result.documents.length ? result.documents : uploaded, documentIds));
      setComparison(mapComparisonRows(result));
      setLastComparisonId(result.id);
      await fetchHistory();
    } catch (error) {
      console.error('Error al comparar documentos', error);
      setCompareError('Ocurrió un problema al comparar los documentos. Inténtalo nuevamente.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleDownload = async (type: 'excel' | 'pdf') => {
    if (!lastComparisonId) {
      setCompareError('Genera una comparación antes de exportar un reporte.');
      return;
    }

    setIsDownloading(type);
    try {
      const blob = await ApiService.downloadReport(lastComparisonId, type);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${lastComparisonId}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('No se pudo descargar el reporte', error);
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Comparación</h1>
          <p className="text-muted-foreground">
            Carga documentos de embarque, valida sus campos y exporta reportes con las discrepancias detectadas.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DocumentUpload onChange={handleUpload} />
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
                <CardDescription>Ejecuta la comparación y exporta resultados.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={handleCompare} className="gap-2" disabled={isComparing || selectedFiles.length < 2}>
                  {isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus className="h-4 w-4" />}
                  {isComparing ? 'Comparando...' : 'Comparar documentos'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDownload('excel')}
                  className="gap-2"
                  disabled={!lastComparisonId || isDownloading === 'excel'}
                >
                  {isDownloading === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isDownloading === 'excel' ? 'Descargando...' : 'Exportar Excel'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDownload('pdf')}
                  className="gap-2"
                  disabled={!lastComparisonId || isDownloading === 'pdf'}
                >
                  {isDownloading === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isDownloading === 'pdf' ? 'Descargando...' : 'Exportar PDF'}
                </Button>
              </CardContent>
              {compareError && (
                <p className="px-6 pb-4 text-sm text-destructive">{compareError}</p>
              )}
            </Card>
            <ComparisonTable documents={documents} data={comparison} />
          </div>
          <div className="space-y-6">
            {historyLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Historial</CardTitle>
                  <CardDescription>Obteniendo comparaciones previas...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando
                </CardContent>
              </Card>
            ) : (
              <HistoryList items={history} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
