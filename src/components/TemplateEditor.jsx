import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "./TemplateEditor.css";

// Import existing dialogs
import SignatureDialog from "../SignatureDialog/SignatureDialog";
import RadioConfigDialog from "../RadioConfigDialog";
import DropdownConfigDialog from "../DropdownConfigDialog";
import BulkRadioDialog from "../BulkRadioDialog";
import CheckboxConfigDialog from "../CheckboxConfigDialog";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const TemplateEditor = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [fields, setFields] = useState([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [signatures, setSignatures] = useState({});
  const containerRef = useRef(null);

  // Dialog states
  const [showRadioConfig, setShowRadioConfig] = useState(false);
  const [showDropdownConfig, setShowDropdownConfig] = useState(false);
  const [showBulkRadioDialog, setShowBulkRadioDialog] = useState(false);
  const [showCheckboxConfig, setShowCheckboxConfig] = useState(false);
  const [configFieldId, setConfigFieldId] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = () => {
    try {
      const savedTemplates = localStorage.getItem("pdfTemplates");
      if (savedTemplates) {
        const templates = JSON.parse(savedTemplates);
        const foundTemplate = templates.find(t => t.id === templateId);
        if (foundTemplate) {
          setTemplate(foundTemplate);
          setFields(foundTemplate.fields || []);
        } else {
          alert("Template not found");
          navigate("/templates");
        }
      }
    } catch (error) {
      console.error("Error loading template:", error);
      navigate("/templates");
    }
  };

  const saveTemplate = (updatedTemplate) => {
    try {
      const savedTemplates = localStorage.getItem("pdfTemplates");
      const templates = savedTemplates ? JSON.parse(savedTemplates) : [];
      const updatedTemplates = templates.map(t => 
        t.id === templateId ? updatedTemplate : t
      );
      localStorage.setItem("pdfTemplates", JSON.stringify(updatedTemplates));
      setTemplate(updatedTemplate);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handlePdfUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    console.log("Processing", files.length, "files");

    const newPdfFiles = [];
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert uint8Array to base64 in chunks to avoid call stack overflow
        let binaryString = '';
        const chunkSize = 8192; // Process 8KB at a time
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binaryString);
        
        newPdfFiles.push({
          id: uuidv4(),
          name: file.name,
          data: base64,
          size: file.size
        });
        console.log("Processed file:", file.name);
      } catch (error) {
        console.error("Error processing file:", file.name, error);
        alert(`Error processing file ${file.name}: ${error.message}`);
        return;
      }
    }

    const updatedTemplate = {
      ...template,
      pdfFiles: [...template.pdfFiles, ...newPdfFiles],
      updatedAt: new Date().toISOString()
    };

    console.log("Updated template with", updatedTemplate.pdfFiles.length, "total PDFs");

    // Merge PDFs if multiple files
    if (updatedTemplate.pdfFiles.length > 1) {
      await mergePdfs(updatedTemplate);
    } else {
      // For single PDF, set it as merged data
      updatedTemplate.mergedPdfData = newPdfFiles[0].data;
      saveTemplate(updatedTemplate);
    }

    // Clear the file input
    e.target.value = '';
  };

  const mergePdfs = async (templateToUpdate) => {
    try {
      console.log("Merging", templateToUpdate.pdfFiles.length, "PDFs");
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfFile of templateToUpdate.pdfFiles) {
        try {
          const pdfBytes = Uint8Array.from(atob(pdfFile.data), c => c.charCodeAt(0));
          const pdf = await PDFDocument.load(pdfBytes);
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
          console.log("Merged PDF:", pdfFile.name);
        } catch (error) {
          console.error("Error merging PDF:", pdfFile.name, error);
          throw new Error(`Failed to merge ${pdfFile.name}: ${error.message}`);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedBase64 = btoa(String.fromCharCode(...mergedPdfBytes));

      const updatedTemplate = {
        ...templateToUpdate,
        mergedPdfData: mergedBase64
      };

      console.log("PDF merge completed successfully");
      saveTemplate(updatedTemplate);
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Error merging PDFs. Please try again.");
    }
  };

  const handleReplacePdf = async (pdfId, newFile) => {
    if (!newFile) return;

    const arrayBuffer = await newFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert uint8Array to base64 in chunks to avoid call stack overflow
    let binaryString = '';
    const chunkSize = 8192; // Process 8KB at a time
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, chunk);
    }
    const base64 = btoa(binaryString);

    const updatedPdfFiles = template.pdfFiles.map(pdf => 
      pdf.id === pdfId 
        ? { ...pdf, name: newFile.name, data: base64, size: newFile.size }
        : pdf
    );

    const updatedTemplate = {
      ...template,
      pdfFiles: updatedPdfFiles,
      updatedAt: new Date().toISOString()
    };

    await mergePdfs(updatedTemplate);
  };

  const handleRemovePdf = async (pdfId) => {
    if (!window.confirm("Are you sure you want to remove this PDF?")) return;

    const updatedPdfFiles = template.pdfFiles.filter(pdf => pdf.id !== pdfId);
    const updatedTemplate = {
      ...template,
      pdfFiles: updatedPdfFiles,
      updatedAt: new Date().toISOString()
    };

    if (updatedPdfFiles.length > 1) {
      await mergePdfs(updatedTemplate);
    } else if (updatedPdfFiles.length === 1) {
      updatedTemplate.mergedPdfData = updatedPdfFiles[0].data;
      saveTemplate(updatedTemplate);
    } else {
      updatedTemplate.mergedPdfData = null;
      saveTemplate(updatedTemplate);
    }
  };

  const getCurrentPdfData = () => {
    if (!template) return null;
    if (template.pdfFiles.length === 0) return null;
    
    console.log("Getting current PDF data. Files:", template.pdfFiles.length, "Merged data exists:", !!template.mergedPdfData);
    
    if (template.pdfFiles.length === 1) {
      return `data:application/pdf;base64,${template.pdfFiles[0].data}`;
    }
    
    if (template.mergedPdfData) {
      return `data:application/pdf;base64,${template.mergedPdfData}`;
    }
    
    return null;
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Field manipulation functions (reused from App.jsx)
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData("text/plain", type);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newField = {
      id: uuidv4(),
      type,
      page: pageNumber,
      x,
      y,
      width: type === "radio_button" ? 120 : type === "dropdown" ? 150 : 100,
      height: type === "radio_button" ? 25 : 40,
    };

    if (type === "radio_button") {
      newField.label = "";
      newField.groupName = "";
      newField.value = false;
    }

    if (type === "dropdown") {
      newField.options = ["Select an option", "Option 1", "Option 2"];
      newField.value = 0;
    }

    if (type === "checkbox") {
      newField.label = "";
      newField.value = false;
    }

    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
  };

  const saveFieldsToTemplate = (updatedFields) => {
    const updatedTemplate = {
      ...template,
      fields: updatedFields,
      updatedAt: new Date().toISOString()
    };
    saveTemplate(updatedTemplate);
  };

  const updateFieldPosition = (id, x, y) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, x, y } : field
    );
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
  };

  const updateFieldSize = (id, width, height) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, width, height } : field
    );
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
  };

  const handleDeleteField = (id, e) => {
    e.stopPropagation();
    const updatedFields = fields.filter(field => field.id !== id);
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
  };

  const handleFieldValueChange = (id, value) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, value } : field
    );
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
  };

  // Configuration handlers
  const handleRadioConfig = (fieldId) => {
    setConfigFieldId(fieldId);
    setShowRadioConfig(true);
  };

  const updateRadioButtonConfig = (fieldId, label, groupName) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId
        ? { ...field, label, groupName, value: false }
        : field
    );
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
    setShowRadioConfig(false);
  };

  const handleRadioButtonSelection = (fieldId, groupName) => {
    const updatedFields = fields.map(field => {
      if (field.type === "radio_button" && field.groupName === groupName) {
        return { ...field, value: field.id === fieldId };
      }
      return field;
    });
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
  };

  const handleCheckboxConfig = (fieldId) => {
    setConfigFieldId(fieldId);
    setShowCheckboxConfig(true);
  };

  const updateCheckboxConfig = (fieldId, label) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, label } : field
    );
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
    setShowCheckboxConfig(false);
  };

  const handleDropdownConfig = (fieldId) => {
    setConfigFieldId(fieldId);
    setShowDropdownConfig(true);
  };

  const updateDropdownConfig = (fieldId, options) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId
        ? { ...field, options, value: 0 }
        : field
    );
    setFields(updatedFields);
    saveFieldsToTemplate(updatedFields);
    setShowDropdownConfig(false);
  };

  const handleSignatureClick = (fieldId) => {
    if (!signatures[fieldId]) {
      setActiveFieldId(fieldId);
      setShowSignaturePad(true);
    }
  };

  const handleSignatureSave = (signatureBase64) => {
    setSignatures({
      ...signatures,
      [activeFieldId]: signatureBase64,
    });
    setShowSignaturePad(false);
  };

  if (!template) {
    return <div className="loading">Loading template...</div>;
  }

  const currentPdfData = getCurrentPdfData();

  return (
    <div className="template-editor">
      {/* Header */}
      <div className="template-editor-header">
        <div className="header-left">
          <button 
            className="back-btn"
            onClick={() => navigate("/templates")}
          >
            ← Back to Templates
          </button>
          <h1>{template.name}</h1>
        </div>
        <div className="header-right">
          <span className="save-status">Auto-saved</span>
        </div>
      </div>

      <div className="template-editor-content">
        {/* Sidebar */}
        <div className="template-sidebar">
          <div className="sidebar-section">
            <h3>PDFs ({template.pdfFiles.length})</h3>
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={handlePdfUpload}
              style={{ marginBottom: "10px" }}
              key={template.pdfFiles.length} // Force re-render to clear input
            />
            
            <div className="pdf-list">
              {template.pdfFiles.map((pdf, index) => (
                <div key={pdf.id} className="pdf-item">
                  <div className="pdf-info">
                    <span className="pdf-name">{pdf.name}</span>
                    <span className="pdf-size">
                      {(pdf.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="pdf-actions">
                    <label className="replace-btn">
                      Replace
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleReplacePdf(pdf.id, e.target.files[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemovePdf(pdf.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Form Fields</h3>
            <div className="field-types">
              <div
                className="field-type"
                draggable
                onDragStart={(e) => handleDragStart(e, "text")}
              >
                Text Field
              </div>
              <div
                className="field-type"
                draggable
                onDragStart={(e) => handleDragStart(e, "date")}
              >
                Date Field
              </div>
              <div
                className="field-type"
                draggable
                onDragStart={(e) => handleDragStart(e, "checkbox")}
              >
                Checkbox
              </div>
              <div
                className="field-type bulk-radio"
                onClick={() => setShowBulkRadioDialog(true)}
                style={{ 
                  cursor: "pointer",
                  backgroundColor: "#e3f2fd",
                  border: "2px dashed #2196f3"
                }}
              >
                📦 Bulk Radio Group
              </div>
              <div
                className="field-type"
                draggable
                onDragStart={(e) => handleDragStart(e, "dropdown")}
              >
                Dropdown
              </div>
              <div
                className="field-type"
                draggable
                onDragStart={(e) => handleDragStart(e, "signature")}
              >
                Signature
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="template-main">
          {currentPdfData ? (
            <div className="pdf-container">
              <Document file={currentPdfData} onLoadSuccess={onDocumentLoadSuccess}>
                <div
                  className="page-container"
                  ref={containerRef}
                  style={{ position: "relative" }}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Page pageNumber={pageNumber} />

                  {fields
                    .filter((field) => field.page === pageNumber)
                    .map((field) => (
                      <Rnd
                        key={field.id}
                        position={{ x: field.x, y: field.y }}
                        size={{ width: field.width, height: field.height }}
                        onDragStop={(e, d) => {
                          e.stopPropagation();
                          updateFieldPosition(field.id, d.x, d.y);
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          const newWidth = ref.offsetWidth;
                          const newHeight = ref.offsetHeight;
                          updateFieldSize(field.id, newWidth, newHeight);
                          updateFieldPosition(field.id, position.x, position.y);
                        }}
                        bounds="parent"
                        minWidth={20}
                        minHeight={20}
                        enableResizing={{
                          top: true,
                          right: true,
                          bottom: true,
                          left: true,
                          topLeft: true,
                          topRight: true,
                          bottomLeft: true,
                          bottomRight: true,
                        }}
                        style={{ zIndex: 10 }}
                      >
                        <div className="field">
                          <button
                            style={{
                              position: "absolute",
                              top: -10,
                              right: -10,
                              zIndex: 100,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              border: "none",
                              backgroundColor: "red",
                              color: "white",
                              cursor: "pointer",
                              fontSize: 16,
                              fontWeight: "bold",
                              display: "flex",
                              justifyContent: "center",
                            }}
                            onClick={(e) => handleDeleteField(field.id, e)}
                          >
                            x
                          </button>

                          {/* Field rendering logic (same as App.jsx) */}
                          {field.type === "text" && (
                            <input
                              type="text"
                              placeholder="Text"
                              onChange={(e) =>
                                handleFieldValueChange(field.id, e.target.value)
                              }
                            />
                          )}
                          
                          {field.type === "date" && (
                            <input
                              type="date"
                              onChange={(e) =>
                                handleFieldValueChange(field.id, e.target.value)
                              }
                            />
                          )}

                          {field.type === "checkbox" && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                height: "100%",
                                padding: "5px",
                              }}
                            >
                              <button
                                onClick={() => handleCheckboxConfig(field.id)}
                                style={{
                                  position: "absolute",
                                  top: -10,
                                  left: -10,
                                  zIndex: 100,
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  border: "none",
                                  backgroundColor: "blue",
                                  color: "white",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                                title="Configure Checkbox"
                              >
                                ⚙️
                              </button>
                              <input
                                type="checkbox"
                                checked={field.value === true}
                                onChange={(e) =>
                                  handleFieldValueChange(
                                    field.id,
                                    e.target.checked
                                  )
                                }
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  cursor: "pointer",
                                }}
                              />
                              <label
                                style={{
                                  marginLeft: "8px",
                                  fontSize: "14px",
                                  cursor: "pointer",
                                }}
                              >
                                {field.label}
                              </label>
                            </div>
                          )}

                          {field.type === "radio_button" && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                height: "100%",
                                padding: "5px",
                                gap: "5px",
                              }}
                            >
                              <button
                                onClick={() => handleRadioConfig(field.id)}
                                style={{
                                  position: "absolute",
                                  top: -10,
                                  left: -10,
                                  zIndex: 100,
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  border: "none",
                                  backgroundColor: "blue",
                                  color: "white",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                                title="Configure Radio Button"
                              >
                                ⚙️
                              </button>
                              <input
                                type="radio"
                                name={field.groupName || `radio-${field.id}`}
                                checked={field.value === true}
                                onChange={() =>
                                  handleRadioButtonSelection(field.id, field.groupName || `radio-${field.id}`)
                                }
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  cursor: "pointer",
                                }}
                              />
                              <label
                                style={{
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                onClick={() =>
                                  handleRadioButtonSelection(field.id, field.groupName || `radio-${field.id}`)
                                }
                              >
                                {field.label}
                              </label>
                            </div>
                          )}

                          {field.type === "dropdown" && (
                            <div
                              style={{
                                position: "relative",
                                height: "100%",
                                width: "100%",
                              }}
                            >
                              <button
                                onClick={() => handleDropdownConfig(field.id)}
                                style={{
                                  position: "absolute",
                                  top: -10,
                                  left: -10,
                                  zIndex: 100,
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  border: "none",
                                  backgroundColor: "green",
                                  color: "white",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                                title="Configure Dropdown"
                              >
                                ⚙️
                              </button>
                              <select
                                value={field.value || 0}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleFieldValueChange(field.id, parseInt(e.target.value));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  fontSize: "12px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  padding: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                {field.options?.map((option, index) => (
                                  <option key={index} value={index}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {field.type === "signature" && (
                            <div
                              className={`signature-box ${
                                !signatures[field.id] ? "unsigned" : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSignatureClick(field.id);
                              }}
                            >
                              {signatures[field.id] ? (
                                <>
                                  <div className="signed-info">
                                    <span className="signed-by">Signed by:</span>
                                    <div className="signature-bracket"></div>
                                  </div>
                                  <img
                                    src={signatures[field.id]}
                                    alt="signature"
                                    className="signature-img"
                                  />
                                  <div className="signature-id">
                                    {field.id.substring(0, 16).toUpperCase()}...
                                  </div>
                                </>
                              ) : (
                                <span>Click to sign</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Rnd>
                    ))}
                </div>
              </Document>

              {/* Pagination */}
              {numPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={() =>
                      setPageNumber(Math.min(numPages, pageNumber + 1))
                    }
                    disabled={pageNumber >= numPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="no-pdf-state">
              <h3>No PDFs in template</h3>
              <p>Upload PDF files to start building your template</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showSignaturePad && (
        <SignatureDialog
          onSave={handleSignatureSave}
          onClose={() => setShowSignaturePad(false)}
        />
      )}

      {showRadioConfig && (
        <RadioConfigDialog
          field={fields.find((f) => f.id === configFieldId)}
          onSave={(label, groupName) =>
            updateRadioButtonConfig(configFieldId, label, groupName)
          }
          onClose={() => setShowRadioConfig(false)}
        />
      )}

      {showDropdownConfig && (
        <DropdownConfigDialog
          field={fields.find((f) => f.id === configFieldId)}
          onSave={(options) =>
            updateDropdownConfig(configFieldId, options)
          }
          onClose={() => setShowDropdownConfig(false)}
        />
      )}

      {showCheckboxConfig && (
        <CheckboxConfigDialog
          field={fields.find((f) => f.id === configFieldId)}
          onSave={(label) => updateCheckboxConfig(configFieldId, label)}
          onClose={() => setShowCheckboxConfig(false)}
        />
      )}
    </div>
  );
};

export default TemplateEditor;