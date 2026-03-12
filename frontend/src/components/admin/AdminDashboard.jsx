/**
 * Admin Dashboard Component
 * Central administrative interface for institutional partners
 *
 * Features:
 * - User Management (CRUD, export, audit logs)
 * - Analytics Dashboard (DAU, threats, retention)
 * - API Key Management (generation, rate limiting, usage)
 * - Settings & Branding (white-label customization)
 */

import React, { useState } from 'react';
import './AdminDashboard.css';
import UserManagement from './modules/UserManagement';
import AnalyticsDashboard from './modules/AnalyticsDashboard';
import APIKeyManagement from './modules/APIKeyManagement';
import SettingsBranding from './modules/SettingsBranding';

const AdminDashboard = ({ institutionId, role = 'admin' }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user has permission to access admin dashboard
  const hasAdminAccess = ['admin', 'institutional_admin'].includes(role);

  if (!hasAdminAccess) {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-container">
          <h1>Accès Refusé</h1>
          <p>Vous n'avez pas les permissions nécessaires pour accéder au tableau de bord administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>ScamGuard Admin</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytiques
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Gestion Utilisateurs
          </button>
          <button
            className={`nav-item ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-keys')}
          >
            🔑 Clés API
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Paramètres
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="institution-info">
            <p className="institution-id">ID: {institutionId}</p>
            <p className="role-badge">Rôle: {role}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        {/* Header */}
        <header className="admin-header">
          <h1>Tableau de Bord Administrateur</h1>
          <div className="header-actions">
            <span className="timestamp">
              Mis à jour: {new Date().toLocaleTimeString('fr-FR')}
            </span>
          </div>
        </header>

        {/* Tab Content */}
        <div className="admin-tabs-container">
          {activeTab === 'analytics' && (
            <div className="tab-content" role="tabpanel" aria-label="Analytiques">
              <AnalyticsDashboard institutionId={institutionId} />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="tab-content" role="tabpanel" aria-label="Gestion Utilisateurs">
              <UserManagement institutionId={institutionId} />
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="tab-content" role="tabpanel" aria-label="Clés API">
              <APIKeyManagement institutionId={institutionId} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-content" role="tabpanel" aria-label="Paramètres">
              <SettingsBranding institutionId={institutionId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
