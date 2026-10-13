// PDF export utilities and print formatting standards for DocPresc prescriptions
export const printPrescription = () => {
  window.print();
};

export const downloadPrescriptionPDF = async (elementId: string, filename = 'prescription.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
};
