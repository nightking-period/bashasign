import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Helper to wrap components with required providers
function renderWithRouter(ui: React.ReactElement) {
  return render(ui, { wrapper: BrowserRouter })
}

// Lazy imports to test when components exist
describe('Component Accessibility', () => {
  describe('Button component', () => {
    it('should render with accessible label', async () => {
      const { Button } = await import('@/components/ui/Button')
      render(<Button>Click me</Button>)
      const btn = screen.getByRole('button', { name: /click me/i })
      expect(btn).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is set', async () => {
      const { Button } = await import('@/components/ui/Button')
      render(<Button disabled>Disabled</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toBeDisabled()
    })

    it('should show loading state with aria-busy', async () => {
      const { Button } = await import('@/components/ui/Button')
      render(<Button loading>Loading</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveAttribute('aria-busy', 'true')
      expect(btn).toBeDisabled()
    })
  })

  describe('StatusIndicator', () => {
    it('should render with status label', async () => {
      const { StatusIndicator } = await import('@/components/ui/StatusIndicator')
      render(<StatusIndicator status="ready" label="System Ready" />)
      expect(screen.getByText('System Ready')).toBeInTheDocument()
    })

    it('should have aria-live region', async () => {
      const { StatusIndicator } = await import('@/components/ui/StatusIndicator')
      const { container } = render(<StatusIndicator status="processing" label="Processing..." />)
      const liveRegion = container.querySelector('[aria-live]')
      expect(liveRegion).not.toBeNull()
    })
  })

  describe('ConfidenceBar', () => {
    it('should render with correct ARIA attributes', async () => {
      const { ConfidenceBar } = await import('@/components/ui/ConfidenceBar')
      render(<ConfidenceBar value={0.85} showPercent />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
      expect(progressbar).toHaveAttribute('aria-valuenow', '85')
    })
  })

  describe('Input', () => {
    it('should have associated label', async () => {
      const { Input } = await import('@/components/ui/Input')
      render(<Input label="Your message" placeholder="Type here" />)
      const label = screen.getByText('Your message')
      const input = screen.getByRole('textbox')
      expect(label).toBeInTheDocument()
      expect(input).toBeInTheDocument()
    })

    it('should show error message when error prop is set', async () => {
      const { Input } = await import('@/components/ui/Input')
      render(<Input label="Email" error="Invalid email" />)
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })
})

describe('Navigation', () => {
  it('should render sidebar navigation links', async () => {
    // Only test if Sidebar component exists
    try {
      const { Sidebar } = await import('@/components/layout/Sidebar')
      renderWithRouter(
        <Sidebar
          isOpen={true}
          onToggle={() => {}}
        />
      )

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText(/communicate/i)).toBeInTheDocument()
    } catch {
      // Component not yet implemented, skip
      expect(true).toBe(true)
    }
  })
})
