# Bulk Radio Field Implementation Guide

This guide provides all the necessary code to implement bulk radio button creation with a configuration dialog in your PDF form builder.

## 1. Create BulkRadioDialog Component

### File: `src/BulkRadioDialog.jsx`

```jsx
import { useState, useMemo } from "react";
import "./BulkRadioDialog.css";
import { v4 as uuidv4 } from "uuid";

const BulkRadioDialog = ({ onSave, onClose, initialGroupName = "", initialOptions = null }) => {
  const [groupName, setGroupName] = useState(initialGroupName);
  const [options, setOptions] = useState(initialOptions || [""]);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    if (groupName.trim() === "") {
      alert("Please enter a group name for the radio buttons");
      return;
    }
    
    onSave({
      groupName: groupName.trim(),
      options: options.map(opt => opt.trim()),
      spacing: 35, // Predefined spacing
      layout: "vertical" // Predefined layout
    });
  };

  return (
    <div className="bulk-radio-overlay">
      <div className="bulk-radio-dialog">
        <h3>Create Radio Button Group</h3>
        
        <div className="config-section">
          <label>Group Name:</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name (required)"
          />
          <small style={{ color: "#666", fontSize: "12px", marginTop: "5px", display: "block" }}>
            All radio buttons in this group will be mutually exclusive
          </small>
        </div>

        <div className="config-section">
          <label>Options:</label>
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-item">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  disabled={options.length <= 1}
                  className="remove-option-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddOption}
            className="add-option-btn"
          >
            + Add Option
          </button>
        </div>

        <div className="config-actions">
          <button onClick={handleSave} className="save-btn">
            Create Radio Group
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkRadioDialog;
```

### File: `src/BulkRadioDialog.css`

```css
.bulk-radio-overlay {
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

.bulk-radio-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-width: 400px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.bulk-radio-dialog h3 {
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

.config-section input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.options-list {
  margin-bottom: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.option-item input {
  flex: 1;
}

.remove-option-btn {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
}

.remove-option-btn:hover {
  background: #cc0000;
}

.remove-option-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.add-option-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-option-btn:hover {
  background: #45a049;
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

## 2. Individual Radio Button Support

### File: `src/RadioConfigDialog.jsx` (for individual radio configuration)

```jsx
import { useState } from "react";
import "./RadioConfigDialog.css";

