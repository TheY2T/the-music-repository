import type { FaqEntry } from '@TheY2T/tmr-web-acl/dto';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FaqAccordion from './FaqAccordion';

const ENTRIES: FaqEntry[] = [
  {
    id: '1',
    slug: 'what-is-it',
    question: 'What is it?',
    answer: 'A **music** library.',
    category: 'Getting started',
    sortOrder: 0,
  },
  {
    id: '2',
    slug: 'is-it-free',
    question: 'Is it free?',
    answer: 'Yes.',
    category: 'Content & licensing',
    sortOrder: 0,
  },
  {
    id: '3',
    slug: 'do-i-need-an-account',
    question: 'Do I need an account?',
    answer: 'No.',
    category: 'Getting started',
    sortOrder: 1,
  },
];

describe('FaqAccordion island', () => {
  it('groups entries under one heading per category, preserving first-seen order', () => {
    const { container } = render(<FaqAccordion locale="en" entries={ENTRIES} />);
    const headings = Array.from(container.querySelectorAll('h2')).map((h) => h.textContent);
    expect(headings).toEqual(['Getting started', 'Content & licensing']);
  });

  it('renders every question and the Markdown answer as HTML', () => {
    const { container, getByText } = render(<FaqAccordion locale="en" entries={ENTRIES} />);
    expect(getByText('What is it?')).toBeTruthy();
    expect(getByText('Do I need an account?')).toBeTruthy();
    expect(getByText('Is it free?')).toBeTruthy();
    // Markdown bold renders to a <strong> inside the answer.
    expect(container.querySelector('strong')?.textContent).toBe('music');
  });

  it('shows the empty message when there are no entries', () => {
    const { getByText } = render(<FaqAccordion locale="en" entries={[]} />);
    expect(getByText('There are no questions here yet.')).toBeTruthy();
  });
});
