
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import type { ScopeItem, GeminiChat, GeminiJsonParsingError, QuotationStructure, QuotationScopeItemStructure } from '../types';
import { GEMINI_TEXT_MODEL, QUOTATION_COMPANY_DETAILS } from '../constants';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set. Please ensure it is configured.");
  // Consider throwing an error or having a more visible warning in the UI
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const base64EncodeFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const parseGeminiJsonResponse = <T>(responseText: string, fileNameForErrorContext?: string): T => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error(`Failed to parse JSON response${fileNameForErrorContext ? ` for ${fileNameForErrorContext}` : ''}:`, e);
    console.error("Raw response text:", responseText);
    const error = new Error(
      `AI returned an invalid JSON format${fileNameForErrorContext ? ` for ${fileNameForErrorContext}` : ''}. Details: ${(e as Error).message}`
    ) as GeminiJsonParsingError;
    error.name = "GeminiJsonParsingError";
    error.rawResponse = responseText;
    throw error;
  }
};


export const processPdfForScope = async (file: File): Promise<ScopeItem[]> => {
  console.log(`Processing PDF: ${file.name} for general construction scope including painting and facade cladding.`);
  try {
    const base64EncodedPdf = await base64EncodeFile(file);

    const pdfPart: Part = {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64EncodedPdf,
      },
    };

    const textPart: Part = {
      text: `You are an expert AI assistant acting as a Senior Quantity Surveyor and Facade Designer. Your task is to analyze PDF documents (construction bids, quotations, architectural plans, specifications, textual notes) for various construction scopes, with a strong focus on:
1.  **Painting Works:** All interior and exterior painting.
2.  **Facade Cladding:** Natural stone (granite, marble, limestone, travertine, slate etc.), engineered stone, terracotta panels, metal panels (ACM, zinc, copper), GFRC, precast concrete, brick slips, timber cladding, HPL panels, and other facade cladding systems.
3.  **Other Relevant Facade Elements:** Curtain walling, window systems, louvers, sunshades, waterproofing associated with facades, and significant facade features.

Objective: Extract ALL relevant information for these scopes from the ENTIRE PDF, including ALL pages, drawings, plans, elevations, sections, details, schedules, and specifications.

For each distinct scope item found, provide the following details in a JSON array format:
1.  category: The primary category of work. Use one of: "painting", "cladding", "facade_element", "other". Be specific for cladding (e.g., if you identify "natural_stone_cladding", use "cladding").
2.  itemDescription: A concise but complete description of the work. For painting (e.g., "Paint interior GWB walls, Type P-1 - Living Room 101"). For cladding (e.g., "Supply and install Granite Giallo Ornamental facade panels, North Elevation, Zone 1", "Terracotta rainscreen system, Type TC-2, including sub-structure"). Specify location if identifiable.
3.  quantity: The quantity, amount, or extent specified (e.g., "2 coats on 2500 SQFT", "150 Linear Feet", "50 SQM of stone cladding", "5 Doors (both sides)"). THIS FIELD MUST CONTAIN BOTH THE NUMERIC VALUE AND THE UNIT STRING (e.g. "120 SQM", "75 LM"). If not explicitly stated, calculate it if possible from drawings or provide a count. If truly unquantifiable from the document, state "Refer to detailed takeoff" but explain why. AVOID "As per drawing" or "As per spec" without further quantification.
4.  materialOrFinish: The type of material, finish, system, or specific product code/manufacturer.
    *   For Painting: (e.g., "Eggshell latex, P-1A", "Sherwin Williams ProMar 200, Semi-gloss", "3-coat epoxy system").
    *   For Cladding: (e.g., "Granite, Giallo Ornamental, Honed Finish, 30mm thick", "Terracotta Panel, Naturo-S Series, Color 305, 600x1200mm panels", "Anodized Aluminum visible clip fixing system"). Include material type, specific stone/product name, finish, thickness, and panel sizes if available.
    *   For Other Facade Elements: (e.g., "Schuco FWS 50 Curtain Wall System", "Brick slips, Manufacturer X, Model Y, Color Z on carrier system").
    If not detailed, use "N/A".
5.  dimensions: Wall/surface dimensions, panel sizes, or element sizes if explicitly available (e.g., "10ft x 8ft wall", "Typical panel 600x1200mm", "Louvers 150x50mm profile"). If dimensions are not directly stated but can be reasonably derived, state "Calculated: [value]" and briefly note how in 'calculationDetails'. If not applicable, state "N/A".
6.  pageNumber: The EXACT page number(s) in the PDF where this information was found (e.g., "P5", "A-101", "SPEC-09900-2", "Drawing E2, Detail 3/E2", "FS-01 Panel Schedule"). Be precise. If information is consolidated from multiple pages, list them.
7.  calculationDetails: (Optional) If you performed a calculation for 'dimensions' or 'quantity' based on information in the PDF, briefly explain your methodology or assumptions here. E.g., "Calculated cladding area from plan A-201 (length 12m) and elevation E-101 (height 9m)". Include notes on fixing systems, joint details if not in materialOrFinish.
8.  unitOfMeasure: A normalized category for the unit in the 'quantity' field. Determine the primary unit and categorize it. Examples: "SQFT" (square feet), "SQM" (square meters), "LF" (linear feet), "LM" (linear meters), "EACH", "ITEM", "ALLOWANCE", "LUMPSUM", "TONNE", "KG". Use uppercase. If quantity is "50 SQM of 30mm thick stone", unitOfMeasure should be "SQM".

Return the information as a JSON array of objects. Each object represents a single scope item.
The JSON structure for each item should be:
{
  "category": "string",
  "itemDescription": "string",
  "quantity": "string",
  "materialOrFinish": "string",
  "dimensions": "string",
  "pageNumber": "string",
  "calculationDetails": "string | null",
  "unitOfMeasure": "string"
}

CRITICAL INSTRUCTIONS:
- ACCURACY AND THOROUGHNESS ARE PARAMOUNT.
- FULLY INSPECT ALL PAGES.
- 'quantity' FIELD MUST INCLUDE THE UNIT.
- 'unitOfMeasure' FIELD MUST BE THE NORMALIZED UNIT CATEGORY.
- 'category' FIELD IS MANDATORY.
- 'materialOrFinish' MUST BE DETAILED for both painting and cladding/facade items.
- NO LAZY ANSWERS: Avoid "as per plan", "refer to drawing/specification" unless providing the specific extracted data from that reference. Your job is to extract it.
- CALCULATE WHERE FEASIBLE and note it.
- PAGE REFERENCES ARE MANDATORY.
- If no relevant scope items (painting, cladding, facade elements) are found after a thorough review, return an empty JSON array [].
- Ensure the entire response is ONLY the JSON array. No introductory text or explanations outside the JSON.
`,
    };

    console.log(`Sending PDF ${file.name} to Gemini for general scope processing.`);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: { parts: [textPart, pdfPart] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    console.log(`Received response for ${file.name}. Parsing...`);
    const extractedItems = parseGeminiJsonResponse<ScopeItem[]>(response.text, file.name);
    console.log(`Successfully extracted ${extractedItems.length} items for ${file.name}.`);
    return extractedItems;

  } catch (error) {
    console.error(`Error processing PDF ${file.name} with Gemini:`, error);
    if ((error as GeminiJsonParsingError).name === "GeminiJsonParsingError") {
        throw error;
    }
    throw new Error(`Failed to process PDF ${file.name} with AI. Details: ${(error as Error).message}`);
  }
};

