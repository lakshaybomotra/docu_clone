import { PDFDocument } from "pdf-lib";

export const base64ToUint8Array = async (base64String) => {
  try {
    // Use fetch with data URL for efficient handling of large data
    const response = await fetch(`data:application/pdf;base64,${base64String}`);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Error converting base64 to Uint8Array:", error);
    throw error;
  }
};

export const uint8ArrayToBase64 = (uint8Array) => {
  try {
    let binaryString = '';
    const chunkSize = 8192; // Process 8KB at a time
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, chunk);
    }
    
    return btoa(binaryString);
  } catch (error) {
    console.error("Error converting Uint8Array to base64:", error);
    throw error;
  }
};

export const loadTemplate = (templateId) => {
  try {
    const savedTemplates = localStorage.getItem("pdfTemplates");
    if (savedTemplates) {
      const templates = JSON.parse(savedTemplates);
      return templates.find(t => t.id === templateId);
    }
    return null;
  } catch (error) {
    console.error("Error loading template:", error);
    return null;
  }
};

export const saveTemplate = (template) => {
  try {
    const savedTemplates = localStorage.getItem("pdfTemplates");
    const templates = savedTemplates ? JSON.parse(savedTemplates) : [];
    
    const existingIndex = templates.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    
    localStorage.setItem("pdfTemplates", JSON.stringify(templates));
    return true;
  } catch (error) {
    console.error("Error saving template:", error);
    return false;
  }
};

export const deleteTemplate = (templateId) => {
  try {
    const savedTemplates = localStorage.getItem("pdfTemplates");
    if (savedTemplates) {
      const templates = JSON.parse(savedTemplates);
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      localStorage.setItem("pdfTemplates", JSON.stringify(updatedTemplates));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting template:", error);
    return false;
  }
};

export const mergePdfs = async (pdfFiles) => {
  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfFile of pdfFiles) {
      const pdfBytes = await base64ToUint8Array(pdfFile.data);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return uint8ArrayToBase64(mergedPdfBytes);
  } catch (error) {
    console.error("Error merging PDFs:", error);
    throw error;
  }
};

export const validateTemplate = (template) => {
  if (!template) return { valid: false, errors: ["Template is required"] };
  
  const errors = [];
  
  if (!template.name || template.name.trim() === "") {
    errors.push("Template name is required");
  }
  
  if (!template.id) {
    errors.push("Template ID is required");
  }
  
  if (!Array.isArray(template.pdfFiles)) {
    errors.push("PDF files must be an array");
  }
  
  if (!Array.isArray(template.fields)) {
    errors.push("Fields must be an array");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const exportTemplate = (template) => {
  try {
    const templateData = JSON.stringify(template, null, 2);
    const blob = new Blob([templateData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error exporting template:", error);
    return false;
  }
};

export const importTemplate = async (file) => {
  try {
    const text = await file.text();
    const template = JSON.parse(text);
    
    const validation = validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
    }
    
    // Generate new ID to avoid conflicts
    template.id = Date.now().toString();
    template.name = `${template.name} (Imported)`;
    template.createdAt = new Date().toISOString();
    template.updatedAt = new Date().toISOString();
    
    return template;
  } catch (error) {
    console.error("Error importing template:", error);
    throw error;
  }
};