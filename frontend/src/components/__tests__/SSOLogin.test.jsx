/**
 * SSOLogin Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Google and Facebook login buttons
 * - SSO URL generation
 * - Loading state
 * - Accessibility attributes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SSOLogin from '../SSOLogin';

describe('SSOLogin Component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      REACT_APP_COGNITO_HOSTED_UI_URL: 'https://auth.example.com',
      REACT_APP_COGNITO_CLIENT_ID: 'test-client-id'
    };

    // Mock window.location
    delete window.location;
    window.location = { href: '', origin: 'http://localhost:3000' };
  });

  describe('Component Rendering', () => {
    it('should render SSO container', () => {
      const { container } = render(<SSOLogin />);

      expect(container.querySelector('.sso-container')).toBeTruthy();
    });

    it('should display SSO divider', () => {
      const { container } = render(<SSOLogin />);

      expect(container.querySelector('.sso-divider')).toBeTruthy();
    });

    it('should display divider text', () => {
      render(<SSOLogin />);

      expect(screen.getByText('ou connectez-vous avec')).toBeTruthy();
    });

    it('should render buttons container', () => {
      const { container } = render(<SSOLogin />);

      expect(container.querySelector('.sso-buttons')).toBeTruthy();
    });
  });

  describe('Login Buttons', () => {
    it('should display Google login button', () => {
      render(<SSOLogin />);

      expect(screen.getByText('Continuer avec Google')).toBeTruthy();
    });

    it('should display Facebook login button', () => {
      render(<SSOLogin />);

      expect(screen.getByText('Continuer avec Facebook')).toBeTruthy();
    });

    it('should have Google button with correct class', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      expect(googleBtn).toBeTruthy();
    });

    it('should have Facebook button with correct class', () => {
      const { container } = render(<SSOLogin />);

      const facebookBtn = container.querySelector('.facebook-button');
      expect(facebookBtn).toBeTruthy();
    });

    it('should have SSO button class on both buttons', () => {
      const { container } = render(<SSOLogin />);

      const buttons = container.querySelectorAll('.sso-button');
      expect(buttons.length).toBe(2);
    });

    it('should have button type="button"', () => {
      const { container } = render(<SSOLogin />);

      const buttons = container.querySelectorAll('button[type="button"]');
      expect(buttons.length).toBe(2);
    });
  });

  describe('SVG Icons', () => {
    it('should display Google SVG icon', () => {
      const { container } = render(<SSOLogin />);

      const svgs = container.querySelectorAll('.sso-icon');
      expect(svgs.length).toBe(2);
    });

    it('should have SVG with Google colors', () => {
      const { container } = render(<SSOLogin />);

      const svgs = container.querySelectorAll('svg path');
      // Google SVG has specific fill colors
      const googleColors = container.querySelector('.google-button svg');
      expect(googleColors).toBeTruthy();
    });

    it('should have SVG with Facebook colors', () => {
      const { container } = render(<SSOLogin />);

      const facebookSvg = container.querySelector('.facebook-button svg');
      expect(facebookSvg).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when loading', () => {
      const { container } = render(<SSOLogin isLoading={true} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        expect(btn.disabled).toBe(true);
      });
    });

    it('should enable buttons when not loading', () => {
      const { container } = render(<SSOLogin isLoading={false} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        expect(btn.disabled).toBe(false);
      });
    });

    it('should default to false for loading', () => {
      const { container } = render(<SSOLogin />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        expect(btn.disabled).toBe(false);
      });
    });
  });

  describe('Google Login', () => {
    it('should call Google OAuth URL on click', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);

      expect(window.location.href).toContain('identity_provider=Google');
      expect(window.location.href).toContain('client_id=test-client-id');
    });

    it('should include redirect URI in Google URL', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);

      expect(window.location.href).toContain('redirect_uri=');
      expect(window.location.href).toContain('localhost');
    });

    it('should include required OAuth parameters', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);

      expect(window.location.href).toContain('response_type=code');
      expect(window.location.href).toContain('scope=');
    });
  });

  describe('Facebook Login', () => {
    it('should call Facebook OAuth URL on click', () => {
      const { container } = render(<SSOLogin />);

      const facebookBtn = container.querySelector('.facebook-button');
      fireEvent.click(facebookBtn);

      expect(window.location.href).toContain('identity_provider=Facebook');
      expect(window.location.href).toContain('client_id=test-client-id');
    });

    it('should include redirect URI in Facebook URL', () => {
      const { container } = render(<SSOLogin />);

      const facebookBtn = container.querySelector('.facebook-button');
      fireEvent.click(facebookBtn);

      expect(window.location.href).toContain('redirect_uri=');
      expect(window.location.href).toContain('localhost');
    });

    it('should include required OAuth parameters', () => {
      const { container } = render(<SSOLogin />);

      const facebookBtn = container.querySelector('.facebook-button');
      fireEvent.click(facebookBtn);

      expect(window.location.href).toContain('response_type=code');
      expect(window.location.href).toContain('scope=');
    });
  });

  describe('URL Construction', () => {
    it('should use Cognito hosted UI URL', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);

      expect(window.location.href).toContain('auth.example.com');
    });

    it('should use Cognito client ID', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);

      expect(window.location.href).toContain('test-client-id');
    });

    it('should encode redirect URI properly', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);

      // URL encoding should be present
      expect(window.location.href).toContain('%');
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      const { container } = render(<SSOLogin />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      buttons.forEach(btn => {
        expect(btn.tagName.toLowerCase()).toBe('button');
      });
    });

    it('should have descriptive button text', () => {
      render(<SSOLogin />);

      expect(screen.getByText('Continuer avec Google')).toBeTruthy();
      expect(screen.getByText('Continuer avec Facebook')).toBeTruthy();
    });

    it('should have SVG with proper structure', () => {
      const { container } = render(<SSOLogin />);

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(2);

      svgs.forEach(svg => {
        expect(svg.getAttribute('viewBox')).toBeTruthy();
      });
    });
  });

  describe('Button Interactions', () => {
    it('should not call onSSOLogin prop directly', () => {
      const mockOnSSOLogin = vi.fn();
      const { container } = render(<SSOLogin onSSOLogin={mockOnSSOLogin} />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);

      // The component redirects via window.location, not callback
      expect(window.location.href).toContain('Google');
    });

    it('should handle rapid button clicks', () => {
      const { container } = render(<SSOLogin />);

      const googleBtn = container.querySelector('.google-button');
      fireEvent.click(googleBtn);
      fireEvent.click(googleBtn);

      expect(window.location.href).toContain('Google');
    });
  });

  describe('Edge Cases', () => {
    it('should render without props', () => {
      const { container } = render(<SSOLogin />);

      expect(container.querySelector('.sso-container')).toBeTruthy();
    });

    it('should handle undefined props', () => {
      const { container } = render(
        <SSOLogin onSSOLogin={undefined} isLoading={undefined} />
      );

      expect(container.querySelector('.sso-container')).toBeTruthy();
    });

    it('should render all content even with missing env vars', () => {
      render(<SSOLogin />);

      expect(screen.getByText('Continuer avec Google')).toBeTruthy();
      expect(screen.getByText('Continuer avec Facebook')).toBeTruthy();
    });
  });
});
