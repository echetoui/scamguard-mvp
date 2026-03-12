/**
 * User Management Module
 * Handles user CRUD operations, export, and audit logs
 * Story Points: 10
 */

import React, { useState, useEffect } from 'react';
import '../styles/UserManagement.css';

const UserManagement = ({ institutionId }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [institutionId]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/users?institutionId=${institutionId}`);
      // const data = await response.json();

      // Mock data for MVP
      const mockUsers = [
        {
          id: 1,
          email: 'admin@institution.ca',
          name: 'Admin User',
          role: 'admin',
          status: 'active',
          createdAt: '2026-01-15',
          analysesCount: 456,
          lastLogin: '2026-03-12T14:30:00'
        },
        {
          id: 2,
          email: 'senior1@institution.ca',
          name: 'Marie Dupont',
          role: 'user',
          status: 'active',
          createdAt: '2026-02-01',
          analysesCount: 23,
          lastLogin: '2026-03-11T10:15:00'
        },
        {
          id: 3,
          email: 'senior2@institution.ca',
          name: 'Jean Côté',
          role: 'user',
          status: 'inactive',
          createdAt: '2026-02-10',
          analysesCount: 5,
          lastLogin: '2026-02-28T09:00:00'
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      // TODO: Call delete API
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'Nom', 'Rôle', 'Statut', 'Analyses', 'Créé le'],
      ...filteredUsers.map(u => [
        u.email,
        u.name,
        u.role,
        u.status,
        u.analysesCount,
        u.createdAt
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${institutionId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="user-management-loading">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>Gestion des Utilisateurs</h2>
        <div className="user-management-actions">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            ➕ Ajouter Utilisateur
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 Exporter CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="user-management-filters">
        <input
          type="text"
          placeholder="Rechercher par email ou nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-input"
          aria-label="Search users"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
          aria-label="Filter by role"
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Administrateur</option>
          <option value="user">Utilisateur</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="user-management-table-wrapper">
        <table className="user-management-table" role="grid">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Analyses</th>
              <th>Créé le</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className={`user-row user-${user.status}`}>
                  <td className="email-cell">{user.email}</td>
                  <td>{user.name}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role === 'admin' ? '👤 Admin' : '👥 Utilisateur'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status === 'active' ? '✓ Actif' : '⊘ Inactif'}
                    </span>
                  </td>
                  <td className="numeric">{user.analysesCount}</td>
                  <td className="date">{user.createdAt}</td>
                  <td className="date">
                    {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-view"
                      onClick={() => setSelectedUser(user)}
                      title="View user details"
                      aria-label={`View details for ${user.name}`}
                    >
                      👁️
                    </button>
                    <button
                      className="btn-action btn-edit"
                      title="Edit user"
                      aria-label={`Edit ${user.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete user"
                      aria-label={`Delete ${user.name}`}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Footer */}
      <div className="user-management-stats">
        <div className="stat">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Actifs:</span>
          <span className="stat-value">{users.filter(u => u.status === 'active').length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Inactifs:</span>
          <span className="stat-value">{users.filter(u => u.status === 'inactive').length}</span>
        </div>
      </div>

      {/* User Details Modal (Placeholder) */}
      {selectedUser && (
        <div className="user-details-modal" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedUser(null)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <h3>Détails de l'Utilisateur</h3>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Nom:</strong> {selectedUser.name}</p>
            <p><strong>Rôle:</strong> {selectedUser.role}</p>
            <p><strong>Statut:</strong> {selectedUser.status}</p>
            <p><strong>Analyses:</strong> {selectedUser.analysesCount}</p>
            <p><strong>Créé le:</strong> {selectedUser.createdAt}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
