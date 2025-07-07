import { useState, useEffect } from "react";
import "./RadioConfigDialog.css";

const RadioConfigDialog = ({ field, onSave, onClose }) => {
  console.log("RadioConfigDialog rendered with field:", field);
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