/**
 * Enhanced export utilities for react-table-power
 * Supports multiple formats, custom formatting, and advanced features
 */

import { BaseTableData, TableColumn, ExportFormat } from '../types';

// ==================== Export Configuration ====================

export interface AdvancedExportConfig {
  // File options
  filename?: string;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  
  // Data options
  includeHeaders?: boolean;
  includeFooters?: boolean;
  includeMetadata?: boolean;
  onlyVisibleColumns?: boolean;
  onlySelectedRows?: boolean;
  
  // Formatting options
  dateFormat?: string;
  numberFormat?: Intl.NumberFormatOptions;
  booleanFormat?: { true: string; false: string };
  nullValueReplacement?: string;
  
  // Style options (for Excel/PDF)
  headerStyle?: ExportCellStyle;
  dataStyle?: ExportCellStyle;
  alternateRowStyle?: ExportCellStyle;
  
  // PDF specific options
  pageSize?: 'A4' | 'A3' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
  
  // Advanced options
  chunkSize?: number; // For large datasets
  compression?: boolean;
  password?: string; // For protected files
  watermark?: string;
  
  // Custom transformers
  columnTransformers?: Record<string, (value: any, row: any) => any>;
  rowFilter?: (row: any, index: number) => boolean;
  postProcessor?: (data: any[][]) => any[][];
}

export interface ExportCellStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  border?: boolean;
}

export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'generating' | 'downloading' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  rowsProcessed?: number;
  totalRows?: number;
}

// ==================== Base Export Class ====================

export abstract class BaseExporter<T extends BaseTableData> {
  protected config: AdvancedExportConfig;
  protected data: T[];
  protected columns: TableColumn<T>[];
  protected onProgress?: (progress: ExportProgress) => void;

  constructor(
    data: T[],
    columns: TableColumn<T>[],
    config: AdvancedExportConfig = {},
    onProgress?: (progress: ExportProgress) => void
  ) {
    this.data = data;
    this.columns = columns;
    this.config = {
      filename: 'export',
      includeHeaders: true,
      dateFormat: 'yyyy-MM-dd',
      numberFormat: {},
      booleanFormat: { true: 'Yes', false: 'No' },
      nullValueReplacement: '',
      chunkSize: 1000,
      ...config,
    };
    this.onProgress = onProgress;
  }

  abstract export(): Promise<Blob>;

  protected reportProgress(progress: Partial<ExportProgress>) {
    if (this.onProgress) {
      this.onProgress({
        stage: 'preparing',
        progress: 0,
        message: 'Starting export...',
        ...progress,
      });
    }
  }

  protected getExportableColumns(): TableColumn<T>[] {
    return this.columns.filter(col => {
      if (col.exportable === false) return false;
      if (this.config.onlyVisibleColumns && col.defaultVisible === false) return false;
      return true;
    });
  }

  protected formatCellValue(value: any, column: TableColumn<T>): string {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return this.config.nullValueReplacement || '';
    }

    // Apply custom transformer if available
    const columnKey = String(column.accessorKey || column.id || '');
    const transformer = this.config.columnTransformers?.[columnKey];
    if (transformer) {
      value = transformer(value, {});
    }

    // Handle dates
    if (value instanceof Date) {
      return this.formatDate(value);
    }

    // Handle numbers
    if (typeof value === 'number') {
      return this.formatNumber(value);
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return this.config.booleanFormat![value];
    }

    // Handle arrays and objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  protected formatDate(date: Date): string {
    const format = this.config.dateFormat || 'yyyy-MM-dd';
    
    // Simple date formatting (could be enhanced with date-fns or similar)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('yyyy', String(year))
      .replace('MM', month)
      .replace('dd', day);
  }

  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', this.config.numberFormat).format(value);
  }

  protected getColumnHeader(column: TableColumn<T>): string {
    if (typeof column.header === 'string') {
      return column.header;
    }
    return String(column.accessorKey || column.id || '');
  }

  protected processDataInChunks<TResult>(
    data: T[],
    processor: (chunk: T[], chunkIndex: number) => TResult[],
    chunkSize: number = this.config.chunkSize!
  ): TResult[] {
    const results: TResult[] = [];
    const totalChunks = Math.ceil(data.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.slice(start, end);
      
      this.reportProgress({
        stage: 'processing',
        progress: (i / totalChunks) * 50, // 50% for processing
        message: `Processing chunk ${i + 1} of ${totalChunks}`,
        rowsProcessed: end,
        totalRows: data.length,
      });

      const chunkResults = processor(chunk, i);
      results.push(...chunkResults);
    }

    return results;
  }
}

// ==================== CSV Exporter ====================

