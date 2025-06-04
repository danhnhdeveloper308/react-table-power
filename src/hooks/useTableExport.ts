import { useCallback, useMemo } from 'react';
import { BaseTableData, TableColumn, ExportFormat, ExportConfig } from '../types';
import { getNestedValue } from '../utils';

interface UseTableExportOptions<T extends BaseTableData> {
  data: T[];
  columns: TableColumn<T>[];
  filteredData?: T[];
  filename?: string;
  title?: string;
  exportConfig?: ExportConfig | boolean;  // Add exportConfig parameter
}

interface ExportOptions<T extends BaseTableData = BaseTableData> {
  includeHeaders?: boolean;
  customHeaders?: Record<string, string>;
  dateFormat?: string;
  numberFormat?: string;
  filterData?: (data: T[]) => T[];
  data?: T[];
}

export function useTableExport<T extends BaseTableData>({
  data,
  columns,
  filteredData,
  filename = 'table-export',
  title,
  exportConfig,  // Add exportConfig parameter
}: UseTableExportOptions<T>) {

  // ==================== Helper Functions ====================
  
  /**
   * Get exportable columns (exclude non-exportable columns)
   */
  const exportableColumns = useMemo(() => {
    return columns.filter(col => col.exportable !== false);
  }, [columns]);

  /**
   * Format cell value for export
   */
  const formatCellValue = useCallback((value: any, column: TableColumn<T>, options: ExportOptions<T> = {}): string => {
    if (value === null || value === undefined) return '';
    
    // Handle dates
    if (value instanceof Date) {
      return options.dateFormat ? 
        value.toLocaleDateString('vi-VN') : 
        value.toISOString().split('T')[0];
    }
    
    // Handle numbers
    if (typeof value === 'number') {
      return options.numberFormat ? 
        new Intl.NumberFormat('vi-VN').format(value) : 
        value.toString();
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Có' : 'Không';
    }
    
    // Handle arrays and objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }, []);

  /**
   * Get column header text
   */
  const getColumnHeader = useCallback((column: TableColumn<T>, customHeaders: Record<string, string> = {}): string => {
    const columnId = String(column.id || column.accessorKey || '');
    
    if (customHeaders[columnId]) {
      return customHeaders[columnId];
    }
    
    if (typeof column.header === 'string') {
      return column.header;
    }
    
    return columnId;
  }, []);

  /**
   * Prepare data for export
   */
  const prepareExportData = useCallback((options: ExportOptions<T> = {}) => {
    const { filterData: customFilter, includeHeaders = true, customHeaders = {} } = options;
    
    // Apply custom filter if provided
    const exportData = customFilter ? customFilter(data) : options.data || data;
    
    // Extract data rows
    const rows = exportData.map(row => {
      return exportableColumns.map(column => {
        const value = getNestedValue(row, String(column.accessorKey || column.id || ''));
        return formatCellValue(value, column, options);
      });
    });
    
    // Add headers if requested
    if (includeHeaders) {
      const headers = exportableColumns.map(column => 
        getColumnHeader(column, customHeaders)
      );
      rows.unshift(headers);
    }
    
    return {
      headers: exportableColumns.map(column => getColumnHeader(column, customHeaders)),
      rows,
      data: exportData,
    };
  }, [data, exportableColumns, formatCellValue, getColumnHeader]);

  // ==================== Export Functions ====================
  
  /**
   * Export to CSV
   */
  const exportToCSV = useCallback((options: ExportOptions<T> = {}) => {
    const { rows } = prepareExportData(options);
    
    const csvContent = rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const cellValue = String(cell);
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
          return `"${cellValue.replace(/"/g, '""')}"`;
        }
        return cellValue;
      }).join(',')
    ).join('\n');
    
    // Add BOM for UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    downloadFile(blob, `${filename}.csv`);
  }, [prepareExportData, filename]);

  /**
   * Export to Excel (using simple HTML table method)
   */
  const exportToExcel = useCallback((options: ExportOptions<T> = {}) => {
    const { headers, rows, data: exportData } = prepareExportData(options);
    
    // Create HTML table
    let html = '<table border="1">';
    
    // Add title if provided
    if (title) {
      html += `<tr><td colspan="${headers.length}" style="font-weight: bold; text-align: center; font-size: 16px;">${title}</td></tr>`;
    }
    
    // Add headers
    html += '<tr>';
    headers.forEach(header => {
      html += `<th style="background-color: #f0f0f0; font-weight: bold;">${header}</th>`;
    });
    html += '</tr>';
    
    // Add data rows (skip first row if it contains headers)
    const dataRows = options.includeHeaders !== false ? rows.slice(1) : rows;
    dataRows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</table>';
    
    const blob = new Blob([html], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    downloadFile(blob, `${filename}.xls`);
  }, [prepareExportData, filename, title]);

  /**
   * Export to PDF (basic implementation using print)
   */
  const exportToPDF = useCallback((options: ExportOptions<T> = {}) => {
    const { headers, rows } = prepareExportData(options);
    
    // Create a new window with the table
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title || filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
    `;
    
    if (title) {
      html += `<h1>${title}</h1>`;
    }
    
    html += '<table>';
    
    // Add headers
    html += '<tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr>';
    
    // Add data rows
    const dataRows = options.includeHeaders !== false ? rows.slice(1) : rows;
    dataRows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</table></body></html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [prepareExportData, filename, title]);

  /**
   * Download file helper
   */
  const downloadFile = useCallback((blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []);

  /**
   * Main export function
   */
  const exportData = useCallback((format: ExportFormat, options: ExportOptions<T> = {}) => {
    try {
      switch (format) {
        case 'csv':
          exportToCSV(options);
          break;
        case 'excel':
          exportToExcel(options);
          break;
        case 'pdf':
          exportToPDF(options);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export as ${format}: ${error}`);
    }
  }, [exportToCSV, exportToExcel, exportToPDF]);

  /**
   * Get export preview data
   */
  const getPreviewData = useCallback((options: ExportOptions<T> = {}) => {
    return prepareExportData(options);
  }, [prepareExportData]);

  /**
   * Get available export formats
   */
  const availableFormats: ExportFormat[] = useMemo(() => {
    if (typeof exportConfig === 'object' && exportConfig.formats) {
      return exportConfig.formats;
    }
    return ['csv', 'excel', 'pdf'];
  }, [exportConfig]);

  /**
   * Export selected rows
   */
  const exportSelected = useCallback((format: ExportFormat, selectedRows: T[]) => {
    exportData(format, {
      data: selectedRows
    });
  }, [exportData]);

  /**
   * Export current view (filtered data)
   */
  const exportCurrentView = useCallback((format: ExportFormat) => {
    exportData(format, {
      data: filteredData || data
    });
  }, [exportData, filteredData, data]);

  // Parse exportConfig properties
  const showSelectedOnly = useMemo(() => {
    if (typeof exportConfig === 'object' && exportConfig.showSelectedOnly) {
      return exportConfig.showSelectedOnly;
    }
    return false;
  }, [exportConfig]);

  return {
    exportData,
    exportToCSV,
    exportToExcel,
    exportToPDF,
    getPreviewData,
    availableFormats,
    exportableColumns,
    exportSelected,
    exportCurrentView,
    showSelectedOnly,
  };
}