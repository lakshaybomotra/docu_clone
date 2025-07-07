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