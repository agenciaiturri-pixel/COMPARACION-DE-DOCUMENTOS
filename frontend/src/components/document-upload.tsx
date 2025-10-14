'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

type DocumentType = 'BILL_OF_LADING' | 'INVOICE' | 'DAM' | 'SENASA' | 'GUIDE' | 'OTHER';

export interface LocalFile {
  id: string;
  name: string;
  type: DocumentType;
  file: File;
}

interface DocumentUploadProps {
  onChange(files: LocalFile[]): void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'BILL_OF_LADING', label: 'Bill of Lading' },
  { value: 'INVOICE', label: 'Factura' },
  { value: 'DAM', label: 'DAM' },
  { value: 'SENASA', label: 'Certificado SENASA' },
  { value: 'GUIDE', label: 'Guía de Remisión' },
  { value: 'OTHER', label: 'Otro' }
];

export function DocumentUpload({ onChange }: DocumentUploadProps) {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType>(DOCUMENT_TYPES[0].value);

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const newFiles: LocalFile[] = Array.from(list).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      type: selectedType,
      file
    }));
    const merged = [...files, ...newFiles];
    setFiles(merged);
    onChange(merged);
  };

  const updateFiles = (updated: LocalFile[]) => {
    setFiles(updated);
    onChange(updated);
  };

  const handleTypeChange = (id: string, type: DocumentType) => {
    const updated = files.map((item) => (item.id === id ? { ...item, type } : item));
    updateFiles(updated);
  };

  const handleRemove = (id: string) => {
    const filtered = files.filter((item) => item.id !== id);
    updateFiles(filtered);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir documentos</CardTitle>
        <CardDescription>Carga múltiples documentos para comparar sus campos clave.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="document-type">
            Tipo de documento
          </label>
          <select
            id="document-type"
            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as DocumentType)}
          >
            {DOCUMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Input
            id="file-input"
            type="file"
            multiple
            onChange={(event) => handleFiles(event.target.files)}
            className="cursor-pointer"
          />
          <Button type="button" onClick={() => document.getElementById('file-input')?.click()}>
            Seleccionar archivos
          </Button>
        </div>
        <ul className="space-y-2 text-sm">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-2 rounded-md bg-muted/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-medium break-all">{file.name}</p>
                <label className="flex items-center gap-2 text-xs text-muted-foreground" htmlFor={`type-${file.id}`}>
                  Tipo
                  <select
                    id={`type-${file.id}`}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value={file.type}
                    onChange={(event) => handleTypeChange(file.id, event.target.value as DocumentType)}
                  >
                    {DOCUMENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(file.id)} aria-label="Quitar documento">
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        {!files.length && <p className="text-xs text-muted-foreground">Selecciona documentos en PDF, CSV, Excel o Word.</p>}
      </CardContent>
    </Card>
  );
}
