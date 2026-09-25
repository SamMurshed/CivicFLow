/**
 * UI component barrel export.
 *
 * Import shared components from here:
 *   import { Button, Input, StatusBadge } from '@/components/ui';
 */

export { default as Alert } from './Alert';
export { default as Badge } from './Badge';
export { default as Button } from './Button';
export { default as Card, CardHeader, CardSection } from './Card';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as Dialog, DialogActions } from './Dialog';
export { default as EmptyState } from './EmptyState';
export { default as FormErrorSummary } from './FormErrorSummary';
export { default as Input } from './Input';
export { default as Pagination } from './Pagination';
export { default as Select } from './Select';
export { default as Skeleton } from './Skeleton';
export { default as StatCard } from './StatCard';
export { default as StatusBadge, getStatusLabel } from './StatusBadge';
export { default as Table } from './Table';
export { default as Textarea } from './Textarea';
// UserMenu remains its own default export for backward compat
