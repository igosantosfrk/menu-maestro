export const exportCSV = (data: any[], filename: string, columns: { key: string; label: string; format?: (v: any, row?: any) => string }[]) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const rawVal = c.key.includes('.') ? c.key.split('.').reduce((o: any, k: string) => o?.[k], row) : row[c.key];
      const val = c.format ? c.format(rawVal, row) : rawVal;
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? '"' + str.replace(/"/g, '""') + '"' : str;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const formatDateBR = (d: string | null | undefined): string => {
  if (!d) return '';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  const hours = String(dt.getHours()).padStart(2, '0');
  const minutes = String(dt.getMinutes()).padStart(2, '0');
  return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
};

export const formatDateBRShort = (d: string | null | undefined): string => {
  if (!d) return '';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  return day + '/' + month + '/' + year;
};

export const formatNum = (v: number | null | undefined): string => {
  if (v == null) return '0';
  return Number(v).toFixed(2).replace('.', ',');
};
