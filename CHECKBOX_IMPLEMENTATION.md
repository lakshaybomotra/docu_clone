# Checkbox Field Implementation Guide

This guide provides all the necessary code to implement checkbox fields in your PDF form builder.

## 1. Add to App.jsx

### Sidebar Draggable Item
```jsx
<div
  className="field-type"
  draggable
  onDragStart={(e) => handleDragStart(e, "checkbox")}
>
  Checkbox
</div>
```

### Drop Handler Addition
```jsx
// Add this to your handleDrop function
const newField = {
  id: uuidv4(),
  type,
  page: pageNumber,
  x,
  y,
  width: type === "checkbox" ? 100 : 100,
  height: type === "checkbox" ? 40 : 40,
};

// For checkbox, add default properties
if (type === "checkbox") {
  newField.label = "";
  newField.value = false;
}
```

### Field Rendering
```jsx
{field.type === "checkbox" && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      height: "100%",
      padding: "5px",
    }}
  >
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
```

### Handler Function
```jsx
const handleFieldValueChange = (id, value) => {
  setFields((prevFields) =>
    prevFields.map((field) => (field.id === id ? { ...field, value } : field))
  );
};
```

### PDF Generation (add to handleGeneratePDF function)
```jsx
else if (type === "checkbox") {
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

  const labelText = field.label || "Checkbox";
  pdfPage.drawText(labelText, {
    x: x + 30,
    y: adjustedY + height - 16,
    font: helveticaFont,
    size: Math.min(12, fontSize),
    color: rgb(0, 0, 0),
  });
}
```

### Log Fields Handler (add to handleLogFields function)
```jsx
const handleLogFields = () => {
  const formattedFields = fields.map((field) => {
    const { id, type, x, y, width, height } = field;
    let value = field.value || "";
    
    if (type === "checkbox") {
      value = field.value ? "Checked" : "Unchecked";
    }
    
    return {
      id,
      type,
      position: { x, y, width, height },
      value,
      ...(type === "checkbox" && { label: field.label })
    };
  });
  console.log("Fields:", formattedFields);
};
```

## 2. Checkbox Configuration Dialog

Add a dialog that lets users configure the checkbox label. Create the following files:

### File: `src/CheckboxConfigDialog.jsx`
```jsx
import { useState } from "react";
import "./CheckboxConfigDialog.css";

const CheckboxConfigDialog = ({ field, onSave, onClose }) => {
  const [label, setLabel] = useState(field?.label || "");

  const handleSave = () => {
    onSave(label.trim());
  };

  return (
    <div className="checkbox-config-overlay">
      <div className="checkbox-config-dialog">
        <h3>Configure Checkbox</h3>
        
        <div className="config-section">
          <label>Label:</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter checkbox label"
          />
        </div>

        <div className="config-actions">
          <button onClick={handleSave} className="save-btn">
            Save
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckboxConfigDialog;
```

### File: `src/CheckboxConfigDialog.css`
```css
.checkbox-config-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.checkbox-config-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.checkbox-config-dialog h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.config-section {
  margin-bottom: 20px;
}

.config-section label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.config-section input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.config-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.save-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn:hover {
  background: #0056b3;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #545b62;
}
```

### Additional App.jsx code for configuration dialog:
```jsx
// Import
import CheckboxConfigDialog from "./CheckboxConfigDialog";

// State
const [showCheckboxConfig, setShowCheckboxConfig] = useState(false);

// Handler functions
const handleCheckboxConfig = (fieldId) => {
  setConfigFieldId(fieldId);
  setShowCheckboxConfig(true);
};

const updateCheckboxConfig = (fieldId, label) => {
  setFields((prevFields) =>
    prevFields.map((field) =>
      field.id === fieldId
        ? { ...field, label }
        : field
    )
  );
  setShowCheckboxConfig(false);
};

// Add config button to checkbox rendering
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

// Dialog component
{showCheckboxConfig && (
  <CheckboxConfigDialog
    field={fields.find((f) => f.id === configFieldId)}
    onSave={(label) => updateCheckboxConfig(configFieldId, label)}
    onClose={() => setShowCheckboxConfig(false)}
  />
)}
```

## Usage

1. Add the sidebar draggable item
2. Add the drop handler logic
3. Add the field rendering code
4. Add the handler function
5. Add the PDF generation code
6. Add the configuration dialog

Your checkbox fields will now be fully functional, with labels being completely optional (they start blank and can be set later in the configuration dialog if desired)!