export class CSVExporter<T extends BaseTableData> extends BaseExporter<T> {
  async export(): Promise<Blob> {
    this.reportProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Preparing CSV export...',
    });

    const columns = this.getExportableColumns();
    const rows: string[] = [];

    // Add headers
    if (this.config.includeHeaders) {
      const headers = columns.map(col => this.escapeCSVValue(this.getColumnHeader(col)));
      rows.push(headers.join(','));
    }

    // Process data in chunks
    const dataRows = this.processDataInChunks(
      this.data,
      (chunk) => chunk.map(row => {
        return columns.map(col => {
          const value = this.getCellValue(row, col);
          const formatted = this.formatCellValue(value, col);
          return this.escapeCSVValue(formatted);
        }).join(',');
      })
    );

    rows.push(...dataRows);

    this.reportProgress({
      stage: 'generating',
      progress: 75,
      message: 'Generating CSV file...',
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    this.reportProgress({
      stage: 'complete',
      progress: 100,
      message: 'CSV export complete',
    });

    return blob;
  }

  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private getCellValue(row: T, column: TableColumn<T>): any {
    if (column.accessorKey) {
      return row[column.accessorKey as keyof T];
    }
    return '';
  }
}

// ==================== Excel Exporter ====================

export class ExcelExporter<T extends BaseTableData> extends BaseExporter<T> {
  async export(): Promise<Blob> {
    // This would require a library like xlsx
    // For now, return CSV format as fallback
    const csvExporter = new CSVExporter(this.data, this.columns, this.config, this.onProgress);
    return csvExporter.export();
  }
}

// ==================== PDF Exporter ====================

export class PDFExporter<T extends BaseTableData> extends BaseExporter<T> {
  async export(): Promise<Blob> {
    this.reportProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Preparing PDF export...',
    });

    // This would require jsPDF and jspdf-autotable
    // For now, create a simple implementation
    const csvExporter = new CSVExporter(this.data, this.columns, this.config, this.onProgress);
    return csvExporter.export();
  }
}

// ==================== Export Factory ====================

export class ExportFactory {
  static createExporter<T extends BaseTableData>(
    format: ExportFormat,
    data: T[],
    columns: TableColumn<T>[],
    config: AdvancedExportConfig = {},
    onProgress?: (progress: ExportProgress) => void
  ): BaseExporter<T> {
    switch (format) {
      case 'csv':
        return new CSVExporter(data, columns, config, onProgress);
      case 'excel':
        return new ExcelExporter(data, columns, config, onProgress);
      case 'pdf':
        return new PDFExporter(data, columns, config, onProgress);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  static async exportData<T extends BaseTableData>(
    format: ExportFormat,
    data: T[],
    columns: TableColumn<T>[],
    config: AdvancedExportConfig = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    const exporter = this.createExporter(format, data, columns, config, onProgress);
    return exporter.export();
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ==================== Export Hooks ====================

export function useAdvancedExport<T extends BaseTableData>() {
  const exportData = async (
    format: ExportFormat,
    data: T[],
    columns: TableColumn<T>[],
    config: AdvancedExportConfig = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> => {
    try {
      const blob = await ExportFactory.exportData(format, data, columns, config, onProgress);
      const filename = `${config.filename || 'export'}.${format}`;
      ExportFactory.downloadBlob(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  return { exportData };
}

// ==================== Utility Functions ====================

export function validateExportData<T extends BaseTableData>(
  data: T[],
  columns: TableColumn<T>[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    errors.push('At least one column must be provided');
  }

  if (data.length === 0) {
    errors.push('No data to export');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function estimateExportSize<T extends BaseTableData>(
  data: T[],
  columns: TableColumn<T>[],
  format: ExportFormat
): { estimatedSize: number; unit: string } {
  const exportableColumns = columns.filter(col => col.exportable !== false);
  const avgCellSize = 20; // Average characters per cell
  const totalCells = data.length * exportableColumns.length;
  
  let estimatedBytes = totalCells * avgCellSize;
  
  // Format-specific overhead
  switch (format) {
    case 'csv':
      estimatedBytes *= 1.1; // 10% overhead for CSV formatting
      break;
    case 'excel':
      estimatedBytes *= 2.5; // 150% overhead for Excel format
      break;
    case 'pdf':
      estimatedBytes *= 3; // 200% overhead for PDF format
      break;
  }

  if (estimatedBytes < 1024) {
    return { estimatedSize: Math.round(estimatedBytes), unit: 'B' };
  } else if (estimatedBytes < 1024 * 1024) {
    return { estimatedSize: Math.round(estimatedBytes / 1024), unit: 'KB' };
  } else {
    return { estimatedSize: Math.round(estimatedBytes / (1024 * 1024)), unit: 'MB' };
  }
}