const RadioConfigDialog = ({ field, onSave, onClose }) => {
  const [label, setLabel] = useState(field?.label || "");
  const [groupName, setGroupName] = useState(field?.groupName || "");

  const handleSave = () => {
    onSave(label, groupName);
  };

  return (
    <div className="radio-config-overlay">
      <div className="radio-config-dialog">
        <h3>Configure Radio Button</h3>
        
        <div className="config-section">
          <label>Label:</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter radio button label"
          />
        </div>

        <div className="config-section">
          <label>Group Name (optional):</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name to link radio buttons"
          />
          <small style={{ color: "#666", fontSize: "12px", marginTop: "5px", display: "block" }}>
            Radio buttons with the same group name will be mutually exclusive. 
            Leave empty for independent radio buttons.
          </small>
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

export default RadioConfigDialog;
```

### File: `src/RadioConfigDialog.css`

```css
.radio-config-overlay {
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

.radio-config-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-width: 350px;
  max-width: 450px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.radio-config-dialog h3 {
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

## 3. Add to App.jsx

### Import Statements
```jsx
import BulkRadioDialog from "./BulkRadioDialog";
import RadioConfigDialog from "./RadioConfigDialog";
```

### State Variables
```jsx
const [showBulkRadioDialog, setShowBulkRadioDialog] = useState(false);
const [showRadioConfig, setShowRadioConfig] = useState(false);
const [configFieldId, setConfigFieldId] = useState(null);
const [editingGroup, setEditingGroup] = useState(null);
```

### Handler Functions
```jsx
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

const handleRadioConfig = (fieldId) => {
  setConfigFieldId(fieldId);
  setShowRadioConfig(true);
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

// ========= Helper to compute bounding boxes =========
const groupBounds = useMemo(() => {
  const groups = {};
  fields.forEach((f) => {
    if (f.type === "radio_button" && f.groupName && f.page === pageNumber) {
      (groups[f.groupName] ||= []).push(f);
    }
  });
  const margin = 8;
  return Object.entries(groups).map(([groupName, list]) => {
    const xs = list.map((f) => [f.x, f.x + f.width]).flat();
    const ys = list.map((f) => [f.y, f.y + f.height]).flat();
    return {
      groupName,
      x: Math.min(...xs) - margin,
      y: Math.min(...ys) - margin,
      width: Math.max(...xs) - Math.min(...xs) + margin * 2,
      height: Math.max(...ys) - Math.min(...ys) + margin * 2,
    };
  });
}, [fields, pageNumber]);

// ========= Editing helpers =========
const handleEditRadioGroup = (groupName) => {
  const groupFields = fields.filter(
    (f) => f.type === "radio_button" && f.groupName === groupName
  );
  if (!groupFields.length) return;
  setEditingGroup({
    groupName,
    options: groupFields.map((f) => f.label),
  });
  setShowBulkRadioDialog(true);
};

const updateExistingRadioGroup = (oldName, newName, options) => {
  // update / add / remove radio buttons so they match the edited list
  setFields((prev) => {
    const remaining = prev.filter(
      (f) => !(f.type === "radio_button" && f.groupName === oldName)
    );
    // reuse existing where possible, create new for extras
    const base = prev.filter(
      (f) => f.type === "radio_button" && f.groupName === oldName
    );
    const out = [];
    options.forEach((label, idx) => {
      const template = base[idx];
      if (template) {
        out.push({ ...template, label, groupName: newName });
      } else {
        // simple vertical stacking below last existing
        const start = base[base.length - 1] || { x: 50, y: 50 };
        out.push({
          id: uuidv4(),
          type: "radio_button",
          page: pageNumber,
          x: start.x,
          y: start.y + (idx - base.length + 1) * 35,
          width: 120,
          height: 25,
          label,
          groupName: newName,
          value: false,
        });
      }
    });
    return [...remaining, ...out];
  });
};

const handleBulkRadioDialogSave = (cfg) => {
  if (editingGroup) {
    updateExistingRadioGroup(editingGroup.groupName, cfg.groupName, cfg.options);
    setEditingGroup(null);
    setShowBulkRadioDialog(false);
  } else {
    handleBulkRadioCreation(cfg);
  }
};
```

### Sidebar Items
```jsx
{/* Individual Radio Button */}
<div
  className="field-type"
  draggable
  onDragStart={(e) => handleDragStart(e, "radio_button")}
>
  Radio Button
</div>

{/* Bulk Radio Group */}
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
```

### Drop Handler Addition
```jsx
// Add this to your handleDrop function
if (type === "radio_button") {
  newField.label = "";
  newField.groupName = ""; // User can set this to group radio buttons
  newField.value = false;
  newField.width = 120;
  newField.height = 25;
}
```

### Field Rendering
```jsx
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
```

### Dialog Components
```jsx
{/* Bulk radio (create **or** edit) */}
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
```

### PDF Generation (add to handleGeneratePDF function)
```jsx
else if (type === "radio_button") {
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
  const labelText = field.label || "Radio Option";
  pdfPage.drawText(labelText, {
    x: x + 20,
    y: adjustedY + height - 20,
    font: helveticaFont,
    size: Math.min(12, fontSize),
    color: rgb(0, 0, 0),
  });
}
```

### Log Fields Handler Addition
```jsx
// Add to handleLogFields function
if (type === "radio_button") {
  value = field.value ? field.label : "";
  return {
    id,
    type,
    position: { x, y, width, height },
    value,
    groupName: field.groupName,
    label: field.label
  };
}
```

## Usage

1. Copy both component files and their CSS
2. Add the import statements to App.jsx
3. Add the state variables
4. Add all the handler functions
5. Add both sidebar items (individual radio and bulk radio)
6. Add the drop handler logic
7. Add the field rendering code
8. Add both dialog components to your render method
9. Add the PDF generation code

Features:
- **Individual Radio Buttons**: Drag and drop single radio buttons with configuration
- **Bulk Radio Groups**: Click to create entire radio button groups at once
- **Group Management**: Radio buttons with the same group name are mutually exclusive
- **Configurable Labels**: Each radio button can have a custom label
- **Automatic Positioning**: Bulk creation positions buttons vertically with optimal spacing

The radio button system will now be fully functional with both individual and bulk creation capabilities — and labels are completely optional (they start blank and can be set later in the dialogs).
