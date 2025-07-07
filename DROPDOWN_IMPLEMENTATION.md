# Dropdown Field Implementation Guide

This guide provides all the necessary code to implement dropdown fields with configuration dialog in your PDF form builder.

## 1. Create DropdownConfigDialog Component

### File: `src/DropdownConfigDialog.jsx`

```jsx
import { useState, useEffect } from "react";
import "./DropdownConfigDialog.css";

const DropdownConfigDialog = ({ field, onSave, onClose }) => {
  console.log("DropdownConfigDialog rendered with field:", field);
  const [options, setOptions] = useState(field?.options || ["Select an option", "Option 1", "Option 2"]);

  const handleAddOption = () => {
    setOptions([...options, `Option ${options.length}`]);
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
    if (options.some(option => option.trim() === "")) {
      alert("Please fill in all option values");
      return;
    }
    onSave(options);
  };

  return (
    <div className="dropdown-config-overlay">
      <div className="dropdown-config-dialog">
        <h3>Configure Dropdown</h3>
        
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

export default DropdownConfigDialog;
```

### File: `src/DropdownConfigDialog.css`

```css
.dropdown-config-overlay {
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

.dropdown-config-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-width: 400px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.dropdown-config-dialog h3 {
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
  margin-bottom: 10px;
  font-weight: bold;
  color: #555;
}

.options-list {
  margin-bottom: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.option-item input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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

## 2. Add to App.jsx

### Import Statement
```jsx
import DropdownConfigDialog from "./DropdownConfigDialog";
```

### State Variables
```jsx
const [showDropdownConfig, setShowDropdownConfig] = useState(false);
const [configFieldId, setConfigFieldId] = useState(null);
```

### Handler Functions
```jsx
const handleDropdownConfig = (fieldId) => {
  console.log("Dropdown config clicked for field:", fieldId);
  setConfigFieldId(fieldId);
  setShowDropdownConfig(true);
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
```

### Sidebar Draggable Item
```jsx
<div
  className="field-type"
  draggable
  onDragStart={(e) => handleDragStart(e, "dropdown")}
>
  Dropdown
</div>
```

### Drop Handler Addition
```jsx
// Add this to your handleDrop function
if (type === "dropdown") {
  newField.options = ["Select an option", "Option 1", "Option 2"];
  newField.value = 0; // Default to first option (placeholder)
}
```

### Field Rendering
```jsx
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
```

### Dialog Component
```jsx
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
```

### PDF Generation (add to handleGeneratePDF function)
```jsx
else if (type === "dropdown") {
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
}
```

## Usage

1. Copy the component files and CSS
2. Add the import statement to App.jsx
3. Add the state variables
4. Add the handler functions
5. Add the sidebar item and field rendering code
6. Add the dialog component to your render method
7. Add the PDF generation code

Your dropdown fields will now be fully functional with a configuration dialog!
