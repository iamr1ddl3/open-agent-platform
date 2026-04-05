import React, { useState } from 'react';
import { Zap, Download, Trash2, Search } from 'lucide-react';
import './SkillsMarketplace.css';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  installed: boolean;
  version: string;
  author: string;
  downloads: number;
}

const AVAILABLE_SKILLS: Skill[] = [
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    description: 'Extract data from websites and parse HTML/CSS',
    category: 'Web',
    tags: ['web', 'data', 'scraping'],
    installed: true,
    version: '1.2.0',
    author: 'OpenAgent',
    downloads: 1243,
  },
  {
    id: 'pdf-processor',
    name: 'PDF Processor',
    description: 'Read, extract, and generate PDF documents',
    category: 'Documents',
    tags: ['pdf', 'documents', 'processing'],
    installed: false,
    version: '2.0.1',
    author: 'OpenAgent',
    downloads: 892,
  },
  {
    id: 'csv-analyzer',
    name: 'CSV Analyzer',
    description: 'Analyze and transform CSV and spreadsheet data',
    category: 'Data',
    tags: ['data', 'csv', 'analytics'],
    installed: true,
    version: '1.5.2',
    author: 'Community',
    downloads: 567,
  },
  {
    id: 'email-sender',
    name: 'Email Sender',
    description: 'Send emails and manage email templates',
    category: 'Communication',
    tags: ['email', 'messaging', 'smtp'],
    installed: false,
    version: '1.0.0',
    author: 'Community',
    downloads: 432,
  },
  {
    id: 'slack-integration',
    name: 'Slack Integration',
    description: 'Post messages and interact with Slack',
    category: 'Communication',
    tags: ['slack', 'messaging', 'integration'],
    installed: false,
    version: '1.3.0',
    author: 'OpenAgent',
    downloads: 1876,
  },
  {
    id: 'database-query',
    name: 'Database Query',
    description: 'Execute SQL queries on various databases',
    category: 'Data',
    tags: ['database', 'sql', 'data'],
    installed: false,
    version: '2.1.0',
    author: 'OpenAgent',
    downloads: 945,
  },
];

const CATEGORIES = ['All', ...new Set(AVAILABLE_SKILLS.map((s) => s.category))];

export function SkillsMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [skills, setSkills] = useState(AVAILABLE_SKILLS);

  const filteredSkills = skills.filter((skill) => {
    const categoryMatch = selectedCategory === 'All' || skill.category === selectedCategory;
    const searchMatch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const handleInstall = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, installed: true } : s))
    );
  };

  const handleUninstall = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, installed: false } : s))
    );
  };

  const installedCount = skills.filter((s) => s.installed).length;

  return (
    <div className="skills-marketplace">
      <div className="marketplace-header">
        <div className="marketplace-title-section">
          <Zap size={28} className="marketplace-icon" />
          <div>
            <h1>Skills Marketplace</h1>
            <p className="marketplace-subtitle">
              {installedCount} skills installed • {skills.length} total available
            </p>
          </div>
        </div>
      </div>

      <div className="marketplace-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="skills-grid">
        {filteredSkills.length === 0 ? (
          <div className="skills-empty">
            <Zap size={48} className="empty-icon" />
            <h3>No skills found</h3>
            <p>Try adjusting your search or category filters</p>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <div key={skill.id} className="skill-card card">
              <div className="skill-card-header">
                <div className="skill-info">
                  <h3>{skill.name}</h3>
                  <p className="skill-description">{skill.description}</p>
                </div>
                <span className="skill-version">v{skill.version}</span>
              </div>

              <div className="skill-meta">
                <span className="badge badge-secondary">{skill.category}</span>
                {skill.tags.map((tag) => (
                  <span key={tag} className="skill-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="skill-stats">
                <div className="stat-item">
                  <span className="stat-label">Downloads</span>
                  <span className="stat-value">{skill.downloads.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Author</span>
                  <span className="stat-value">{skill.author}</span>
                </div>
              </div>

              <div className="skill-actions">
                {skill.installed ? (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleUninstall(skill.id)}
                  >
                    <Trash2 size={14} />
                    Uninstall
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleInstall(skill.id)}
                  >
                    <Download size={14} />
                    Install
                  </button>
                )}
              </div>

              {skill.installed && (
                <div className="skill-installed-badge">✓ Installed</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
