import { jsPDF } from 'jspdf';
import type { ReceiptDetails } from './types'; // Updated path

// Font configuration
const FONT_EN_FAMILY = 'Inter'; // English font
const FONT_EN_REGULAR_FILE = 'Inter-Regular.ttf';
const FONT_EN_BOLD_FILE = 'Inter-Bold.ttf';

const FONT_AR_FAMILY = 'NotoKufiArabic'; // Arabic font
const FONT_AR_REGULAR_FILE = 'NotoKufiArabic-Regular.ttf';
const FONT_AR_BOLD_FILE = 'NotoKufiArabic-Bold.ttf';

// Try multiple font paths for better deployment compatibility
const FONT_PATHS = [
    '/fonts/', // Development and some deployments
    './fonts/', // Relative path
    'fonts/', // Alternative relative path
    'https://elegant-naiad-f799e7.netlify.app/fonts/', // Direct Netlify URL as fallback
];

// Helper to load a font file, convert to base64, and add to VFS
const loadAndRegisterFont = async (doc: jsPDF, fontFileName: string, fontFamilyName: string, fontWeight: 'normal' | 'bold'): Promise<boolean> => {
    // Try each font path until one works
    for (const fontPath of FONT_PATHS) {
        try {
            const fontUrl = `${fontPath}${fontFileName}`;
            console.log(`Attempting to load font from: ${fontUrl}`);
            
            const response = await fetch(fontUrl);
            if (!response.ok) {
                console.warn(`Failed to fetch font ${fontFileName} from ${fontUrl}: ${response.statusText}. Status: ${response.status}`);
                continue; // Try next path
            }
            
            const fontBuffer = await response.arrayBuffer();
            
            let binary = '';
            const bytes = new Uint8Array(fontBuffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = btoa(binary);

            doc.addFileToVFS(fontFileName, base64Font);
            doc.addFont(fontFileName, fontFamilyName, fontWeight);
            console.log(`Successfully loaded font: ${fontFileName} from ${fontUrl}`);
            return true;
        } catch (error) {
            console.warn(`Error loading font ${fontFileName} from ${fontPath}:`, error);
            continue; // Try next path
        }
    }
    
    console.error(`Failed to load font ${fontFileName} from all attempted paths`);
    return false;
};

const LOGO_URL = "https://hbslewdkkgwsaohjyzak.supabase.co/storage/v1/object/public/tkr//logo.png";

// Adjusted constants for larger text & single page fit
const PAGE_MARGIN_Y = 12; 

const SP_LOGO_HEIGHT = 12; 
const SP_SPACING_AFTER_LOGO = 4; // Adjusted for receipt number

const SP_RECEIPT_NUMBER_FONT_SIZE = 8;
const SP_SPACING_AFTER_RECEIPT_NUMBER = 4; // Space after receipt number line


const SP_HEADER_MAIN_FONT_SIZE = 24; 
const SP_SPACING_AFTER_MAIN_HEADER = 7; 
const SP_HEADER_SUB_FONT_SIZE = 14; 
const SP_SPACING_AFTER_SUB_HEADER = 6; 
const SP_SPACING_AFTER_HEADER_LINE = 6; 

const SP_ROW_HEIGHT = 9.5; 
const SP_ROW_VALUE_FONT_SIZE = 10; 
const SP_ROW_LABEL_FONT_SIZE = 10; 
const TEXT_ON_LINE_OFFSET = -0.7; 

const SP_FOR_SECTION_FONT_SIZE = 10; 
const SP_SPACING_AFTER_FOR_SECTION = 6; 

const SP_SECTION_HEADER_FONT_SIZE = 10.5; 
const SP_SPACING_BEFORE_SECTION_HEADER_TEXT = 3; 
const SP_SPACING_AFTER_SECTION_HEADER_TEXT = 3; 
const SP_SPACING_AFTER_SECTION_HEADER_LINE = 4; 

const SP_SERVICE_CHECKBOX_FONT_SIZE = 9; 
const SP_SERVICE_CHECKBOX_SIZE = 3.5;
const SP_SERVICE_CHECKBOX_Y_INCREMENT = 6.5; 

const SP_AD_ZONE_FONT_SIZE = 8.5; 
const SP_AD_ZONE_CHECKBOX_SIZE = 3.5;
const SP_SPACING_AFTER_AD_ZONES_ROW = 4; 

const SP_SPACING_AFTER_QTY_LAST_ROW = 3; 
const SP_SPACING_AFTER_NOTES_ROW = 4; 
const SP_SPACING_AFTER_NOTES_LINE = 3; 

const SP_DISCLAIMER_FONT_SIZE = 7.5; 
const SP_SPACING_AFTER_DISCLAIMER = 5; 

const SP_SIG_NAME_FONT_SIZE = 9; 
const SP_SIG_LABEL_FONT_SIZE = 9;   
const SP_SIG_LINE_Y_OFFSET = 3; 
const SP_SIG_LABEL_Y_OFFSET_FROM_LINE = 3; 
const SP_SIG_AR_LABEL_Y_OFFSET_FROM_LINE = SP_SIG_LABEL_Y_OFFSET_FROM_LINE + 3; 

// Colors
const LINE_COLOR = [203, 213, 225]; // slate-300
const DOTTED_LINE_COLOR = [100, 116, 139]; // slate-500 
const TEXT_COLOR_LABEL_EN = [71, 85, 105];  // slate-600
const TEXT_COLOR_LABEL_AR = [51, 65, 85];   // slate-700
const TEXT_COLOR_VALUE_REGULAR = [30, 41, 59]; // slate-800
const TEXT_COLOR_FILLED_VALUE_PDF = [37, 99, 235]; // blue-600
const TEXT_COLOR_HEADER = [15, 23, 42]; // slate-900

export const generateReceiptPdf = async (
    details: ReceiptDetails, // Includes receiptNumber
    outputType?: 'datauristring' | 'blob' | 'save'
): Promise<void | string | Blob> => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            console.log('Starting font loading process...');
            const fontsLoaded = await Promise.all([
                loadAndRegisterFont(doc, FONT_EN_REGULAR_FILE, FONT_EN_FAMILY, 'normal'),
                loadAndRegisterFont(doc, FONT_EN_BOLD_FILE, FONT_EN_FAMILY, 'bold'),
                loadAndRegisterFont(doc, FONT_AR_REGULAR_FILE, FONT_AR_FAMILY, 'normal'),
                loadAndRegisterFont(doc, FONT_AR_BOLD_FILE, FONT_AR_FAMILY, 'bold')
            ]);

            const fontEnRegularLoaded = fontsLoaded[0];
            const fontEnBoldLoaded = fontsLoaded[1]; 
            const fontArRegularLoaded = fontsLoaded[2];
            const fontArBoldLoaded = fontsLoaded[3]; 

            console.log('Font loading results:', {
                fontEnRegularLoaded,
                fontEnBoldLoaded,
                fontArRegularLoaded,
                fontArBoldLoaded
            });

            const effectiveFontEn = fontEnRegularLoaded ? FONT_EN_FAMILY : 'helvetica';
            const effectiveFontAr = fontArRegularLoaded ? FONT_AR_FAMILY : 'helvetica'; 

            // Show warning if Arabic fonts failed to load
            if (!fontArRegularLoaded || !fontArBoldLoaded) {
                console.warn('Arabic fonts failed to load. Arabic text may not display correctly.');
                // You could also show a user notification here if needed
            }

            const PAGE_MARGIN_X = 15;
            const pageWidth = doc.internal.pageSize.getWidth();
            const contentWidth = pageWidth - 2 * PAGE_MARGIN_X;
            let yPos = PAGE_MARGIN_Y;
            
            // --- Logo ---
            try {
                const imgResponse = await fetch(LOGO_URL);
                if (imgResponse.ok) {
                    const imgBlob = await imgResponse.blob();
                    const reader = new FileReader();
                    await new Promise<void>((res, rej) => {
                        reader.onloadend = () => {
                            const imgDataUrl = reader.result as string;
                            const imgProps = doc.getImageProperties(imgDataUrl);
                            const aspectRatio = imgProps.width / imgProps.height;
                            const logoHeight = SP_LOGO_HEIGHT;
                            const logoWidth = logoHeight * aspectRatio;
                            doc.addImage(imgDataUrl, 'PNG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
                            yPos += logoHeight + SP_SPACING_AFTER_LOGO; 
                            res();
                        };
                        reader.onerror = rej;
                        reader.readAsDataURL(imgBlob);
                    });
                } else {
                    console.error(`Failed to fetch logo: ${imgResponse.statusText}`);
                    yPos += SP_LOGO_HEIGHT + SP_SPACING_AFTER_LOGO; 
                }
            } catch (e) {
                console.error("Error loading logo for PDF:", e);
                yPos += SP_LOGO_HEIGHT + SP_SPACING_AFTER_LOGO; 
            }

            // --- Receipt Number ---
            if (details.receiptNumber) {
                const receiptNumberText = `NO: ${details.receiptNumber}`;
                doc.setFont(effectiveFontEn, 'normal'); 
                doc.setFontSize(SP_RECEIPT_NUMBER_FONT_SIZE);
                doc.setTextColor(TEXT_COLOR_LABEL_AR[0], TEXT_COLOR_LABEL_AR[1], TEXT_COLOR_LABEL_AR[2]);
                doc.text(receiptNumberText, pageWidth - PAGE_MARGIN_X, yPos, { align: 'right', baseline: 'top' });
                // Calculate height of receipt number text to advance yPos correctly
                const receiptNumTextHeight = doc.getTextDimensions(receiptNumberText, { fontSize: SP_RECEIPT_NUMBER_FONT_SIZE }).h;
                yPos += receiptNumTextHeight + SP_SPACING_AFTER_RECEIPT_NUMBER; 
            }


            // --- Header Titles ---
            const headerEnText = "RECEIPT";
            const headerArText = "وصل استلام مبلغ";
            doc.setFont(fontEnBoldLoaded ? FONT_EN_FAMILY : effectiveFontEn, 'bold');
            doc.setFontSize(SP_HEADER_MAIN_FONT_SIZE); 
            doc.setTextColor(TEXT_COLOR_HEADER[0], TEXT_COLOR_HEADER[1], TEXT_COLOR_HEADER[2]);
            const mainHeaderEnY = yPos + (SP_HEADER_MAIN_FONT_SIZE * 0.35 / 2); 
            doc.text(headerEnText, PAGE_MARGIN_X, mainHeaderEnY, { align: 'left', baseline: 'middle' });

            doc.setFont(fontArBoldLoaded ? FONT_AR_FAMILY : effectiveFontAr, 'bold');
            doc.setFontSize(SP_HEADER_MAIN_FONT_SIZE);
            doc.text(headerArText, pageWidth - PAGE_MARGIN_X, mainHeaderEnY, { align: 'right', baseline: 'middle' });
            yPos += SP_HEADER_MAIN_FONT_SIZE * 0.7 + SP_SPACING_AFTER_MAIN_HEADER; 

            doc.setFont(effectiveFontEn, 'normal'); 
            doc.setFontSize(SP_HEADER_SUB_FONT_SIZE); 
            doc.setTextColor(TEXT_COLOR_VALUE_REGULAR[0], TEXT_COLOR_VALUE_REGULAR[1], TEXT_COLOR_VALUE_REGULAR[2]);
            const subHeaderY = yPos + (SP_HEADER_SUB_FONT_SIZE * 0.35 / 2);
            doc.text("TRIPOLI KARTING RACE 2025 - SEASON 1", PAGE_MARGIN_X, subHeaderY, { align: 'left', baseline: 'middle'});
            
            doc.setFont(effectiveFontAr, 'normal');
            doc.setFontSize(SP_HEADER_SUB_FONT_SIZE);
            doc.text("مهرجان طرابلس للكارتينج", pageWidth - PAGE_MARGIN_X, subHeaderY, { align: 'right', baseline: 'middle' });
            yPos += SP_HEADER_SUB_FONT_SIZE * 0.7 + SP_SPACING_AFTER_SUB_HEADER;

            doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
            doc.setLineWidth(0.5);
            doc.line(PAGE_MARGIN_X, yPos, pageWidth - PAGE_MARGIN_X, yPos);
            yPos += SP_SPACING_AFTER_HEADER_LINE; 

            const drawFillInRow = (labelEn: string, value: string, labelAr: string, options: {valueFontSize?: number, labelEnFontSize?: number, labelArFontSize?: number, valueAlign?: 'left'|'center'|'right', isQtyRow?: boolean} = {}) => {
                const rowHeight = SP_ROW_HEIGHT;
                const valueFontSize = options.valueFontSize || SP_ROW_VALUE_FONT_SIZE;
                const labelEnFontSize = options.labelEnFontSize || SP_ROW_LABEL_FONT_SIZE;
                const labelArFontSize = options.labelArFontSize || SP_ROW_LABEL_FONT_SIZE;
                const valueAlign = options.valueAlign || (options.isQtyRow ? 'center' : 'center'); 
                const textBaselineY = yPos + rowHeight / 2; 

                doc.setFont(effectiveFontEn, 'normal');
                doc.setFontSize(labelEnFontSize);
                doc.setTextColor(TEXT_COLOR_LABEL_EN[0], TEXT_COLOR_LABEL_EN[1], TEXT_COLOR_LABEL_EN[2]);
                const labelEnX = PAGE_MARGIN_X;
                doc.text(labelEn.toUpperCase(), labelEnX, textBaselineY, { baseline: 'middle' }); 
                const labelEnWidth = doc.getStringUnitWidth(labelEn.toUpperCase()) * labelEnFontSize / doc.internal.scaleFactor;

                doc.setFont(effectiveFontAr, 'normal');
                doc.setFontSize(labelArFontSize); 
                doc.setTextColor(TEXT_COLOR_LABEL_AR[0], TEXT_COLOR_LABEL_AR[1], TEXT_COLOR_LABEL_AR[2]); 
                const labelArX = pageWidth - PAGE_MARGIN_X;
                doc.text(labelAr, labelArX, textBaselineY, { align: 'right', baseline: 'middle' });
                const labelArWidth = doc.getStringUnitWidth(labelAr) * labelArFontSize / doc.internal.scaleFactor;
                
                let inputXStart, inputXEnd, inputWidth;
                const minInputPadding = 3; 

                if (options.isQtyRow) { 
                    const enLabelContainerWidth = contentWidth * 0.22; 
                    const arLabelContainerWidth = contentWidth * 0.33; 
                    inputXStart = PAGE_MARGIN_X + enLabelContainerWidth;
                    inputXEnd = pageWidth - PAGE_MARGIN_X - arLabelContainerWidth;
                    inputWidth = Math.max(inputXEnd - inputXStart, 10);
                } else {
                    inputXStart = PAGE_MARGIN_X + labelEnWidth + minInputPadding; 
                    inputXEnd = pageWidth - PAGE_MARGIN_X - labelArWidth - minInputPadding; 
                    inputWidth = Math.max(inputXEnd - inputXStart, 10); 
                }
                
                const lineY = yPos + rowHeight - 2; 
                doc.setDrawColor(DOTTED_LINE_COLOR[0], DOTTED_LINE_COLOR[1], DOTTED_LINE_COLOR[2]);
                doc.setLineDashPattern([0.5, 0.5], 0); 
                doc.setLineWidth(0.2);
                doc.line(inputXStart, lineY, inputXEnd, lineY);
                doc.setLineDashPattern([], 0);

                if (value && value.trim() !== "" && value.trim() !== "/" && value.trim() !== "//") {
                    const isArabicValue = /[ء-ي]/.test(value);
                    doc.setFont(
                        isArabicValue ? (fontArBoldLoaded ? FONT_AR_FAMILY : effectiveFontAr) 
                                      : (fontEnBoldLoaded ? FONT_EN_FAMILY : effectiveFontEn), 
                        'bold'
                    );
                    doc.setFontSize(valueFontSize);
                    doc.setTextColor(TEXT_COLOR_FILLED_VALUE_PDF[0], TEXT_COLOR_FILLED_VALUE_PDF[1], TEXT_COLOR_FILLED_VALUE_PDF[2]);
                    
                    const displayValue = isArabicValue ? value : value.toUpperCase(); 
                    const textYValue = lineY + TEXT_ON_LINE_OFFSET; 
                    let textX = inputXStart + (inputWidth / 2); 
                     
                    if(valueAlign === 'left') textX = inputXStart + 1;
                    else if(valueAlign === 'right') textX = inputXEnd -1; 
                    
                    doc.text(displayValue, textX, textYValue, { align: valueAlign, baseline: 'alphabetic', maxWidth: inputWidth -2 });
                }
                yPos += rowHeight;
            };
            
            let dateStr = "";
            if (details.receiptDate) { 
                const [year, month, day] = details.receiptDate.split('-');
                dateStr = `${day || '  '} / ${month || '  '} / ${year || '    '}`;
            } else { 
                 dateStr = `${details.day || '  '} / ${details.month || '  '} / ${details.year || '    '}`;
            }
            drawFillInRow("DATE", dateStr, "تاريخ الاستلام", {valueAlign: 'center'});
            drawFillInRow("RECEIVED FROM", details.receivedFromName, "وصلنا من السادة", {valueAlign: 'center'});
            drawFillInRow("AMOUNT", details.amount, "مبلغ وقدره", {valueAlign: 'center'});
            
            yPos += 2; 

            const forSectionTextY = yPos + SP_ROW_HEIGHT / 2; 
            
            const purposeParts = details.subscriptionPurpose.split('/');
            const forEnRaw = (purposeParts[0]?.trim() || "Subscription in Tripoli Karting Race").toUpperCase();
            const forEnText = `FOR ${forEnRaw}`; 
            const forArText = purposeParts[1]?.trim() || "اشتراك في مهرجان طرابلس للكارتينج";
            
            doc.setFont(effectiveFontEn, 'normal');
            doc.setFontSize(SP_FOR_SECTION_FONT_SIZE); 
            doc.setTextColor(TEXT_COLOR_VALUE_REGULAR[0], TEXT_COLOR_VALUE_REGULAR[1], TEXT_COLOR_VALUE_REGULAR[2]);
            doc.text(forEnText, PAGE_MARGIN_X, forSectionTextY, { baseline: 'middle', align: 'left' });
            
            doc.setFont(effectiveFontAr, 'normal'); 
            doc.setFontSize(SP_FOR_SECTION_FONT_SIZE); 
            doc.setTextColor(TEXT_COLOR_VALUE_REGULAR[0], TEXT_COLOR_VALUE_REGULAR[1], TEXT_COLOR_VALUE_REGULAR[2]);
            doc.text(`وذلك بدل ${forArText}`, pageWidth - PAGE_MARGIN_X, forSectionTextY, {baseline: 'middle', align: 'right'});
            yPos += SP_ROW_HEIGHT * 0.7 + SP_SPACING_AFTER_FOR_SECTION; 

            drawFillInRow("TENT NO.", details.tentNumber, "الخيمة رقم", {valueAlign: 'center'});
            drawFillInRow("USAGE PURPOSE", details.usagePurpose, "جهة الاستعمال", {valueAlign: 'center'});
            yPos += 2; 

            const drawSectionHeader = (titleEn: string, titleAr: string) => {
                yPos += SP_SPACING_BEFORE_SECTION_HEADER_TEXT;
                const sectionHeaderTextY = yPos + (SP_SECTION_HEADER_FONT_SIZE * 0.35 / 2); 
                doc.setFont(fontEnBoldLoaded ? FONT_EN_FAMILY : effectiveFontEn, 'bold');
                doc.setFontSize(SP_SECTION_HEADER_FONT_SIZE); 
                doc.setTextColor(TEXT_COLOR_HEADER[0], TEXT_COLOR_HEADER[1], TEXT_COLOR_HEADER[2]);
                doc.text(titleEn.toUpperCase(), PAGE_MARGIN_X, sectionHeaderTextY , { baseline: 'middle' }); 

                doc.setFont(fontArBoldLoaded ? FONT_AR_FAMILY : effectiveFontAr, 'bold');
                doc.setFontSize(SP_SECTION_HEADER_FONT_SIZE); 
                doc.text(titleAr, pageWidth - PAGE_MARGIN_X, sectionHeaderTextY, { align: 'right', baseline: 'middle' });
                yPos += SP_SECTION_HEADER_FONT_SIZE * 0.7 + SP_SPACING_AFTER_SECTION_HEADER_TEXT;
                doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
                doc.setLineWidth(0.3);
                doc.line(PAGE_MARGIN_X, yPos, pageWidth - PAGE_MARGIN_X, yPos);
                yPos += SP_SPACING_AFTER_SECTION_HEADER_LINE; 
            };
            
            drawSectionHeader("ADDITIONAL SERVICES", "خدمات اخرى");

            const drawServiceCheckboxRowPdf = (serviceEnMasterLabel: string, serviceArMasterLabel: string, checked: boolean) => {
                const checkboxSize = SP_SERVICE_CHECKBOX_SIZE;
                const textY = yPos + SP_SERVICE_CHECKBOX_Y_INCREMENT / 2; 
                const labelFontSize = SP_SERVICE_CHECKBOX_FONT_SIZE;
                const checkboxTextGap = 2; 
            
                doc.setFont(fontEnBoldLoaded ? FONT_EN_FAMILY : effectiveFontEn, 'bold');
                doc.setFontSize(labelFontSize);
                doc.setTextColor(TEXT_COLOR_VALUE_REGULAR[0], TEXT_COLOR_VALUE_REGULAR[1], TEXT_COLOR_VALUE_REGULAR[2]);
                
                const serviceEnText = serviceEnMasterLabel.toUpperCase(); 
                doc.text(serviceEnText, PAGE_MARGIN_X, textY, { baseline: 'middle' });
                const serviceEnWidth = doc.getStringUnitWidth(serviceEnText) * labelFontSize / doc.internal.scaleFactor;
                const checkboxEnX = PAGE_MARGIN_X + serviceEnWidth + checkboxTextGap;
                doc.rect(checkboxEnX, textY - checkboxSize/2, checkboxSize, checkboxSize, 'S'); 
                if (checked) {
                    const originalFontSize = doc.getFontSize();
                    doc.setFontSize(checkboxSize * 2.2); 
                    doc.setFont('zapfdingbats', 'normal'); 
                    doc.text('4', checkboxEnX + checkboxSize/2, textY + 0.2, { align: 'center', baseline: 'middle' }); 
                    doc.setFont(effectiveFontEn, 'bold'); 
                    doc.setFontSize(originalFontSize);
                }
            
                doc.setFont(fontArBoldLoaded ? FONT_AR_FAMILY : effectiveFontAr, 'bold');
                doc.setFontSize(labelFontSize);
            
                const serviceArText = `توفير ${serviceArMasterLabel}`;
                const arabicTextX = pageWidth - PAGE_MARGIN_X; 
                const serviceArWidth = doc.getStringUnitWidth(serviceArText) * labelFontSize / doc.internal.scaleFactor;
                const checkboxArX = arabicTextX - serviceArWidth - checkboxTextGap - checkboxSize;
                
                doc.text(serviceArText, arabicTextX, textY, { align: 'right', baseline: 'middle' });
                doc.rect(checkboxArX, textY - checkboxSize/2, checkboxSize, checkboxSize, 'S'); 
                if (checked) {
                    const originalFontSize = doc.getFontSize();
                    doc.setFontSize(checkboxSize * 1.8);
                    doc.setFont('zapfdingbats', 'normal');
                    doc.text('4', checkboxArX + checkboxSize/2, textY + 0.2, { align: 'center', baseline: 'middle' });
                    doc.setFont(effectiveFontAr, 'bold'); 
                    doc.setFontSize(originalFontSize);
                }
                yPos += SP_SERVICE_CHECKBOX_Y_INCREMENT; 
            };
            
            drawServiceCheckboxRowPdf("ELECTRICITY", "كهرباء", details.electricityAvailable);
            drawServiceCheckboxRowPdf("CHAIRS", "كراسي", details.chairsAvailable);
            drawServiceCheckboxRowPdf("TABLE", "طاولات", details.tableAvailable); 
            
            drawFillInRow("DESCRIPTION", details.description, "الشرح", {valueAlign: 'center'}); 
            yPos += 2; 

            drawSectionHeader("ADVERTISEMENTS ON TRACK", "إعلانات على مسار الحلبة");
            const adZones = [
                { key: 'adsZoneA', label: 'ZONE A' }, { key: 'adsZoneB', label: 'ZONE B' }, { key: 'adsZoneC', label: 'ZONE C' },
                { key: 'adsZoneD', label: 'ZONE D' }, { key: 'adsZoneE', label: 'ZONE E' }, { key: 'adsZoneF', label: 'ZONE F' }
            ] as const;
            const checkboxSizeAds = SP_AD_ZONE_CHECKBOX_SIZE;
            const spaceBetweenCheckboxAndLabelAds = 1.5; 
            const adZoneColWidth = contentWidth / 6; 

            doc.setFont(effectiveFontEn, 'normal');
            const adZoneFontSize = SP_AD_ZONE_FONT_SIZE; 
            doc.setFontSize(adZoneFontSize);
            doc.setTextColor(TEXT_COLOR_VALUE_REGULAR[0], TEXT_COLOR_VALUE_REGULAR[1], TEXT_COLOR_VALUE_REGULAR[2]);

            const adZoneRowY = yPos + SP_SERVICE_CHECKBOX_Y_INCREMENT / 2; 
            adZones.forEach((zone, index) => {
                const zoneLabelWidth = doc.getStringUnitWidth(zone.label) * adZoneFontSize / doc.internal.scaleFactor; 
                const totalElementWidth = checkboxSizeAds + spaceBetweenCheckboxAndLabelAds + zoneLabelWidth;
                
                const columnStartX = PAGE_MARGIN_X + (index * adZoneColWidth);
                const checkboxX = columnStartX + (adZoneColWidth / 2) - (totalElementWidth / 2);
                
                doc.rect(checkboxX, adZoneRowY - checkboxSizeAds/2, checkboxSizeAds, checkboxSizeAds, 'S');
                if (details[zone.key]) { 
                    const originalFontSize = doc.getFontSize();
                    doc.setFontSize(checkboxSizeAds * 1.8);
                    doc.setFont('zapfdingbats', 'normal');
                    doc.text('4', checkboxX + checkboxSizeAds / 2, adZoneRowY + 0.2, { align: 'center', baseline: 'middle' });
                    doc.setFont(effectiveFontEn, 'normal'); 
                    doc.setFontSize(originalFontSize); 
                }
                doc.text(zone.label, checkboxX + checkboxSizeAds + spaceBetweenCheckboxAndLabelAds, adZoneRowY, { baseline: 'middle' });
            });
            yPos += SP_SERVICE_CHECKBOX_Y_INCREMENT; 
            yPos += SP_SPACING_AFTER_AD_ZONES_ROW;

            drawFillInRow("TOTAL QTY", details.adsTotalQuantity, "العدد الإجمالي", {isQtyRow: true, valueAlign: 'center'});
            drawFillInRow("CAR FLAGS", details.carFlagsCount, "أعلام على السيارات", {isQtyRow: true, valueAlign: 'center'});
            drawFillInRow("BANNER FLAGS", details.bannerFlagsCount, "أعلام على الأرصفة", {isQtyRow: true, valueAlign: 'center'});
            yPos += SP_SPACING_AFTER_QTY_LAST_ROW;
            
            drawFillInRow("NOTES", details.notes, "ملاحظات", {valueAlign: 'center'});
            yPos += SP_SPACING_AFTER_NOTES_ROW; 

            doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
            doc.setLineWidth(0.3);
            doc.line(PAGE_MARGIN_X, yPos, pageWidth - PAGE_MARGIN_X, yPos);
            yPos += SP_SPACING_AFTER_NOTES_LINE; 
            
            const disclaimerTextY = yPos + (SP_DISCLAIMER_FONT_SIZE * 0.35 / 2);
            doc.setFont(effectiveFontEn, 'normal');
            doc.setFontSize(SP_DISCLAIMER_FONT_SIZE); 
            doc.setTextColor(TEXT_COLOR_LABEL_EN[0], TEXT_COLOR_LABEL_EN[1], TEXT_COLOR_LABEL_EN[2]);
            doc.text("THIS RECEIPT IS NOT A TAX INVOICE.", PAGE_MARGIN_X, disclaimerTextY, {baseline: 'middle'}); 
            doc.setFont(effectiveFontAr, 'normal');
            doc.setFontSize(SP_DISCLAIMER_FONT_SIZE); 
            doc.text("هذا الوصل لا يعتبر فاتورة ضريبية.", pageWidth - PAGE_MARGIN_X, disclaimerTextY, { align: 'right', baseline: 'middle' });
            yPos += SP_DISCLAIMER_FONT_SIZE * 0.7 + SP_SPACING_AFTER_DISCLAIMER; 

            const sigLineWidth = contentWidth * 0.40; 
            const sigLineBaseY = yPos + SP_SIG_LINE_Y_OFFSET; 
            const sigNameTextY = sigLineBaseY + TEXT_ON_LINE_OFFSET; 
            const sigLabelNameY = sigLineBaseY + SP_SIG_LABEL_Y_OFFSET_FROM_LINE;
            const sigLabelArabicY = sigLineBaseY + SP_SIG_AR_LABEL_Y_OFFSET_FROM_LINE; 

            const drawSignature = (centerX: number, nameValue: string, labelEn: string, labelAr: string) => {
                const sigXStart = centerX - (sigLineWidth/2);
                doc.setDrawColor(DOTTED_LINE_COLOR[0], DOTTED_LINE_COLOR[1], DOTTED_LINE_COLOR[2]);
                doc.setLineDashPattern([0.5, 0.5], 0);
                doc.setLineWidth(0.2);
                doc.line(sigXStart, sigLineBaseY, sigXStart + sigLineWidth, sigLineBaseY); 
                doc.setLineDashPattern([], 0);
                
                if (nameValue && nameValue.trim() !== "") {
                    const isArabicName = /[ء-ي]/.test(nameValue);
                    doc.setFont(
                        isArabicName ? (fontArBoldLoaded ? FONT_AR_FAMILY : effectiveFontAr) 
                                     : (fontEnBoldLoaded ? FONT_EN_FAMILY : effectiveFontEn), 
                        'bold'
                    );
                    doc.setFontSize(SP_SIG_NAME_FONT_SIZE);
                    doc.setTextColor(TEXT_COLOR_FILLED_VALUE_PDF[0], TEXT_COLOR_FILLED_VALUE_PDF[1], TEXT_COLOR_FILLED_VALUE_PDF[2]);
                    const displayName = isArabicName ? nameValue : nameValue.toUpperCase(); 
                    doc.text(displayName, centerX, sigNameTextY, { align: 'center', baseline: 'alphabetic', maxWidth: sigLineWidth -2 });
                }
                
                doc.setFont(effectiveFontEn, 'normal');
                doc.setFontSize(SP_SIG_LABEL_FONT_SIZE);
                doc.setTextColor(TEXT_COLOR_LABEL_EN[0], TEXT_COLOR_LABEL_EN[1], TEXT_COLOR_LABEL_EN[2]);
                doc.text(labelEn.toUpperCase(), centerX, sigLabelNameY, { align: 'center', baseline: 'alphabetic' }); 

                doc.setFont(effectiveFontAr, 'normal');
                doc.setFontSize(SP_SIG_LABEL_FONT_SIZE);
                doc.setTextColor(TEXT_COLOR_LABEL_AR[0], TEXT_COLOR_LABEL_AR[1], TEXT_COLOR_LABEL_AR[2]);
                doc.text(labelAr, centerX, sigLabelArabicY, { align: 'center', baseline: 'alphabetic' });
            };

            const receiverSigCenterX = PAGE_MARGIN_X + (contentWidth * 0.25);
            drawSignature(receiverSigCenterX, details.receiverName, "ISSUED TO", "المستلم");

            const payerSigCenterX = pageWidth - PAGE_MARGIN_X - (contentWidth * 0.25);
            drawSignature(payerSigCenterX, details.payerName, "ISSUED BY", "صادر عن");
            
            const now = new Date();
            const filenameSuffix = details.receiptNumber ? details.receiptNumber.replace(/[^a-zA-Z0-9-]/g, '_') : 
                `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
            const filename = `Receipt_${filenameSuffix}.pdf`;


            if (outputType === 'datauristring') {
                resolve(doc.output('datauristring'));
            } else if (outputType === 'blob') {
                resolve(doc.output('blob'));
            } else { 
                doc.save(filename);
                resolve();
            }

        } catch (error) {
            console.error("Error generating Receipt PDF:", error);
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    });
};