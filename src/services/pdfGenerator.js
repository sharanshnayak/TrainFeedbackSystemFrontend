import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate consolidated feedback PDF with multiple sheets on separate pages
 * @param {Array} sheetData - Array of sheet objects with feedbacks
 */
export const generateConsolidatedPDF = (sheetData) => {
  try {
    if (!sheetData || sheetData.length === 0) {
      throw new Error('No sheet data to generate PDF');
    }

    const doc = new jsPDF();
    let isFirstPage = true;

    // Helper to format date - backend already sends dd/mm/yyyy format
    const formatDate = (dateStr) => {
      // dateStr is already in dd/mm/yyyy format from backend, use it directly
      return dateStr;
    };

    // Process each sheet
    sheetData.forEach((sheet, sheetIndex) => {
      if (!isFirstPage) {
        doc.addPage();
      }

      // Company Header (reduced size)
      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 15, 10);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Regd. Off: 14/1, Nirode Behari Mullick Road, Kolkata - 700 006', 15, 15);
      doc.text('Phone: 033-6535 8154 | E-mail: ybcolcs@yahoo.in', 15, 18.5);

      const headerY = 25;

      // Train info header (compact)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Train No: ${sheet.trainNo}`, 15, headerY);
      doc.text(`Train Name: ${sheet.trainName}`, 100, headerY, { align: 'center' });
      doc.text(`Report Date: ${formatDate(sheet.reportDate)}`, 185, headerY, { align: 'right' });

      // Table start
      const tableStartY = headerY + 4;

      const body = sheet.feedbacks.map((fb, idx) => [
        idx + 1,
        fb.feedbackNo ?? '',
        fb.coachNo ?? '',
        fb.pnr ?? '',
        fb.mobile ?? '',
        fb.ns1 ?? '',
        fb.ns2 ?? '',
        fb.ns3 ?? '',
        fb.psi ?? '',
        fb.feedbackRating ?? 'NA'
      ]);

      // Add totals row
      const totalNS1 = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns1) || 0), 0);
      const totalNS2 = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns2) || 0), 0);
      const totalNS3 = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns3) || 0), 0);
      const totalPSI = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.psi) || 0), 0);

      // Create footer row for totals
      const footerRow = [['Total', '', '', '', '', totalNS1, totalNS2, totalNS3, totalPSI, '']];

      doc.autoTable({
        startY: tableStartY,
        margin: { left: 17, right: 12, bottom: 30 },
        head: [[
          'Sr. No.',
          'Feedback No.',
          'Coach',
          'PNR',
          'Mobile',
          'NS-1',
          'NS-2',
          'NS-3',
          'PSI',
          'Feedback Status'
        ]],
        body,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          valign: 'middle',
          halign: 'center',
          cellPadding: 2
        },
        bodyStyles: { fontSize: 8.5, valign: 'middle', halign: 'center', cellPadding: 1.5, lineColor: 200 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 11, halign: 'center' },
          6: { cellWidth: 11, halign: 'center' },
          7: { cellWidth: 11, halign: 'center' },
          8: { cellWidth: 10, halign: 'center' },
          9: { cellWidth: 30, halign: 'center' }
        },
        foot: footerRow,
        footStyles: {
          fillColor: [248, 248, 248],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          valign: 'middle',
          cellPadding: 2
        }
      });

      // Summary section after table (compact)
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (tableStartY + 8);
      let y = finalY + 9;

      const totalCount = sheet.feedbacks.length;
      const psiSum = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.psi) || 0), 0);
      const percentagePSI = totalCount > 0 ? ((psiSum / totalCount)).toFixed(2) : '0';
      const averagePSI = totalCount > 0 ? psiSum.toFixed(2) : '0';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      doc.text('Total Feedbacks:', 25, y);
      doc.text(totalCount.toString(), 85, y);
      y += 5;

      doc.text('Total No Percentage of PSI for the Rake:', 25, y);
      doc.text(`${percentagePSI}%`, 85, y);
      y += 5;

      doc.text('Average PSI of Rake for the Round Trip:', 25, y);
      doc.text(averagePSI, 85, y);

      isFirstPage = false;
    });

    // Generate filename with first sheet train info
    const firstSheet = sheetData[0];
    const fileName = `feedbacks_${firstSheet.trainNo}_${firstSheet.reportDate}.pdf`;
    doc.save(fileName);

    return { success: true, message: 'PDF generated successfully' };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};
