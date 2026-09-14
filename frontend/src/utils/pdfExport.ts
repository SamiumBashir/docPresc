export type PdfExportStage =
  | 'PDF_PREPARE_ERROR'
  | 'PDF_CANVAS_ERROR'
  | 'PDF_QR_ERROR'
  | 'PDF_GENERATION_ERROR'
  | 'PDF_DOWNLOAD_ERROR';

export class PdfExportError extends Error {
  public readonly stage: PdfExportStage;
  public readonly originalError?: any;

  constructor(message: string, stage: PdfExportStage, originalError?: any) {
    super(message);
    this.name = 'PdfExportError';
    this.stage = stage;
    this.originalError = originalError;
  }
}

export interface ExportPdfOptions {
  elementId: string;
  filename: string;
  paperSize?: 'A4' | 'Letter';
}

/**
 * High-performance on-demand PDF exporter with staged error handling.
 * Uses dynamic imports for `jspdf` and `html2canvas` so the 560+ KB library
 * payload is never loaded during initial page visit or route navigation.
 */
export async function exportElementToPdf({
  elementId,
  filename,
  paperSize = 'A4',
}: ExportPdfOptions): Promise<void> {
  // Stage 1: Element & Environment Preparation
  const element = document.getElementById(elementId);
  if (!element) {
    throw new PdfExportError(
      `Printable element #${elementId} could not be located in the current view.`,
      'PDF_PREPARE_ERROR'
    );
  }

  let jsPDF: any;
  let html2canvas: any;

  try {
    const [jspdfModule, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    jsPDF = jspdfModule.default;
    html2canvas = html2canvasModule.default;
  } catch (error: any) {
    throw new PdfExportError(
      'Failed to load PDF generation engine. Please check your internet connection and try again.',
      'PDF_PREPARE_ERROR',
      error
    );
  }

  // Stage 2: Canvas Rasterization
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Rendered canvas has zero dimensions');
    }
  } catch (error: any) {
    throw new PdfExportError(
      'Failed to capture prescription canvas layout. Please ensure all assets are loaded.',
      'PDF_CANVAS_ERROR',
      error
    );
  }

  // Stage 3: PDF Document Generation
  let pdf: any;
  let imgData: string;
  try {
    imgData = canvas.toDataURL('image/jpeg', 0.98);
    const isLetter = paperSize === 'Letter';

    pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isLetter ? 'letter' : 'a4',
    });

    const pdfWidth = isLetter ? 215.9 : 210;
    const pdfHeight = isLetter ? 279.4 : 297;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  } catch (error: any) {
    throw new PdfExportError(
      'Failed to construct PDF document format.',
      'PDF_GENERATION_ERROR',
      error
    );
  }

  // Stage 4: File Download & Delivery
  try {
    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(finalFilename);
  } catch (error: any) {
    throw new PdfExportError(
      'Failed to download the generated PDF file to your device.',
      'PDF_DOWNLOAD_ERROR',
      error
    );
  }
}
