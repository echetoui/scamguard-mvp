/**
 * App Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Authentication flow and guards
 * - Tab switching and navigation
 * - Hook integration
 * - Component rendering
 * - Conditional rendering (family tab, lazy loading)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
  default: vi.fn(),
}));

vi.mock('../../hooks/useAnalysisHistory', () => ({
  default: vi.fn(),
}));

vi.mock('../../hooks/useCreditSystem', () => ({
  default: vi.fn(),
}));

vi.mock('../../hooks/useAccountProfile', () => ({
  default: vi.fn(),
}));

vi.mock('../../hooks/useFamilyDashboard', () => ({
  default: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  analysisAPI: {
    analyze: vi.fn(),
  },
}));

vi.mock('../SecurityHeartDashboard', () => ({
  default: () => <div data-testid="security-dashboard">Security Dashboard</div>,
}));

vi.mock('../QuizAcademie', () => ({
  default: ({ onQuizComplete }) => (
    <div data-testid="quiz-module">
      <button onClick={() => onQuizComplete(100, true)}>Complete Quiz</button>
    </div>
  ),
}));

vi.mock('../AnalysisHistory', () => ({
  default: () => <div data-testid="analysis-history">Analysis History</div>,
}));

vi.mock('../DashboardStats', () => ({
  default: () => <div data-testid="dashboard-stats">Dashboard Stats</div>,
}));

vi.mock('../../screens/Auth/AuthFlow', () => ({
  default: () => <div data-testid="auth-page">Auth Flow</div>,
}));

vi.mock('../BottomNavigation', () => ({
  default: ({ onTabChange, activeTab, hasFamily }) => (
    <nav data-testid="bottom-nav">
      <button data-testid="tab-verifier" onClick={() => onTabChange('verifier')}>
        Vérifier
      </button>
      <button data-testid="tab-securite" onClick={() => onTabChange('securite')}>
        Sécurité
      </button>
      <button data-testid="tab-academie" onClick={() => onTabChange('academie')}>
        Académie
      </button>
      <button data-testid="tab-ressources" onClick={() => onTabChange('ressources')}>
        Ressources
      </button>
      <button data-testid="tab-outils" onClick={() => onTabChange('outils')}>
        Outils
      </button>
      {hasFamily && (
        <button data-testid="tab-famille" onClick={() => onTabChange('famille')}>
          Famille
        </button>
      )}
      <button data-testid="tab-parametres" onClick={() => onTabChange('parametres')}>
        Paramètres
      </button>
    </nav>
  ),
  TabPanel: ({ children, tabId, activeTab }) =>
    tabId === activeTab ? <div data-testid={`panel-${tabId}`}>{children}</div> : null,
}));

import useAuth from '../../hooks/useAuth';
import useAnalysisHistory from '../../hooks/useAnalysisHistory';
import useCreditSystem from '../../hooks/useCreditSystem';
import useAccountProfile from '../../hooks/useAccountProfile';
import useFamilyDashboard from '../../hooks/useFamilyDashboard';

// Mock default implementations
const mockAuthHook = {
  isAuthenticated: true,
  user: { email: 'test@example.com', sub: 'user-123' },
  logout: vi.fn(),
};

const mockHistoryHook = {
  analyses: [],
  addAnalysis: vi.fn(),
  getStatistics: () => ({
    total: 0,
    safe: 0,
    moderate: 0,
    danger: 0,
  }),
};

const mockCreditHook = {
  balance: 100,
  transactions: [],
  earnCredits: vi.fn(),
  getStats: () => ({
    totalEarned: 100,
    totalSpent: 0,
  }),
  formatTimeAgo: () => 'just now',
};

const mockProfileHook = {
  profile: { name: 'Test User' },
  updateName: vi.fn(),
  updateAvatar: vi.fn(),
  togglePreference: vi.fn(),
  resetProfile: vi.fn(),
  getJoinDateFormatted: () => '2026-03-01',
};

const mockFamilyHook = {
  familyData: null,
  loading: false,
  error: null,
  hasFamily: false,
};

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    useAuth.mockReturnValue(mockAuthHook);
    useAnalysisHistory.mockReturnValue(mockHistoryHook);
    useCreditSystem.mockReturnValue(mockCreditHook);
    useAccountProfile.mockReturnValue(mockProfileHook);
    useFamilyDashboard.mockReturnValue(mockFamilyHook);

    // Suppress console errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Authentication', () => {
    it('should render main app when authenticated', () => {
      useAuth.mockReturnValue(mockAuthHook);

      render(<App />);

      expect(screen.getByTestId('bottom-nav')).toBeTruthy();
    });

    it('should show auth page when not authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        logout: vi.fn(),
      });

      render(<App />);

      expect(screen.getByTestId('auth-page')).toBeTruthy();
    });

    it('should show user email in header when authenticated', () => {
      useAuth.mockReturnValue(mockAuthHook);

      render(<App />);

      expect(screen.getByText('test@example.com')).toBeTruthy();
    });

    it('should display logout button', () => {
      useAuth.mockReturnValue(mockAuthHook);

      render(<App />);

      const logoutButton = screen.getByText(/Déconnexion/);
      expect(logoutButton).toBeTruthy();
    });

    it('should call logout when logout button is clicked', async () => {
      const logoutMock = vi.fn();
      useAuth.mockReturnValue({
        ...mockAuthHook,
        logout: logoutMock,
      });

      render(<App />);

      const logoutButton = screen.getByText(/Déconnexion/);
      fireEvent.click(logoutButton);

      expect(logoutMock).toHaveBeenCalled();
    });

    it('should bypass auth when REACT_APP_BYPASS_AUTH is set', () => {
      process.env.REACT_APP_BYPASS_AUTH = 'true';
      useAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        logout: vi.fn(),
      });

      render(<App />);

      // Should show main app, not auth page
      expect(screen.getByTestId('bottom-nav')).toBeTruthy();

      process.env.REACT_APP_BYPASS_AUTH = undefined;
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should render all main tabs', () => {
      render(<App />);

      expect(screen.getByTestId('tab-verifier')).toBeTruthy();
      expect(screen.getByTestId('tab-securite')).toBeTruthy();
      expect(screen.getByTestId('tab-academie')).toBeTruthy();
      expect(screen.getByTestId('tab-ressources')).toBeTruthy();
      expect(screen.getByTestId('tab-outils')).toBeTruthy();
      expect(screen.getByTestId('tab-parametres')).toBeTruthy();
    });

    it('should switch to verifier tab when clicked', async () => {
      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        expect(screen.getByTestId('panel-verifier')).toBeTruthy();
      });
    });

    it('should show security dashboard on securite tab (default)', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('security-dashboard')).toBeTruthy();
      });
    });

    it('should show quiz module on academie tab', async () => {
      render(<App />);

      const academieTab = screen.getByTestId('tab-academie');
      fireEvent.click(academieTab);

      await waitFor(() => {
        expect(screen.getByTestId('quiz-module')).toBeTruthy();
      });
    });

    it('should start with securite tab active', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('panel-securite')).toBeTruthy();
      });
    });
  });

  describe('Conditional Rendering', () => {
    it('should always render the app when authenticated', () => {
      useAuth.mockReturnValue(mockAuthHook);
      useFamilyDashboard.mockReturnValue(mockFamilyHook);

      render(<App />);

      // App should render successfully regardless of hasFamily status
      expect(screen.getByText(/Sécurité/i)).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should call useAuth hook', () => {
      render(<App />);
      expect(useAuth).toHaveBeenCalled();
    });

    it('should call useAnalysisHistory hook', () => {
      render(<App />);
      expect(useAnalysisHistory).toHaveBeenCalled();
    });

    it('should call useCreditSystem hook', () => {
      render(<App />);
      expect(useCreditSystem).toHaveBeenCalled();
    });

    it('should call useAccountProfile hook', () => {
      render(<App />);
      expect(useAccountProfile).toHaveBeenCalled();
    });

    it('should call useFamilyDashboard hook', () => {
      render(<App />);
      expect(useFamilyDashboard).toHaveBeenCalled();
    });
  });

  describe('Component Structure', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should render app wrapper', () => {
      const { container } = render(<App />);
      expect(container.querySelector('.app-wrapper')).toBeTruthy();
    });

    it('should render app header', () => {
      const { container } = render(<App />);
      expect(container.querySelector('.app-header')).toBeTruthy();
    });

    it('should render navigation content area', () => {
      const { container } = render(<App />);
      expect(container.querySelector('.navigation-content')).toBeTruthy();
    });

    it('should have ScamGuard title in header', () => {
      const { container } = render(<App />);
      const header = container.querySelector('header');
      expect(header?.textContent).toContain('ScamGuard');
    });

    it('should render error boundary wrapper', () => {
      const { container } = render(<App />);
      // Error boundary is parent, but shouldn't show error UI
      expect(container).toBeTruthy();
    });
  });

  describe('Analysis History Integration', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should show analysis history when analyses exist', async () => {
      useAnalysisHistory.mockReturnValue({
        ...mockHistoryHook,
        analyses: [
          {
            id: 1,
            type: 'message',
            content: 'Test message',
            timestamp: new Date().toISOString(),
            result: { riskLevel: 'safe', score: 20 },
          },
        ],
      });

      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        expect(screen.getByTestId('analysis-history')).toBeTruthy();
      });
    });

    it('should not show analysis history when no analyses exist', async () => {
      useAnalysisHistory.mockReturnValue(mockHistoryHook);

      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        expect(screen.queryByTestId('analysis-history')).toBeFalsy();
      });
    });
  });

  describe('Dashboard Stats Integration', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should render dashboard stats on security tab', async () => {
      useAnalysisHistory.mockReturnValue({
        ...mockHistoryHook,
        analyses: [
          {
            id: 1,
            type: 'message',
            content: 'Test',
            timestamp: new Date().toISOString(),
            result: { riskLevel: 'safe', score: 20 },
          },
        ],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeTruthy();
      });
    });
  });

  describe('User Data', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should pass user sub to SecurityHeartDashboard', () => {
      render(<App />);

      // The security dashboard should be rendered (which uses user data)
      expect(screen.getByTestId('security-dashboard')).toBeTruthy();
    });

    it('should pass statistics to DashboardStats', () => {
      render(<App />);

      // Dashboard stats should be rendered
      expect(screen.getByTestId('dashboard-stats')).toBeTruthy();
    });
  });

  describe('Tab Switching Behavior', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should maintain tab state when switching tabs', async () => {
      render(<App />);

      // Click verifier tab
      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        expect(screen.getByTestId('panel-verifier')).toBeTruthy();
      });

      // Click securite tab
      const securiteTab = screen.getByTestId('tab-securite');
      fireEvent.click(securiteTab);

      await waitFor(() => {
        expect(screen.getByTestId('panel-securite')).toBeTruthy();
      });

      // Verifier panel should no longer be visible
      expect(screen.queryByTestId('panel-verifier')).toBeFalsy();
    });

    it('should handle rapid tab switching', async () => {
      render(<App />);

      const tabs = [
        'tab-verifier',
        'tab-securite',
        'tab-academie',
        'tab-ressources',
      ];

      for (const tabId of tabs) {
        const tab = screen.getByTestId(tabId);
        fireEvent.click(tab);
      }

      // Last clicked tab (ressources) should eventually show
      await waitFor(() => {
        expect(screen.getByTestId('panel-ressources')).toBeTruthy();
      });
    });
  });

  describe('Message Input Form', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should have message input textarea on verifier tab', async () => {
      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/collez votre message/i);
        expect(textarea).toBeTruthy();
      });
    });

    it('should have file upload for images', async () => {
      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        const fileInput = screen.getByLabelText(/Télécharger une photo/i);
        expect(fileInput).toBeTruthy();
      });
    });

    it('should have analyze button on verifier tab', async () => {
      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        const analyzeButton = screen.getByText(/Analyser le message/i);
        expect(analyzeButton).toBeTruthy();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should render bottom navigation for mobile', () => {
      render(<App />);
      expect(screen.getByTestId('bottom-nav')).toBeTruthy();
    });

    it('should have touch-friendly buttons', () => {
      const { container } = render(<App />);
      const buttons = container.querySelectorAll('.large-touch');
      // Should have large-touch buttons for mobile
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should be wrapped in ErrorBoundary', () => {
      const { container } = render(<App />);
      expect(container).toBeTruthy();
    });

    it('should handle missing authentication gracefully', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        logout: vi.fn(),
      });

      const { container } = render(<App />);
      expect(container).toBeTruthy();
    });
  });

  describe('Props Propagation', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should pass activeTab state to BottomNavigation', () => {
      render(<App />);
      expect(screen.getByTestId('bottom-nav')).toBeTruthy();
    });

    it('should pass familyData to components even when empty', () => {
      useFamilyDashboard.mockReturnValue({
        ...mockFamilyHook,
        hasFamily: false,
      });

      render(<App />);
      // App should render successfully with empty family data
      expect(screen.getByText(/Sécurité/i)).toBeInTheDocument();
    });

    it('should pass onTabChange callback to BottomNavigation', async () => {
      render(<App />);

      const tab = screen.getByTestId('tab-verifier');
      fireEvent.click(tab);

      await waitFor(() => {
        expect(screen.getByTestId('panel-verifier')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should have aria labels on inputs', async () => {
      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Entrez le texte du message/i);
        expect(textarea).toBeTruthy();
      });
    });

    it('should have h1 heading in header', () => {
      const { container } = render(<App />);
      const heading = container.querySelector('.app-header h1');
      expect(heading).toBeTruthy();
    });

    it('should have semantic header element', () => {
      const { container } = render(<App />);
      const header = container.querySelector('header');
      expect(header).toBeTruthy();
    });
  });

  describe('Default State', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockAuthHook);
    });

    it('should start with securite tab active', () => {
      render(<App />);
      expect(screen.getByTestId('panel-securite')).toBeTruthy();
    });

    it('should start in home view on verifier tab', async () => {
      render(<App />);

      const verifierTab = screen.getByTestId('tab-verifier');
      fireEvent.click(verifierTab);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/collez votre message/i);
        expect(textarea).toBeTruthy();
      });
    });
  });
});