export const initializeChat = (systemInstructionContext: string): GeminiChat => {
  const fullSystemInstruction = `${systemInstructionContext}

You are an AI assistant with expertise in quantity surveying, facade design, painting specifications, and facade cladding systems (including natural stone, metal panels, terracotta, etc.). When responding, please structure your answers clearly. Use Markdown formatting where appropriate to enhance readability. This includes:
- **Bold text** for emphasis or headings.
- *Italics* for definitions or specific terms.
- Bullet points (using - or *) for lists.
- Numbered lists for sequential information.
- Short tables if you need to compare items or present structured data.
- Headings (e.g., ## Sub-heading) for different sections if the response is long.
Your goal is to make your responses as easy to understand, technically accurate, and visually organized as possible.
`;
  return ai.chats.create({
    model: GEMINI_TEXT_MODEL,
    config: {
      systemInstruction: fullSystemInstruction,
    }
  });
};

export const sendMessageToChatGemini = async (chat: GeminiChat, messageText: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: messageText });
    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini Chat:", error);
    throw new Error(`AI chat error: ${(error as Error).message}`);
  }
};

export const generateQuotationStructureFromGemini = async (items: ScopeItem[], clientFileName: string): Promise<QuotationStructure> => {
  const baseClientFileName = clientFileName.replace(/\.[^/.]+$/, ""); // Remove extension
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  if (items.length === 0) {
    // Fallback structure if no items
    return {
      title: `Construction Services Quotation for ${baseClientFileName}`,
      clientInfo: { name: "[Client Name]", address: "[Client Address]", date: currentDate, projectId: `Project: ${baseClientFileName}` },
      companyInfo: QUOTATION_COMPANY_DETAILS,
      introductionText: "No scope items were available to generate a detailed quotation. Please verify the PDF processing.",
      items: [],
      subtotalPlaceholder: "$[SUBTOTAL_PRICE]",
      totalPricePlaceholder: "$[GRAND_TOTAL_PRICE]",
      termsAndConditions: ["Standard terms apply.", "This quotation is valid for 30 days."],
      conclusionText: "We look forward to the opportunity to work with you."
    };
  }

  const scopeItemsForPrompt: QuotationScopeItemStructure[] = items.map((item, index) => ({
    id: index + 1,
    category: item.category,
    description: item.itemDescription,
    quantity: item.quantity,
    materialOrFinish: item.materialOrFinish,
    dimensions: item.dimensions,
    pageRef: String(item.pageNumber),
    unitOfMeasure: item.unitOfMeasure,
    pricePlaceholder: `$[ITEM_PRICE_${index + 1}]`
  }));

  const prompt = `
You are an AI assistant tasked with generating a structured JSON object for a professional construction quotation.
The client's original file name for context is: "${clientFileName}". Use its base name (without extension) for project identification.
Today's date is: ${currentDate}.

Based on the following scope items (which may include painting, facade cladding, etc.), create a comprehensive quotation structure in JSON format.

Scope Items (already extracted, do not change these item details, especially 'unitOfMeasure' and 'category'):
${JSON.stringify(scopeItemsForPrompt, null, 2)}

Return a single JSON object adhering to the following TypeScript interface:

export interface QuotationScopeItemStructure {
  id: string | number;
  category: string; // e.g., "painting", "cladding", "facade_element" - preserve from input
  description: string;
  quantity: string; // e.g., "150 LF", "2500 SQFT", "50 SQM"
  materialOrFinish: string; // Detailed material or finish specification
  dimensions?: string;
  pageRef?: string;
  unitOfMeasure?: string; // e.g., "SQFT", "LF", "EACH", "SQM" - Crucial: use the exact unitOfMeasure from the input items.
  pricePlaceholder: string; // e.g., "$[ITEM_PRICE_1]" - you should use the exact placeholders from the input items.
}

export interface QuotationStructure {
  title: string; // e.g., "Construction Services Quotation for [Project Name derived from clientFileName]"
  clientInfo: {
    name: string; // Use placeholder: "[Client Name]"
    address: string; // Use placeholder: "[Client Address]"
    date: string; // Use today's date: "${currentDate}"
    projectId: string; // Generate from clientFileName, e.g., "Project: ${baseClientFileName}"
  };
  companyInfo: ${JSON.stringify(QUOTATION_COMPANY_DETAILS)}; // Use these exact details
  introductionText: string; // Professional introductory paragraph, acknowledging the scope might cover various works.
  items: QuotationScopeItemStructure[]; // Use the provided items structure above. These items already contain pricePlaceholders, category, and unitOfMeasure.
  subtotalPlaceholder: string; // Use placeholder: "$[SUBTOTAL_PRICE]"
  taxPlaceholder?: string; // Use placeholder: "$[TAX_AMOUNT]" (include this field)
  totalPricePlaceholder: string; // Use placeholder: "$[GRAND_TOTAL_PRICE]"
  termsAndConditions: string[]; // An array of 3-4 standard professional terms.
  conclusionText: string; // Professional concluding remarks.
}

Guidelines for JSON content:
- Title: Generate a suitable title like "Construction Services Quotation for [Project Name]".
- Client Info: Use placeholders "[Client Name]" and "[Client Address]". Use the provided today's date for 'date'. Generate 'projectId' using the base name of clientFileName.
- Company Info: Must be exactly as provided.
- Introduction: Write a brief, professional opening.
- Items: Use the 'scopeItemsForPrompt' AS IS for the 'items' array. The 'pricePlaceholder', 'category', 'materialOrFinish', and 'unitOfMeasure' fields within each item must be preserved from the input.
- Placeholders for Totals: Use "$[SUBTOTAL_PRICE]", "$[TAX_AMOUNT]", and "$[GRAND_TOTAL_PRICE]".
- Terms and Conditions: Provide 3-4 general but professional terms.
- Conclusion: A polite closing statement.

The entire response MUST be a single, valid JSON object conforming to the QuotationStructure interface. No other text or explanation.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const parsedStructure = parseGeminiJsonResponse<QuotationStructure>(response.text, `Quotation for ${clientFileName}`);
    
    // Post-processing checks and corrections
    if (!parsedStructure.clientInfo.date || parsedStructure.clientInfo.date.startsWith("[")) {
        parsedStructure.clientInfo.date = currentDate;
    }
    if (!parsedStructure.clientInfo.projectId || !parsedStructure.clientInfo.projectId.includes(baseClientFileName)) {
        parsedStructure.clientInfo.projectId = `Project: ${baseClientFileName}`;
    }
    if (!parsedStructure.title || !parsedStructure.title.includes(baseClientFileName) || parsedStructure.title.toLowerCase().includes("painting services")) {
        parsedStructure.title = `Construction Services Quotation for ${baseClientFileName}`;
    }
    parsedStructure.items.forEach((item, index) => {
        if (!item.unitOfMeasure && scopeItemsForPrompt[index]?.unitOfMeasure) {
            item.unitOfMeasure = scopeItemsForPrompt[index].unitOfMeasure;
        }
        if (!item.category && scopeItemsForPrompt[index]?.category) {
            item.category = scopeItemsForPrompt[index].category;
        }
        if (!item.materialOrFinish && scopeItemsForPrompt[index]?.materialOrFinish) {
            item.materialOrFinish = scopeItemsForPrompt[index].materialOrFinish;
        }
    });

    return parsedStructure;
  } catch (error) {
    console.error("Error generating quotation structure with Gemini:", error);
    const fallbackStructure: QuotationStructure = {
        title: `Construction Services Quotation for ${baseClientFileName}`,
        clientInfo: { name: "[Client Name]", address: "[Client Address]", date: currentDate , projectId: `Project: ${baseClientFileName}` },
        companyInfo: QUOTATION_COMPANY_DETAILS,
        introductionText: "We are pleased to provide this quotation for the construction services as detailed below. Note: This is a fallback due to an error in dynamic content generation.",
        items: scopeItemsForPrompt, // Use items with category, unitOfMeasure, materialOrFinish
        subtotalPlaceholder: "$[SUBTOTAL_PRICE]",
        taxPlaceholder: "$[TAX_AMOUNT]",
        totalPricePlaceholder: "$[GRAND_TOTAL_PRICE]",
        termsAndConditions: [
            "All work to be completed in a workmanlike manner according to standard practices.",
            "Any alteration or deviation from scope involving extra costs will be executed only upon written orders, and will become an extra charge over and above the estimate.",
            "Payment to be made as follows: [Payment Terms Placeholder, e.g., 50% deposit, 50% upon completion].",
            "This quotation is valid for 30 days."
        ],
        conclusionText: "We appreciate the opportunity to provide this quotation and look forward to working with you."
    };
    if ((error as GeminiJsonParsingError).name === "GeminiJsonParsingError") {
        console.error("Gemini raw response:", (error as GeminiJsonParsingError).rawResponse);
    }
    alert(`An error occurred while generating the quotation content with AI. A template will be used. Error: ${(error as Error).message}`);
    return fallbackStructure;
  }
};
