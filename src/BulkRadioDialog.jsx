import { useState } from "react";
import "./BulkRadioDialog.css";

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
          </small>        </div>

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
