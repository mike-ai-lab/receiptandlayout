
import { jsPDF, TextOptionsLight } from 'jspdf';
import type { QuotationStructure, QuotationScopeItemStructure } from '../types';
import { UNIT_SORT_ORDER } from '../constants';

const FONT_REGULAR = 'helvetica';
const FONT_BOLD = 'helvetica';

const PAGE_MARGIN = 15;
const FOOTER_HEIGHT = 15;
const LINE_HEIGHT_MULTIPLIER = 1.3;
const TABLE_CELL_PADDING = 2;
const TABLE_LINE_HEIGHT_MULTIPLIER = 1.2;

interface TextSegment {
  text: string;
  fontStyle?: 'normal' | 'bold';
  fontSize?: number;
}

function addWrappedText(
  doc: jsPDF,
  textSegments: string | TextSegment | (string | TextSegment)[],
  x: number,
  y: number,
  maxWidth: number,
  options?: TextOptionsLight & { defaultFontSize?: number, defaultFontStyle?: 'normal' | 'bold' }
): number {
  const pageHeight = doc.internal.pageSize.height;
  let currentY = y;
  const defaultFontSize = options?.defaultFontSize || doc.getFontSize();
  const defaultFontStyle = options?.defaultFontStyle || 'normal';

  const segmentsArray = Array.isArray(textSegments) ? textSegments : [textSegments];

  segmentsArray.forEach(segmentInput => {
    let text: string;
    let fontSize = defaultFontSize;
    let fontStyle = defaultFontStyle;

    if (typeof segmentInput === 'string') {
      text = segmentInput;
    } else {
      text = segmentInput.text;
      fontSize = segmentInput.fontSize || defaultFontSize;
      fontStyle = segmentInput.fontStyle || defaultFontStyle;
    }

    doc.setFontSize(fontSize);
    doc.setFont(FONT_REGULAR, fontStyle);

    const lines = doc.splitTextToSize(text, maxWidth);

    lines.forEach((line: string) => {
      if (currentY + (fontSize / doc.internal.scaleFactor * TABLE_LINE_HEIGHT_MULTIPLIER) > pageHeight - PAGE_MARGIN - FOOTER_HEIGHT) {
        doc.addPage();
        currentY = PAGE_MARGIN;
      }
      doc.text(line, x, currentY, options);
      currentY += (fontSize / doc.internal.scaleFactor * LINE_HEIGHT_MULTIPLIER);
    });
  });
  return currentY;
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  doc.setFontSize(8);
  doc.setFont(FONT_REGULAR, 'normal');
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - PAGE_MARGIN / 2, { align: 'right', baseline: 'bottom' });
}

const sortQuotationItemsByUnitPdf = (items: QuotationScopeItemStructure[]): QuotationScopeItemStructure[] => {
  return [...items].sort((a, b) => {
    // Primary sort: category
    const categoryOrder = ['painting', 'cladding', 'facade_element', 'other'];
    const indexCatA = categoryOrder.indexOf(a.category);
    const indexCatB = categoryOrder.indexOf(b.category);

    if (indexCatA !== indexCatB) {
        if (indexCatA !== -1 && indexCatB !== -1) return indexCatA - indexCatB;
        if (indexCatA !== -1) return -1; // known categories first
        if (indexCatB !== -1) return 1;
        return a.category.localeCompare(b.category); // alphabetically for unknown categories
    }
    
    // Secondary sort: unitOfMeasure
    const unitA = a.unitOfMeasure?.toUpperCase();
    const unitB = b.unitOfMeasure?.toUpperCase();
    const indexA = UNIT_SORT_ORDER.indexOf(unitA);
    const indexB = UNIT_SORT_ORDER.indexOf(unitB);

    if (indexA !== -1 && indexB !== -1) {
      if (indexA !== indexB) return indexA - indexB;
    } else if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    } else if (unitA && unitB) {
      if (unitA.localeCompare(unitB) !== 0) return unitA.localeCompare(unitB);
    } else if (unitA) {
      return -1;
    } else if (unitB) {
      return 1;
    }
    
    // Tertiary sort: ID (original order for items of same category & unit)
    return String(a.id).localeCompare(String(b.id));
  });
};


