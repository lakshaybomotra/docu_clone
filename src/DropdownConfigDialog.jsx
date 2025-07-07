import { useState, useEffect } from "react";
import "./RadioConfigDialog.css"; // Reusing the same CSS file

const DropdownConfigDialog = ({ field, onSave, onClose }) => {
  console.log("DropdownConfigDialog rendered with field:", field);
  const [options, setOptions] = useState(field?.options || ["Select an option", "Option 1", "Option 2"]);

  const addOption = () => {
    setOptions([...options, `Option ${options.length}`]);
  };

  const removeOption = (index) => {
    // Don't allow removing if it would leave less than 2 options (including placeholder)
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    setOptions(options.map((opt, i) => (i === index ? value : opt)));
  };

  const handleSave = () => {
    onSave(options);
  };

  return (
    <div className="radio-config-overlay">
      <div className="radio-config-dialog">
        <h3>Configure Dropdown</h3>
        
        <div className="config-section">
          <label>Options:</label>
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={index === 0 ? "Placeholder text" : `Option ${index}`}
              />
              <button
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                className="remove-btn"
                title={index === 0 ? "Cannot remove placeholder" : "Remove option"}
              >
                ×
              </button>
            </div>
          ))}
          <button onClick={addOption} className="add-btn">
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