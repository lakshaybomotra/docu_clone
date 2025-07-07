import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TemplatesPage.css";

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem("pdfTemplates");
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const saveTemplates = (updatedTemplates) => {
    try {
      localStorage.setItem("pdfTemplates", JSON.stringify(updatedTemplates));
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error("Error saving templates:", error);
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: newTemplateName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pdfFiles: [],
      fields: [],
      mergedPdfData: null
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    setNewTemplateName("");
    setShowCreateDialog(false);
    
    // Navigate to template editor
    navigate(`/template-editor/${newTemplate.id}`);
  };

  const handleEditTemplate = (templateId) => {
    navigate(`/template-editor/${templateId}`);
  };

  const handleUseTemplate = (templateId) => {
    navigate(`/editor?template=${templateId}`);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(updatedTemplates);
    }
  };

  const handleDuplicateTemplate = (template) => {
    const duplicatedTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, duplicatedTemplate];
    saveTemplates(updatedTemplates);
  };

  return (
    <div className="templates-page">
      <div className="templates-header">
        <h1>PDF Templates</h1>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowCreateDialog(true)}
          >
            Create New Template
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate("/editor")}
          >
            Single PDF Editor
          </button>
        </div>
      </div>

      <div className="templates-grid">
        {templates.length === 0 ? (
          <div className="empty-state">
            <h3>No templates yet</h3>
            <p>Create your first template to get started</p>
            <button 
              className="btn-primary"
              onClick={() => setShowCreateDialog(true)}
            >
              Create Template
            </button>
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3>{template.name}</h3>
                <div className="template-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditTemplate(template.id)}
                    title="Edit Template"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn duplicate"
                    onClick={() => handleDuplicateTemplate(template)}
                    title="Duplicate Template"
                  >
                    📋
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete Template"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="template-info">
                <p className="pdf-count">
                  {template.pdfFiles.length} PDF{template.pdfFiles.length !== 1 ? 's' : ''}
                </p>
                <p className="field-count">
                  {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
                </p>
                <p className="last-updated">
                  Updated: {new Date(template.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="template-preview">
                {template.pdfFiles.length > 0 ? (
                  <div className="pdf-thumbnails">
                    {template.pdfFiles.slice(0, 3).map((pdf, index) => (
                      <div key={index} className="pdf-thumbnail">
                        📄 {pdf.name}
                      </div>
                    ))}
                    {template.pdfFiles.length > 3 && (
                      <div className="pdf-thumbnail more">
                        +{template.pdfFiles.length - 3} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-pdfs">No PDFs added</div>
                )}
              </div>

              <div className="template-footer">
                <button
                  className="btn-primary use-template"
                  onClick={() => handleUseTemplate(template.id)}
                  disabled={template.pdfFiles.length === 0}
                >
                  Use Template
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Template</h3>
            <div className="form-group">
              <label>Template Name:</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter template name"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={handleCreateTemplate}
              >
                Create
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewTemplateName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;