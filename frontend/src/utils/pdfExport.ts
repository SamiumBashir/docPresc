export interface ExportPdfOptions {
  elementId: string;
  filename: string;
  paperSize?: 'A4' | 'Letter';
}

/**
 * High-performance on-demand PDF exporter.
 * Uses dynamic imports for `jspdf` and `html2canvas` so the 560+ KB library
 * payload is never loaded during initial page visit or route navigation.
 */
export async function exportElementToPdf({
  elementId,
  filename,
  paperSize = 'A4',
}: ExportPdfOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Target printable element #${elementId} not found`);
  }

  // Dynamically load heavy rendering libraries only when requested
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const isLetter = paperSize === 'Letter';
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isLetter ? 'letter' : 'a4',
  });

  const pdfWidth = isLetter ? 215.9 : 210;
  const pdfHeight = isLetter ? 279.4 : 297;

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
