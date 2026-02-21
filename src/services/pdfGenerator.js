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

    // Helper to format date
    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Process each sheet
    sheetData.forEach((sheet, sheetIndex) => {
      if (!isFirstPage) {
        doc.addPage();
      }

      // Company Header
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 20, 14);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Regd. Off: 14/1, Nirode Behari Mullick Road, Kolkata - 700 006', 20, 20);
      doc.text('Phone: 033-6535 8154 | E-mail: ybcolcs@yahoo.in', 20, 26);

      const headerY = 36;

      // Train info header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Train No: ${sheet.trainNo}`, 20, headerY);
      doc.text(`Train Name: ${sheet.trainName}`, 105, headerY, { align: 'center' });
      doc.text(`Report Date: ${formatDate(sheet.reportDate)}`, 190, headerY, { align: 'right' });

      // Table start
      const tableStartY = headerY + 10;

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
        fb.feedbackRating ? String(fb.feedbackRating).toUpperCase() : (fb.feedbackText ? 'TEXT' : '')
      ]);

      // Add totals row
      const totalNS1 = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns1) || 0), 0);
      const totalNS2 = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns2) || 0), 0);
      const totalNS3 = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns3) || 0), 0);
      const totalPSI = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.psi) || 0), 0);

      body.push(['TOTAL', '', '', '', '', totalNS1, totalNS2, totalNS3, totalPSI, '']);

      doc.autoTable({
        startY: tableStartY,
        margin: { left: 10, right: 10 },
        head: [[
          'Sr. No.',
          'Feedback No.',
          'Coach',
          'PNR',
          'Mobile No.',
          'NS-1',
          'NS-2',
          'NS-3',
          'PSI',
          'FEEDBACK STATUS'
        ]],
        body,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          valign: 'middle'
        },
        bodyStyles: { fontSize: 9, valign: 'middle', minCellHeight: 12 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 15, fontSize: 8 },
          1: { cellWidth: 25, fontSize: 9 },
          2: { cellWidth: 15, fontSize: 9 },
          3: { cellWidth: 25, fontSize: 9 },
          4: { cellWidth: 25, fontSize: 9 },
          5: { cellWidth: 12, fontSize: 8 },
          6: { cellWidth: 12, fontSize: 8 },
          7: { cellWidth: 12, fontSize: 8 },
          8: { cellWidth: 10, fontSize: 8 },
          9: { cellWidth: 40, fontSize: 9 }
        },
        didDrawCell: (data) => {
          // Highlight total row
          if (data.row.index === sheet.feedbacks.length) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [220, 220, 220];
          }
        }
      });

      // Summary section after table
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (tableStartY + 8);
      let y = finalY + 8;

      const totalCount = sheet.feedbacks.length;
      const psiSum = sheet.feedbacks.reduce((sum, fb) => sum + (parseInt(fb.psi) || 0), 0);
      const percentagePSI = totalCount > 0 ? ((psiSum / totalCount)).toFixed(2) : '0';
      const averagePSI = totalCount > 0 ? psiSum.toFixed(2) : '0';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);

      doc.text('Total feedbacks', 10, y);
      doc.text(totalCount.toString(), 120, y);
      y += 8;

      doc.text('Total No percentage of PSI for the Rake', 10, y);
      doc.text(`${percentagePSI}%`, 120, y);
      y += 8;

      doc.text('Average PSI of Rake for the round trip', 10, y);
      doc.text(averagePSI, 120, y);

      isFirstPage = false;
    });

    // Generate filename with first sheet train info
    const firstSheet = sheetData[0];
    const fileName = `feedbacks_${firstSheet.trainNo}_${new Date(firstSheet.reportDate).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, message: 'PDF generated successfully' };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};
