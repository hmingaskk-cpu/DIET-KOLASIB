"use client";

export const exportToCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const keys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
  const headerRow = headers ? headers.map(h => h.label).join(',') : keys.join(',');

  const csvContent = [
    headerRow,
    ...data.map(row =>
      keys
        .map(key => {
          const value = row[key];
          // Handle null/undefined values and escape commas/quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return `"${stringValue.replace(/"/g, '""')}"`; // Escape double quotes and wrap in quotes
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};