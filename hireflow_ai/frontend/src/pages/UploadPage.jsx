import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UploadPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UploadPage({ onSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cv_text: '',
    role_applying: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cvFile, setCvFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCvFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          cv_text: event.target.result
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.email || !formData.cv_text || !formData.role_applying) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/candidates/upload`, formData);
      const candidateId = response.data.candidate_id;
      onSuccess(candidateId, formData);
      navigate(`/interview/${candidateId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload CV. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <div className="upload-header">
          <h1>Welcome to HireFlow AI</h1>
          <p>Start your multi-agent interview</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Developer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role_applying">Position You're Applying For *</label>
            <select
              id="role_applying"
              name="role_applying"
              value={formData.role_applying}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a position</option>
              <option value="Junior Developer">Junior Developer</option>
              <option value="Mid-Level Developer">Mid-Level Developer</option>
              <option value="Senior Developer">Senior Developer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Full Stack Engineer">Full Stack Engineer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cv_file">Upload Your CV *</label>
            <div className="file-upload">
              <input
                type="file"
                id="cv_file"
                onChange={handleFileChange}
                accept=".txt,.pdf"
              />
              <div className="file-upload-placeholder">
                <div className="upload-icon">📄</div>
                <p>
                  {cvFile ? cvFile.name : 'Drag and drop your CV or click to browse'}
                </p>
                <span>Supported: TXT, PDF</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cv_text">CV Content *</label>
            <textarea
              id="cv_text"
              name="cv_text"
              value={formData.cv_text}
              onChange={handleInputChange}
              placeholder="Paste your CV content here or upload a file..."
              rows="6"
              required
            />
          </div>

          <div className="form-disclaimer">
            <p>
              ⚠️ Our system includes anti-fraud detection. Ensure all information is accurate.
            </p>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Start Interview'}
          </button>
        </form>

        <div className="upload-info">
          <h3>What to expect:</h3>
          <ul>
            <li>✓ Technical skills evaluation</li>
            <li>✓ Culture fit assessment</li>
            <li>✓ Client understanding test</li>
            <li>✓ Real-time feedback from AI agents</li>
            <li>✓ Fair and transparent evaluation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
