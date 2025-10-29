(function() {
  function escapeCell(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/"/g, '""');
  }

  window.CSVExporter = {
    exportTable: function(table, filename = 'export.csv') {
      if (!table) return;
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const csvRows = [];
      csvRows.push(['S/N', 'Article Title', 'Views', 'Reads', 'Read Rate', 'Earnings'].map(h => `"${h}"`).join(','));

      rows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll('td'));
        if (!cells.length) return;

        const sn = (cells[0]?.textContent || '').trim();
        const title = (cells[1]?.querySelector('.title-text')?.textContent || cells[1]?.textContent || '').trim();
        const views = (cells[2]?.textContent || '').trim();
        const readsCell = (cells[3]?.textContent || '').trim();
        let reads = readsCell;
        let rate = '';
        const rateMatch = readsCell.match(/\(([^)]+)\)/);
        if (rateMatch) {
          rate = rateMatch[1];
          reads = readsCell.replace(/\s*\([^)]*\)\s*/, '').trim();
        }
        const earnings = (cells[4]?.textContent || '').trim();

        csvRows.push([
          sn,
          `"${escapeCell(title)}"`,
          `"${escapeCell(views)}"`,
          `"${escapeCell(reads)}"`,
          `"${escapeCell(rate)}"`,
          `"${escapeCell(earnings)}"`
        ].join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };
})();
