import React, { useState, useEffect, useRef } from "react";
import "./SignatureDialog.css";
import SignaturePad from "../SignaturePad";

const getInitialsFromName = (name) => {
  if (!name || typeof name !== "string") return "";
  const nameParts = name
    .trim()
    .split(" ")
    .filter((part) => part.length > 0);
  if (nameParts.length === 0) return "";
  if (nameParts.length === 1) {
    return nameParts[0]
      .substring(0, Math.min(2, nameParts[0].length))
      .toUpperCase();
  }
  return (
    nameParts[0][0] + (nameParts[nameParts.length - 1][0] || "")
  ).toUpperCase();
};

const SIGNATURE_FONTS = [
  { id: "font1", name: "Dancing Script", family: "Dancing Script" },
  { id: "font2", name: "Pacifico", family: "Pacifico" },
  { id: "font3", name: "Caveat", family: "Caveat" },
  { id: "font4", name: "Sacramento", family: "Sacramento" },
  { id: "font5", name: "Great Vibes", family: "Great Vibes" },
];

function SignatureDialog({
  onSave,
  onClose,
  initialFullName = "Lakshay Bomotra",
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [initials, setInitials] = useState(
    getInitialsFromName(initialFullName)
  );
  const [selectedFontId, setSelectedFontId] = useState(SIGNATURE_FONTS[0].id);
  const [activeTab, setActiveTab] = useState("CHOOSE");

  useEffect(() => {
    setInitials(getInitialsFromName(fullName));
  }, [fullName]);

  const handleFullNameChange = (event) => setFullName(event.target.value);
  const handleInitialsChange = (event) => setInitials(event.target.value);
  const handleFontSelect = (fontId) => setSelectedFontId(fontId);

  const handleCreate = () => {
    const selectedFontObject = SIGNATURE_FONTS.find(
      (font) => font.id === selectedFontId
    );
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    const scaleFactor = 3;
    const fontSize = 48 * scaleFactor;
    const fontFamily = `"${selectedFontObject.family}", cursive`;
    tempCtx.font = `${fontSize}px ${fontFamily}`;

    const textMetrics = tempCtx.measureText(fullName);
    const textWidth = Math.ceil(textMetrics.width);
    const textHeight = fontSize * 1.2;

    const padding = 10 * scaleFactor;

    tempCanvas.width = textWidth + padding * 2;
    tempCanvas.height = textHeight + padding * 2;

    const ctx = tempCanvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.textRenderingOptimization = "optimizeQuality";

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#000";
    ctx.textBaseline = "top";

    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;

    ctx.fillText(fullName, padding, padding);

    const dataUrl = tempCanvas.toDataURL("image/png", 1.0);

    if (onSave) {
      onSave(dataUrl);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "SAVED":
        return <div className="empty-box">Saved content goes here</div>;
      case "DRAW":
        return <SignaturePad onSave={onSave} onClose={onClose} />;
      case "CHOOSE":
      default:
        return (
          <div className="signature-options-list">
            {SIGNATURE_FONTS.map((font) => (
              <div
                key={font.id}
                className={`signature-option ${
                  selectedFontId === font.id ? "selected" : ""
                }`}
                onClick={() => handleFontSelect(font.id)}
                role="radio"
                aria-checked={selectedFontId === font.id}
                tabIndex={0}
                onKeyPress={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  handleFontSelect(font.id)
                }
              >
                <div className="signature-preview-main">
                  <span className="signed-by-label">Signed by:</span>
                  <span
                    className="signature-text"
                    style={{ fontFamily: `"${font.family}", cursive` }}
                  >
                    {fullName || "Your Name"}
                  </span>
                </div>
                <div className="initials-preview-box">
                  <span className="ds-label">DS</span>
                  <span
                    className="initials-text"
                    style={{ fontFamily: `"${font.family}", cursive` }}
                  >
                    {initials || "IN"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="signature-dialog-overlay">
      <div className="signature-dialog">
        <div className="signature-dialog-header">
          <h2 className="dialog-title">Edit Your Signature</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="signature-dialog-content">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullNameInput">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="fullNameInput"
                value={fullName}
                onChange={handleFullNameChange}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="initialsInput">
                Initials <span className="required">*</span>
              </label>
              <input
                type="text"
                id="initialsInput"
                value={initials}
                onChange={handleInitialsChange}
                className="text-input initials-input-field"
                maxLength="3"
              />
            </div>
          </div>
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "SAVED" ? "active" : ""}`}
              onClick={() => setActiveTab("SAVED")}
            >
              SAVED
            </button>
            <button
              className={`tab-button ${activeTab === "CHOOSE" ? "active" : ""}`}
              onClick={() => setActiveTab("CHOOSE")}
            >
              CHOOSE
            </button>
            <button
              className={`tab-button ${activeTab === "DRAW" ? "active" : ""}`}
              onClick={() => setActiveTab("DRAW")}
            >
              DRAW
            </button>
          </div>
          {renderTabContent()}
          <p className="disclaimer-text">
            By clicking Create, I agree that the signature and initials will be
            the electronic representation of my signature and initials for all
            purposes when I (or my agent) use them on envelopes, including
            legally binding contracts.
          </p>{" "}
        </div>

        {activeTab !== "DRAW" && (
          <div className="signature-dialog-footer">
            <button
              className="action-button create-button"
              onClick={handleCreate}
            >
              CREATE
            </button>
            <button className="action-button cancel-button" onClick={onClose}>
              CANCEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignatureDialog;
