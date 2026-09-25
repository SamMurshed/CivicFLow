import { render } from '@testing-library/react';
import { expect, test } from 'vitest';

test('smoke: renders CivicFlow text', () => {
  const { getByText } = render(<div>CivicFlow</div>);
  expect(getByText('CivicFlow')).toBeInTheDocument();
});
