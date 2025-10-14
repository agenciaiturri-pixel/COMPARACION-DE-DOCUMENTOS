'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ComparisonField {
  field: string;
  label: string;
  values: Record<string, string | number | null>;
  status: 'MATCH' | 'DIFFERENT' | 'MISSING';
  critical?: boolean;
}

interface ComparisonTableProps {
  documents: { id: string; name: string }[];
  data: ComparisonField[];
}

const STATUS_COLORS: Record<ComparisonField['status'], string> = {
  MATCH: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100',
  DIFFERENT: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-100',
  MISSING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100'
};

type FilterKey = ComparisonField['status'] | 'CRITICAL';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'MATCH', label: 'Coincidencias' },
  { key: 'DIFFERENT', label: 'Diferencias' },
  { key: 'MISSING', label: 'Faltantes' },
  { key: 'CRITICAL', label: 'Críticos' }
];

type EnhancedRow = ComparisonField & {
  normalizedValues: Map<string, string>;
  majorityValue: string | null;
};

const normalizeValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
};

export function ComparisonTable({ documents, data }: ComparisonTableProps) {
  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState<FilterKey[]>([]);

  const enhancedRows = useMemo<EnhancedRow[]>(() => {
    return data.map((row) => {
      const normalizedValues = new Map<string, string>();
      const occurrences = new Map<string, number>();

      Object.entries(row.values).forEach(([id, value]) => {
        const normalized = normalizeValue(value);
        normalizedValues.set(id, normalized);
        if (normalized) {
          occurrences.set(normalized, (occurrences.get(normalized) ?? 0) + 1);
        }
      });

      let majorityValue: string | null = null;
      let maxCount = 0;
      occurrences.forEach((count, value) => {
        if (count > maxCount) {
          majorityValue = value;
          maxCount = count;
        }
      });

      return {
        ...row,
        normalizedValues,
        majorityValue
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const statusFilters = filters.filter((filter) => filter !== 'CRITICAL') as ComparisonField['status'][];
    const criticalFilter = filters.includes('CRITICAL');

    return enhancedRows.filter((row) => {
      if (term && !row.field.toLowerCase().includes(term) && !row.label.toLowerCase().includes(term)) {
        return false;
      }

      if (statusFilters.length && !statusFilters.includes(row.status)) {
        return false;
      }

      if (criticalFilter && !row.critical) {
        return false;
      }

      return true;
    });
  }, [enhancedRows, search, filters]);

  const toggleFilter = (filter: FilterKey) => {
    setFilters((prev) => {
      const exists = prev.includes(filter);
      if (exists) {
        return prev.filter((item) => item !== filter);
      }
      return [...prev, filter];
    });
  };

  const resolveCellStatus = (row: EnhancedRow, documentId: string): ComparisonField['status'] => {
    const normalized = row.normalizedValues.get(documentId) ?? '';
    if (!normalized) {
      return 'MISSING';
    }

    if (row.status === 'MISSING') {
      return 'MATCH';
    }

    if (row.status !== 'DIFFERENT') {
      return row.status;
    }

    if (!row.majorityValue) {
      return 'DIFFERENT';
    }

    return normalized === row.majorityValue ? 'MATCH' : 'DIFFERENT';
  };

  if (!documents.length || !data.length) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-background/40 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Aún no hay resultados</p>
        <p>Sube documentos y ejecuta una comparación para visualizar coincidencias y discrepancias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar campo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const active = filters.includes(filter.key);
              return (
                <Button
                  key={filter.key}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  onClick={() => toggleFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn('h-3 w-3 rounded-full', 'bg-emerald-500')} /> Coincidencia
          <span className={cn('h-3 w-3 rounded-full', 'bg-rose-500')} /> Diferencia
          <span className={cn('h-3 w-3 rounded-full', 'bg-amber-500')} /> Faltante
        </div>
      </div>
      <Table>
        <TableCaption>Comparación dinámica de campos clave.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Campo</TableHead>
            {documents.map((document) => (
              <TableHead key={document.id} className="min-w-[180px]">
                {document.name}
              </TableHead>
            ))}
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow key={row.field} className="align-top">
              <TableCell className="font-medium capitalize">{row.label}</TableCell>
              {documents.map((document) => {
                const cellStatus = resolveCellStatus(row, document.id);
                const displayValue = row.values[document.id];
                return (
                  <TableCell key={document.id}>
                    <div
                      className={cn('rounded-md px-3 py-2 text-sm shadow-sm transition-colors', STATUS_COLORS[cellStatus])}
                    >
                      {displayValue === null || displayValue === undefined || displayValue === '' ? '—' : displayValue}
                    </div>
                  </TableCell>
                );
              })}
              <TableCell className="space-x-2">
                <Badge variant={row.status === 'MATCH' ? 'success' : row.status === 'MISSING' ? 'warning' : 'destructive'}>
                  {row.status === 'MATCH' ? 'Coincide' : row.status === 'MISSING' ? 'Faltante' : 'Diferente'}
                </Badge>
                {row.critical && <Badge variant="destructive">Crítico</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
