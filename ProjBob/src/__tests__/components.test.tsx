/**
 * Component tests — shared UI design system
 *
 * Covers: Button, Input, Select, Textarea, Badge, Card, Table, EmptyState,
 * Alert, Dialog, ConfirmDialog, Pagination, Skeleton, FormErrorSummary,
 * StatusBadge, StatCard.
 *
 * All tests run in jsdom via Vitest + React Testing Library.
 */

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Card, { CardHeader } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';
import Dialog from '@/components/ui/Dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import FormErrorSummary from '@/components/ui/FormErrorSummary';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';

// Ensure DOM is cleaned up between each test
afterEach(cleanup);

// ─── Button ──────────────────────────────────────────────────────────────────

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('is disabled and shows busy state when loading', () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole('button', { name: /Loading/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button onClick={handler}>Clickable</Button>);
    await user.click(screen.getByRole('button', { name: 'Clickable' }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button disabled onClick={handler}>NoClick</Button>);
    await user.click(screen.getByRole('button', { name: 'NoClick' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-red-600');
  });
});

// ─── Input ────────────────────────────────────────────────────────────────────

describe('Input', () => {
  it('renders a labelled input', () => {
    render(<Input label="Email address" name="email" />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(<Input label="Email address" name="email-err" error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('sets aria-invalid when there is an error', () => {
    render(<Input label="Email field" name="email-invalid" error="Required" />);
    // aria-invalid is set to the string "true" in HTML
    const input = screen.getByLabelText('Email field');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows description text', () => {
    render(
      <Input
        label="Email desc"
        name="email-desc"
        description="We will never share your email."
      />,
    );
    expect(screen.getByText('We will never share your email.')).toBeInTheDocument();
  });
});

// ─── Select ───────────────────────────────────────────────────────────────────

describe('Select', () => {
  const opts = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders options', () => {
    render(<Select label="Colour choice" options={opts} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders a placeholder option', () => {
    render(<Select label="Colour choice" options={opts} placeholder="Choose one" />);
    expect(screen.getByText('Choose one')).toBeInTheDocument();
  });

  it('shows an error', () => {
    render(<Select label="Colour select err" options={opts} error="Select is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Select is required');
  });
});

// ─── Textarea ─────────────────────────────────────────────────────────────────

describe('Textarea', () => {
  it('renders a labelled textarea', () => {
    render(<Textarea label="Notes field" name="notes" />);
    expect(screen.getByLabelText('Notes field')).toBeInTheDocument();
  });

  it('shows an error', () => {
    render(<Textarea label="Notes err" name="notes-err" error="Too short" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
  });
});

// ─── Badge ────────────────────────────────────────────────────────────────────

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders a dot when requested', () => {
    const { container } = render(<Badge dot>Active</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });
});

// ─── Card ─────────────────────────────────────────────────────────────────────

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello Card</Card>);
    expect(screen.getByText('Hello Card')).toBeInTheDocument();
  });

  it('CardHeader renders title and description', () => {
    render(<CardHeader title="My Card" description="A description" />);
    expect(screen.getByText('My Card')).toBeInTheDocument();
    expect(screen.getByText('A description')).toBeInTheDocument();
  });
});

// ─── Table ────────────────────────────────────────────────────────────────────

describe('Table', () => {
  const columns = [
    { key: 'name', header: 'Full Name' },
    { key: 'role', header: 'User Role' },
  ];
  const rows = [
    { id: '1', name: 'Alice', role: 'Admin' },
    { id: '2', name: 'Bob', role: 'Vendor' },
  ];

  it('renders column headers', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        renderCell={(r, k) => r[k as keyof typeof r]}
      />,
    );
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('User Role')).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        renderCell={(r, k) => r[k as keyof typeof r]}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No results" description="Try adjusting your filters." />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });

  it('renders an action', () => {
    render(<EmptyState title="No results" action={<button>Create new</button>} />);
    expect(screen.getByRole('button', { name: 'Create new' })).toBeInTheDocument();
  });
});

// ─── Alert ────────────────────────────────────────────────────────────────────

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something happened');
  });

  it('renders a title', () => {
    render(<Alert title="Heads up">Info text</Alert>);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });

  it('dismisses when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(<Alert dismissible>Dismiss me</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ─── Dialog ───────────────────────────────────────────────────────────────────

describe('Dialog', () => {
  it('does not render when closed', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Test Dialog">
        Body
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Open Dialog">
        Body content
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Closeable Dialog">
        Body
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Escape Dialog">
        Body
      </Dialog>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has aria-modal and aria-labelledby', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Accessible Dialog">
        Content
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
  });
});

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

describe('ConfirmDialog', () => {
  it('calls onConfirm when confirmed', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Delete item?"
        confirmLabel="Delete"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancelled', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={() => {}}
        title="Delete item?"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole('listitem', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Page 5' })).toBeInTheDocument();
  });

  it('calls onPageChange when a page button is clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={handler} />);
    await user.click(screen.getByRole('listitem', { name: 'Page 3' }));
    expect(handler).toHaveBeenCalledWith(3);
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole('listitem', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('disables Previous on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

describe('Skeleton', () => {
  it('renders a Line with role=status', () => {
    render(<Skeleton.Line />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders a Card preset with aria-busy', () => {
    const { container } = render(<Skeleton.Card />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});

// ─── FormErrorSummary ─────────────────────────────────────────────────────────

describe('FormErrorSummary', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<FormErrorSummary errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error messages', () => {
    render(
      <FormErrorSummary
        errors={{ email: 'Invalid email', nameField: 'Name is required' }}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('each error is a link pointing to the field id', () => {
    render(<FormErrorSummary errors={{ emailLink: 'Invalid email' }} />);
    const link = screen.getByRole('link', { name: 'Invalid email' });
    expect(link).toHaveAttribute('href', '#emailLink');
  });
});

// ─── StatusBadge ──────────────────────────────────────────────────────────────

describe('StatusBadge', () => {
  const allStatuses = [
    'draft',
    'submitted',
    'under_review',
    'awaiting_correction',
    'correction_submitted',
    'approved',
    'rejected',
    'withdrawn',
    'on_hold',
  ] as const;

  allStatuses.forEach((status) => {
    it(`renders "${status}" status without errors`, () => {
      render(<StatusBadge status={status} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it('renders the correct label for "approved"', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders the correct label for "awaiting_correction"', () => {
    render(<StatusBadge status="awaiting_correction" />);
    expect(screen.getByText('Awaiting Correction')).toBeInTheDocument();
  });
});

// ─── StatCard ─────────────────────────────────────────────────────────────────

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Requests" value={42} />);
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<StatCard label="Total" value={5} description="This month" />);
    expect(screen.getByText('This month')).toBeInTheDocument();
  });
});
