import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip';
import { CollapsibleSection } from './CollapsibleSection';

afterEach(cleanup);

const info = () => screen.getByRole('button', { name: 'Mer informasjon' });

// Regression: the ⓘ only reacted to mouse hover, so it never opened on a phone
describe('Tooltip', () => {
  it('opens on tap and closes on a tap elsewhere', () => {
    render(createElement('div', null, createElement(Tooltip, { text: 'Forklaring' }, 'Besøkende'), createElement('p', null, 'utenfor')));

    fireEvent.click(info());
    expect(screen.getByRole('tooltip').textContent).toBe('Forklaring');
    expect(info().getAttribute('aria-describedby')).toBe(screen.getByRole('tooltip').id);

    fireEvent.pointerDown(screen.getByText('utenfor'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes on Escape', () => {
    render(createElement(Tooltip, { text: 'Forklaring' }));
    fireEvent.click(info());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('CollapsibleSection info', () => {
  // The ⓘ used to sit inside the section's toggle button: tapping it collapsed the section
  it('opens the explanation without toggling the section', () => {
    render(createElement(CollapsibleSection, { id: 'audience', title: 'Publikum', info: 'Hvem som besøker', children: 'innhold' }));

    fireEvent.click(info());

    expect(screen.getByRole('tooltip').textContent).toBe('Hvem som besøker');
    expect(screen.getByText('innhold')).toBeTruthy();
    expect(info().closest('button[aria-expanded]')).toBeNull();
  });
});