export const generateQuotationPdf = async (
  quotation: QuotationStructure,
  baseFileName: string,
  outputType?: 'datauristring' | 'blob'
): Promise<void | string | Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const contentWidth = doc.internal.pageSize.width - (PAGE_MARGIN * 2);
      let yPos = PAGE_MARGIN;

      doc.setFont(FONT_REGULAR, 'normal');
      doc.setFontSize(9);

      let leftY = yPos;
      leftY = addWrappedText(doc, quotation.companyInfo.address, PAGE_MARGIN, leftY, contentWidth / 2 - PAGE_MARGIN / 2, { defaultFontSize: 9});
      doc.text(`Phone: ${quotation.companyInfo.phone}`, PAGE_MARGIN, leftY);
      leftY += 4;
      doc.text(`Email: ${quotation.companyInfo.email}`, PAGE_MARGIN, leftY);
      leftY += 4;

      let rightY = yPos;
      doc.text(`Date: ${quotation.clientInfo.date || '[Quotation Date]'}`, doc.internal.pageSize.width - PAGE_MARGIN, rightY, { align: 'right' });
      rightY += 4;
      doc.text(`Project ID: ${quotation.clientInfo.projectId || '[Project ID]'}`, doc.internal.pageSize.width - PAGE_MARGIN, rightY, { align: 'right' });
      rightY += 4;

      yPos = Math.max(leftY, rightY);
      
      doc.setLineWidth(0.2);
      doc.line(PAGE_MARGIN, yPos, doc.internal.pageSize.width - PAGE_MARGIN, yPos);
      yPos += 7;

      doc.setFont(FONT_BOLD, 'bold');
      doc.setFontSize(10);
      doc.text("Client:", PAGE_MARGIN, yPos);
      yPos += 5;
      doc.setFont(FONT_REGULAR, 'normal');
      yPos = addWrappedText(doc, quotation.clientInfo.name || '[Client Name]', PAGE_MARGIN, yPos, contentWidth / 2, { defaultFontSize: 10 });
      yPos = addWrappedText(doc, quotation.clientInfo.address || '[Client Address]', PAGE_MARGIN, yPos, contentWidth / 2, { defaultFontSize: 10 });
      yPos += 4;

      doc.setLineWidth(0.2);
      doc.line(PAGE_MARGIN, yPos, doc.internal.pageSize.width - PAGE_MARGIN, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont(FONT_REGULAR, 'normal');
      yPos = addWrappedText(doc, quotation.introductionText, PAGE_MARGIN, yPos, contentWidth, { defaultFontSize: 10 });
      yPos += 7;

      doc.setFont(FONT_BOLD, 'bold');
      doc.setFontSize(11);
      doc.text("Scope of Work:", PAGE_MARGIN, yPos);
      yPos += 7;

      const tableHeaders = ["ID", "Description (Category)", "Qty / Unit", "Material/Spec", "Details (Page/Dim.)", "Unit Price ($)", "Total Price ($)"];
      const colWidths = [
        contentWidth * 0.05, // ID
        contentWidth * 0.30, // Description (Category)
        contentWidth * 0.13, // Qty / Unit
        contentWidth * 0.15, // Material/Spec (was Finish)
        contentWidth * 0.15, // Details (Page/Dim.)
        contentWidth * 0.11, // Unit Price ($)
        contentWidth * 0.11  // Total Price ($)
      ];

      const drawTableHeader = (currentY: number) => {
        doc.setFillColor(220, 220, 220);
        doc.rect(PAGE_MARGIN, currentY, contentWidth, 8, 'F');
        doc.setFont(FONT_BOLD, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        let currentX = PAGE_MARGIN;
        tableHeaders.forEach((header, i) => {
          let align: 'left' | 'center' = 'left';
          if (i === 0 || i === 2 || i === 5 || i === 6) align = 'center';
          
          let textX = currentX + TABLE_CELL_PADDING;
          if (align === 'center') textX = currentX + colWidths[i] / 2;
          
          doc.text(header, textX , currentY + 5, { align: align });
          currentX += colWidths[i];
        });
        return currentY + 8;
      };

      yPos = drawTableHeader(yPos);
      let tableContentStartY = yPos;

      const sortedPdfItems = sortQuotationItemsByUnitPdf(quotation.items);
      let currentCategory = "";

      sortedPdfItems.forEach((item: QuotationScopeItemStructure) => {
        doc.setFont(FONT_REGULAR, 'normal');
        doc.setFontSize(8);

        // Add category header if it changes
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            if (yPos + 6 > doc.internal.pageSize.height - PAGE_MARGIN - FOOTER_HEIGHT) { // Check space for category header
                doc.addPage();
                yPos = PAGE_MARGIN;
                yPos = drawTableHeader(yPos); // Redraw table header on new page
                tableContentStartY = yPos;
            }
            doc.setFont(FONT_BOLD, 'bold');
            doc.setFontSize(9);
            doc.setFillColor(240, 240, 240); // Light grey for category header
            doc.rect(PAGE_MARGIN, yPos, contentWidth, 6, 'F');
            doc.text(currentCategory.toUpperCase().replace('_', ' ') + " WORKS", PAGE_MARGIN + TABLE_CELL_PADDING, yPos + 4);
            yPos += 6;
            doc.setFont(FONT_REGULAR, 'normal');
            doc.setFontSize(8);
        }

        const descriptionString = `${item.description}`; // Category is now a header
        const detailsString = `Dim: ${item.dimensions || 'N/A'}\nPage: ${item.pageRef || 'N/A'}`;
        const quantityString = `${item.quantity || 'N/A'}${item.unitOfMeasure ? ` (${item.unitOfMeasure})` : ''}`;

        const rowDataStrings = [
          String(item.id),
          descriptionString,
          quantityString,
          item.materialOrFinish || 'N/A', // Was item.finish
          detailsString,
          item.unitPrice || '$0.00',
          item.price || '$0.00'
        ];

        let maxLinesInRow = 0;
        const cellLinesCache: string[][] = [];

        rowDataStrings.forEach((text, i) => {
            const lines = doc.splitTextToSize(text, colWidths[i] - (TABLE_CELL_PADDING * 2));
            cellLinesCache.push(lines);
            if (lines.length > maxLinesInRow) {
                maxLinesInRow = lines.length;
            }
        });

        const rowHeight = Math.max(maxLinesInRow * (8 / doc.internal.scaleFactor * TABLE_LINE_HEIGHT_MULTIPLIER), 6) + (TABLE_CELL_PADDING * 1.5); 

        if (yPos + rowHeight > doc.internal.pageSize.height - PAGE_MARGIN - FOOTER_HEIGHT) {
          let tempX = PAGE_MARGIN;
          doc.setLineWidth(0.1);
          for(let i=0; i <= colWidths.length; i++) {
            doc.line(tempX, tableContentStartY - (currentCategory ? 14 : 8), tempX, yPos); // Adjust startY if category header was drawn
            if (i < colWidths.length) tempX += colWidths[i];
          }
          doc.addPage();
          yPos = PAGE_MARGIN;
          yPos = drawTableHeader(yPos);
          tableContentStartY = yPos;
          currentCategory = ""; // Reset category on new page, it will be redrawn if needed
        }

        let currentX = PAGE_MARGIN;
        cellLinesCache.forEach((lines, i) => {
            let textY = yPos + TABLE_CELL_PADDING + ( (8 / doc.internal.scaleFactor) / 2); 
            lines.forEach((line, lineIndex) => {
                let align: 'left' | 'right' | 'center' = 'left';
                if (i === 0 || i === 2) align = 'center';
                if (i === 5 || i === 6) align = 'right';

                let textX = currentX + TABLE_CELL_PADDING;
                if (align === 'right') textX = currentX + colWidths[i] - TABLE_CELL_PADDING;
                if (align === 'center') textX = currentX + colWidths[i] / 2;

                doc.text(line, textX, textY + (lineIndex * (8 / doc.internal.scaleFactor * TABLE_LINE_HEIGHT_MULTIPLIER)), {align: align});
            });
            currentX += colWidths[i];
        });

        doc.setLineWidth(0.1);
        doc.line(PAGE_MARGIN, yPos + rowHeight, doc.internal.pageSize.width - PAGE_MARGIN, yPos + rowHeight);
        yPos += rowHeight;
      });

      let finalTableX = PAGE_MARGIN;
      doc.setLineWidth(0.1);
      // Adjust startY of vertical lines if the first item had a category header
      const verticalLineStartY = tableContentStartY - (sortedPdfItems.length > 0 && sortedPdfItems[0].category ? 14 : 8);
      for(let i=0; i <= colWidths.length; i++) {
        doc.line(finalTableX, verticalLineStartY, finalTableX, yPos);
        if (i < colWidths.length) finalTableX += colWidths[i];
      }
      yPos += 5;

      const totalsXLabel = doc.internal.pageSize.width - PAGE_MARGIN - 70;
      const totalsXValue = doc.internal.pageSize.width - PAGE_MARGIN - 5;

      const addTotalRow = (label: string, value: string, isBold: boolean = false, isLarge: boolean = false) => {
        if (yPos + (isLarge ? 8 : 6) > doc.internal.pageSize.height - PAGE_MARGIN - FOOTER_HEIGHT) { doc.addPage(); yPos = PAGE_MARGIN; }
        doc.setFont(FONT_REGULAR, isBold || isLarge ? 'bold' : 'normal');
        doc.setFontSize(isLarge ? 11 : 9);
        doc.text(label, totalsXLabel, yPos, {align: 'left'});
        doc.setFont(FONT_REGULAR, isBold || isLarge ? 'bold' : 'normal');
        doc.text(value, totalsXValue, yPos, {align: 'right'});
        yPos += (isLarge ? 7 : 5);
      };

      if (quotation.subtotal) {
        addTotalRow("Subtotal:", quotation.subtotal);
      }
      if (quotation.taxAmount) {
        addTotalRow("Tax:", quotation.taxAmount);
      }
      yPos += 2;
      if (quotation.grandTotal) {
        addTotalRow("TOTAL ESTIMATED PRICE:", quotation.grandTotal, true, true);
      }
      yPos += 7;

      if (yPos + 10 > doc.internal.pageSize.height - PAGE_MARGIN - FOOTER_HEIGHT) { doc.addPage(); yPos = PAGE_MARGIN; }
      doc.setFont(FONT_BOLD, 'bold');
      doc.setFontSize(10);
      doc.text("Terms and Conditions:", PAGE_MARGIN, yPos);
      yPos += 5;
      doc.setFont(FONT_REGULAR, 'normal');
      doc.setFontSize(9);
      quotation.termsAndConditions.forEach(term => {
        yPos = addWrappedText(doc, `- ${term}`, PAGE_MARGIN, yPos, contentWidth, { defaultFontSize: 9 });
        yPos += 1;
      });
      yPos += 7;

      if (yPos + 10 > doc.internal.pageSize.height - PAGE_MARGIN - FOOTER_HEIGHT) { doc.addPage(); yPos = PAGE_MARGIN; }
      doc.setFont(FONT_REGULAR, 'normal');
      doc.setFontSize(10);
      yPos = addWrappedText(doc, quotation.conclusionText, PAGE_MARGIN, yPos, contentWidth, { defaultFontSize: 10 });

      const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : doc.internal.pages.length;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawPageFooter(doc, i, pageCount);
      }

      if (outputType === 'datauristring') {
        resolve(doc.output('datauristring'));
      } else if (outputType === 'blob') {
        resolve(doc.output('blob'));
      } else {
        doc.save(`${baseFileName}_Quotation.pdf`);
        resolve();
      }

    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};
