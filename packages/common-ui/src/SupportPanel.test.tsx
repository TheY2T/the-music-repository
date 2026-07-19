import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SupportPanel from './SupportPanel';

describe('SupportPanel island', () => {
  it('links to the Ko-fi page and embeds the tip panel for the given handle', () => {
    const { container } = render(<SupportPanel locale="en" kofiUsername="testhandle" />);

    const link = container.querySelector('a[href="https://ko-fi.com/testhandle"]');
    expect(link).not.toBeNull();

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toContain('ko-fi.com/testhandle');
    expect(iframe?.getAttribute('src')).toContain('embed=true');
  });

  it('shows no widget when no handle is configured', () => {
    const { container } = render(<SupportPanel locale="en" />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('a[href^="https://ko-fi.com/"]')).toBeNull();
  });
});
