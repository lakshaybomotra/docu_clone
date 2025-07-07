import { useState, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "./App.css";
import "./SignatureField.css";
import SignaturePad from "./SignaturePad";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import SignatureDialog from "./SignatureDialog/SignatureDialog";
import RadioConfigDialog from "./RadioConfigDialog";
import DropdownConfigDialog from "./DropdownConfigDialog";
import BulkRadioDialog from "./BulkRadioDialog";
import CheckboxConfigDialog from "./CheckboxConfigDialog";
import { loadTemplate } from "./utils/templateUtils";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

function App() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [fields, setFields] = useState([]);
  const containerRef = useRef(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [signatures, setSignatures] = useState({});

  const [showRadioConfig, setShowRadioConfig] = useState(false);
  const [showDropdownConfig, setShowDropdownConfig] = useState(false);
  const [showBulkRadioDialog, setShowBulkRadioDialog] = useState(false);
  const [showCheckboxConfig, setShowCheckboxConfig] = useState(false);
  const [configFieldId, setConfigFieldId] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  // Load template if templateId is provided
  useState(() => {
    if (templateId) {
      const template = loadTemplate(templateId);
      if (template && template.mergedPdfData) {
        const pdfBlob = new Blob([
          Uint8Array.from(atob(template.mergedPdfData), c => c.charCodeAt(0))
        ], { type: 'application/pdf' });
        setFile(pdfBlob);
        setFields(template.fields || []);
      }
    }
  }, [templateId]);

  // ========= Helper: Group Bounding Boxes for Radio Groups =========
  const groupBounds = useMemo(() => {
    // Build a map of radio buttons grouped by their groupName on current page
    const groups = {};
    fields.forEach((field) => {
      if (
        field.type === "radio_button" &&
        field.groupName &&
        field.page === pageNumber
      ) {
        if (!groups[field.groupName]) {
          groups[field.groupName] = [];
        }
        groups[field.groupName].push(field);
      }
    });

    const margin = 8;
    return Object.entries(groups).map(([groupName, grpFields]) => {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      grpFields.forEach((fld) => {
        minX = Math.min(minX, fld.x);
        minY = Math.min(minY, fld.y);
        maxX = Math.max(maxX, fld.x + fld.width);
        maxY = Math.max(maxY, fld.y + fld.height);
      });

      return {
        groupName,
        x: minX - margin,
        y: minY - margin,
        width: maxX - minX + margin * 2,
        height: maxY - minY + margin * 2,
      };
    });
  }, [fields, pageNumber]);

  const handleEditRadioGroup = (groupName) => {
    // Collect labels for all fields in this group and open BulkRadioDialog in edit mode
    const groupFields = fields.filter(
      (f) => f.type === "radio_button" && f.groupName === groupName
    );
    if (groupFields.length === 0) return;
    const options = groupFields.map((f) => f.label);
    setEditingGroup({ groupName, options });
    setShowBulkRadioDialog(true);
  };

  // Handle PDF file upload
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  // PDF document load success handler
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Drag and Drop handlers
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

    // Individual radio button configuration
    if (type === "radio_button") {
      newField.label = "";
      newField.groupName = ""; // User can set this to group radio buttons
      newField.value = false;
    }

    if (type === "dropdown") {
      newField.options = ["Select an option", "Option 1", "Option 2"];
      newField.value = 0; // Default to first option (placeholder)
    }

    setFields([...fields, newField]);

    console.log("Field added:", newField);
  };

  const handleRadioConfig = (fieldId) => {
    console.log("Radio config clicked for field:", fieldId);
    setConfigFieldId(fieldId);
    setShowRadioConfig(true);
    console.log("showRadioConfig set to true");
  };

  const handleDropdownConfig = (fieldId) => {
    console.log("Dropdown config clicked for field:", fieldId);
    setConfigFieldId(fieldId);
    setShowDropdownConfig(true);
  };

  const updateRadioButtonConfig = (fieldId, label, groupName) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === fieldId
          ? { ...field, label, groupName, value: false }
          : field
      )
    );
    setShowRadioConfig(false);
  };

  const updateDropdownConfig = (fieldId, options) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === fieldId
          ? { ...field, options, value: 0 }
          : field
      )
    );
    setShowDropdownConfig(false);
  };

  const handleRadioButtonSelection = (fieldId, groupName) => {
    setFields((prevFields) =>
      prevFields.map((field) => {
        if (field.type === "radio_button" && field.groupName === groupName) {
          return { ...field, value: field.id === fieldId };
        }
        return field;
      })
    );
  };

  const handleBulkRadioCreation = (config) => {
    const { groupName, options, spacing, layout } = config;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Start position (center of the page)
    const startX = rect.width / 2 - 100;
    const startY = rect.height / 2 - (options.length * spacing) / 2;
    
    const newFields = options.map((option, index) => ({
      id: uuidv4(),
      type: "radio_button",
      page: pageNumber,
      x: layout === "horizontal" ? startX + (index * (120 + spacing)) : startX,
      y: layout === "vertical" ? startY + (index * spacing) : startY,
      width: 120,
      height: 25,
      label: option,
      groupName: groupName,
      value: index === 0, // First option selected by default
    }));

    setFields([...fields, ...newFields]);
    setShowBulkRadioDialog(false);
    
    console.log("Bulk radio buttons created:", newFields);
  };

  // Field manipulation handlers
  const updateFieldPosition = (id, x, y) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id
          ? {
              ...field,
              x,
              y,
            }
          : field
      )
    );
  };

  const updateFieldSize = (id, width, height) => {
    setFields((fields) =>
      fields.map((field) =>
        field.id === id ? { ...field, width, height } : field
      )
    );
    console.log("fields", fields);
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
    console.log("Signature saved:", signatureBase64);
  };

  const handleFieldValueChange = (id, value) => {
    setFields((prevFields) =>
      prevFields.map((field) => (field.id === id ? { ...field, value } : field))
    );
  };

  const handleLogFields = () => {
    const formattedFields = fields.map((field) => {
      const { id, type, x, y, width, height } = field;
      let value = field.value || "";
      
      if (type === "signature") {
        value = signatures[id] || "";
      } else if (type === "dropdown" && field.options) {
        value = field.options[field.value] || "";
      } else if (type === "radio_button") {
        value = field.value ? field.label : "";
      }
      
      return {
        id,
        type,
        position: { x, y, width, height },
        value,
        ...(type === "radio_button" && { groupName: field.groupName, label: field.label })
      };
    });
    console.log("Fields:", formattedFields);
  };

  const handleGeneratePDF = async () => {
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const existingPdfBytes = new Uint8Array(e.target.result);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (const field of fields) {
          const { id, page, x, y, width, height, type, value } = field;
          if (page <= pdfDoc.getPageCount()) {
            const pdfPage = pdfDoc.getPages()[page - 1];
            const adjustedY = pdfPage.getHeight() - (y + height);
            let fontSize = Math.min(height * 0.7, width / 8);
            
            if (type === "signature" && signatures[id]) {
              const base64Data = signatures[id].split(",")[1];
              const signatureBytes = Uint8Array.from(atob(base64Data), (char) =>
                char.charCodeAt(0)
              );
              const signatureImage = await pdfDoc.embedPng(signatureBytes);
              pdfPage.drawImage(signatureImage, {
                x,
                y: adjustedY,
                width,
                height,
              });
            } else if (type === "checkbox") {
              pdfPage.drawRectangle({
                x: x,
                y: adjustedY + height - 20,
                width: 20,
                height: 20,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
              });

              if (value === true) {
                const checkboxCenter = {
                  x: x + 10,
                  y: adjustedY + height - 10,
                };

                // Left part of checkmark
                pdfPage.drawLine({
                  start: {
                    x: checkboxCenter.x - 6,
                    y: checkboxCenter.y - 2,
                  },
                  end: {
                    x: checkboxCenter.x - 2,
                    y: checkboxCenter.y - 6,
                  },
                  thickness: 2,
                  color: rgb(0, 0, 0),
                  lineCap: "Round",
                });

                // Right part of checkmark
                pdfPage.drawLine({
                  start: {
                    x: checkboxCenter.x - 2,
                    y: checkboxCenter.y - 6,
                  },
                  end: {
                    x: checkboxCenter.x + 6,
                    y: checkboxCenter.y + 2,
                  },
                  thickness: 2,
                  color: rgb(0, 0, 0),
                  lineCap: "Round",
                });
              }

              const labelText = field.label || "";
              pdfPage.drawText(labelText, {
                x: x + 30,
                y: adjustedY + height - 16,
                font: helveticaFont,
                size: Math.min(12, fontSize),
                color: rgb(0, 0, 0),
              });
            } else if (type === "radio_button") {
              // Draw radio button circle
              pdfPage.drawCircle({
                x: x + 8,
                y: adjustedY + height - 16,
                size: 6,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
              });
              
              // Fill if selected
              if (value === true) {
                pdfPage.drawCircle({
                  x: x + 8,
                  y: adjustedY + height - 16,
                  size: 3,
                  color: rgb(0, 0, 0),
                });
              }
              
              // Draw label text
              const labelText = field.label || "";
              pdfPage.drawText(labelText, {
                x: x + 20,
                y: adjustedY + height - 20,
                font: helveticaFont,
                size: Math.min(12, fontSize),
                color: rgb(0, 0, 0),
              });
            } else if (type === "dropdown") {
              // Draw selected value
              const selectedValue = field.options && field.options[field.value] ? field.options[field.value] : "";
              if (selectedValue && selectedValue !== "Select an option") {
                pdfPage.drawText(selectedValue, {
                  x: x + 5,
                  y: adjustedY + (height / 2) - (fontSize / 2),
                  font: helveticaFont,
                  size: fontSize,
                  color: rgb(0, 0, 0),
                });
              }
            } else {
              const textValue = value || "";
              pdfPage.drawText(textValue, {
                x,
                y: adjustedY,
                font: helveticaFont,
                size: fontSize,
                color: rgb(0, 0, 0),
              });
            }
          }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // Add new delete field handler
  const handleDeleteField = (id, e) => {
    e.stopPropagation();
    setFields((prevFields) => prevFields.filter((field) => field.id !== id));
  };

  const updateExistingRadioGroup = (oldGroupName, newGroupName, options) => {
    setFields((prevFields) => {
      const otherFields = prevFields.filter(
        (f) => !(f.type === "radio_button" && f.groupName === oldGroupName)
      );
      const groupFields = prevFields.filter(
        (f) => f.type === "radio_button" && f.groupName === oldGroupName
      );

      const updated = [];
      const minLen = Math.min(groupFields.length, options.length);

      // Update existing fields up to min length
      for (let i = 0; i < minLen; i++) {
        const base = groupFields[i];
        updated.push({ ...base, label: options[i], groupName: newGroupName });
      }

      // If there are more options than existing fields, create new ones below the last field
      if (options.length > groupFields.length) {
        const last = groupFields[groupFields.length - 1];
        const startX = last ? last.x : 50;
        let startY = last ? last.y + 35 : 50;

        for (let i = groupFields.length; i < options.length; i++) {
          updated.push({
            id: uuidv4(),
            type: "radio_button",
            page: pageNumber,
            x: startX,
            y: startY,
            width: 120,
            height: 25,
            label: options[i],
            groupName: newGroupName,
            value: false,
          });
          startY += 35;
        }
      }

      // Extra fields (if options fewer) are simply dropped
      return [...otherFields, ...updated];
    });
  };

  const handleBulkRadioDialogSave = (config) => {
    if (editingGroup) {
      updateExistingRadioGroup(editingGroup.groupName, config.groupName, config.options);
      setEditingGroup(null);
      setShowBulkRadioDialog(false);
    } else {
      handleBulkRadioCreation(config);
    }
  };

  // ===== Checkbox label configuration helpers =====
  const handleCheckboxConfig = (fieldId) => {
    setConfigFieldId(fieldId);
    setShowCheckboxConfig(true);
  };

  const updateCheckboxConfig = (fieldId, label) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === fieldId ? { ...field, label } : field
      )
    );
    setShowCheckboxConfig(false);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
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

      {/* Main Content */}
      <div className="main-content">
        <input
          type="file"
          onChange={handleFileUpload}
          accept="application/pdf"
        />

        {file && (
          <div className="pdf-container">
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
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
                      position={{
                        x: field.x,
                        y: field.y,
                      }}
                      size={{
                        width: field.width,
                        height: field.height,
                      }}
                      onDragStop={(e, d) => {
                        e.stopPropagation();
                        updateFieldPosition(field.id, d.x, d.y);
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        const newWidth = ref.offsetWidth;
                        const newHeight = ref.offsetHeight;
                        console.log("Field resized:", {
                          width: newWidth,
                          height: newHeight,
                        });

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
                                width: "100%",
                                height: "100%",
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
                              // disabled
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
                                zIndex: -1,
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

                {/* Bounding boxes for bulk radio groups */}
                {groupBounds.map((box) => (
                  <div
                    key={`bbox-${box.groupName}`}
                    style={{
                      position: "absolute",
                      left: box.x,
                      top: box.y,
                      width: box.width,
                      height: box.height,
                      border: "2px dashed #2196f3",
                      borderRadius: "4px",
                      pointerEvents: "none",
                      zIndex: 20,
                    }}
                  >
                    {/* Edit button for the radio group */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRadioGroup(box.groupName);
                      }}
                      style={{
                        position: "absolute",
                        top: -12,
                        right: -12,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "#2196f3",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        pointerEvents: "auto",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Edit Radio Group"
                    >
                      ⚙️
                    </button>
                  </div>
                ))}
              </div>
            </Document>

            {/* Add signature pad modal */}
            {showSignaturePad && (
              <SignatureDialog
                onSave={handleSignatureSave}
                onClose={() => setShowSignaturePad(false)}
              />
            )}

            {/* Add radio config dialog */}
            {showRadioConfig && (
              <RadioConfigDialog
                field={fields.find((f) => f.id === configFieldId)}
                onSave={(label, groupName) =>
                  updateRadioButtonConfig(configFieldId, label, groupName)
                }
                onClose={() => setShowRadioConfig(false)}
              />
            )}

            {/* Add dropdown config dialog */}
            {showDropdownConfig && (
              <DropdownConfigDialog
                field={fields.find((f) => f.id === configFieldId)}
                onSave={(options) =>
                  updateDropdownConfig(configFieldId, options)
                }
                onClose={() => setShowDropdownConfig(false)}
              />
            )}

            {/* Add bulk radio dialog */}
            {showBulkRadioDialog && (
              <BulkRadioDialog
                initialGroupName={editingGroup?.groupName || ""}
                initialOptions={editingGroup?.options || null}
                onSave={handleBulkRadioDialogSave}
                onClose={() => {
                  setShowBulkRadioDialog(false);
                  setEditingGroup(null);
                }}
              />
            )}

            {/* Checkbox label configuration dialog */}
            {showCheckboxConfig && (
              <CheckboxConfigDialog
                field={fields.find((f) => f.id === configFieldId)}
                onSave={(label) => updateCheckboxConfig(configFieldId, label)}
                onClose={() => setShowCheckboxConfig(false)}
              />
            )}

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
        )}
        <button onClick={handleLogFields}>Log Fields</button>
        <button onClick={handleGeneratePDF}>Generate PDF</button>
      </div>
    </div>
  );
}

export default App;