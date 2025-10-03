import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface HistoryDocument {
  id: string;
  name: string;
  type?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  documents: HistoryDocument[];
  hasCriticalAlerts: boolean;
}

interface HistoryListProps {
  items: HistoryEntry[];
}

export function HistoryList({ items }: HistoryListProps) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Aún no se han registrado comparaciones.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Historial de comparaciones</CardTitle>
        <CardDescription>Consulta rápidamente las evaluaciones anteriores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Comparación #{item.id.slice(0, 6)}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              {item.hasCriticalAlerts ? (
                <Badge variant="destructive">Alerta crítica</Badge>
              ) : (
                <Badge variant="secondary">Sin alertas</Badge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Documentos: {item.documents.map((doc) => doc.name).join(', ')}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
