import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocaleContent } from './useLocaleContent';

const listMock = vi.fn();
const upsertMock = vi.fn();
const publishMock = vi.fn();
const listLocalesMock = vi.fn();

vi.mock('@TheY2T/tmr-web-data/content-translations-api', () => ({
  contentTranslationApi: {
    list: (...a: unknown[]) => listMock(...a),
    upsert: (...a: unknown[]) => upsertMock(...a),
    publish: (...a: unknown[]) => publishMock(...a),
  },
}));

vi.mock('@TheY2T/tmr-web-data/i18n-api', () => ({
  listLocales: (...a: unknown[]) => listLocalesMock(...a),
}));

/** Minimal harness exercising the hook the way a form does. */
function Harness({ entityId }: { entityId: string | null }) {
  const [base, setBase] = useState('Hello');
  const loc = useLocaleContent({
    entityType: 'content',
    entityId,
    specs: [{ field: 'title', kind: 'plain' }],
    baseValues: { title: base },
    onBaseChange: (_field, value) => setBase(value),
    enabled: true,
    locale: 'en',
  });
  return (
    <div>
      <span data-testid="active">{loc.activeLocale}</span>
      <span data-testid="value">{loc.valueFor('title')}</span>
      <span data-testid="base">{loc.baseValueFor('title')}</span>
      <input
        aria-label="editor"
        value={loc.valueFor('title')}
        onChange={(e) => loc.setValueFor('title', e.target.value)}
      />
      {loc.addableLocales.map((l) => (
        <button key={l.code} type="button" onClick={() => loc.addLanguage(l.code)}>
          add {l.code}
        </button>
      ))}
      {loc.availableLocales
        .filter((l) => l.code !== loc.baseLocale)
        .map((l) => (
          <button key={l.code} type="button" onClick={() => loc.setActiveLocale(l.code)}>
            switch {l.code}
          </button>
        ))}
      <button type="button" onClick={() => void loc.publishActive()}>
        publish
      </button>
    </div>
  );
}

describe('useLocaleContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listLocalesMock.mockResolvedValue([
      { code: 'en', label: 'EN' },
      { code: 'zh-Hans', label: '中文' },
    ]);
    listMock.mockResolvedValue([]);
    upsertMock.mockResolvedValue({});
    publishMock.mockResolvedValue(1);
  });

  it('binds to base state in the base locale and routes edits back to the form', async () => {
    render(<Harness entityId="e1" />);
    expect(screen.getByTestId('active').textContent).toBe('en');
    expect(screen.getByTestId('value').textContent).toBe('Hello');

    fireEvent.change(screen.getByLabelText('editor'), { target: { value: 'Hi there' } });
    expect(screen.getByTestId('value').textContent).toBe('Hi there');
  });

  it('rebinds to the translation buffer in a target locale, keeping the English reference', async () => {
    render(<Harness entityId="e1" />);
    const addButton = await screen.findByText('add zh-Hans');
    fireEvent.click(addButton);

    expect(screen.getByTestId('active').textContent).toBe('zh-Hans');
    // Buffer starts empty; the base value is still available for reference.
    expect(screen.getByTestId('value').textContent).toBe('');
    expect(screen.getByTestId('base').textContent).toBe('Hello');
  });

  it('publishes a target locale by upserting the draft then publishing that locale', async () => {
    render(<Harness entityId="e1" />);
    fireEvent.click(await screen.findByText('add zh-Hans'));
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: '你好' } });
    fireEvent.click(screen.getByText('publish'));

    await waitFor(() => expect(upsertMock).toHaveBeenCalled());
    expect(upsertMock).toHaveBeenCalledWith({
      entityType: 'content',
      entityId: 'e1',
      locale: 'zh-Hans',
      field: 'title',
      value: '你好',
    });
    expect(publishMock).toHaveBeenCalledWith('content', 'e1', 'zh-Hans');
  });

  it('seeds the buffer from existing published rows', async () => {
    listMock.mockResolvedValue([
      {
        locale: 'zh-Hans',
        field: 'title',
        publishedValue: '致爱丽丝',
        status: 'published',
        deleted: false,
      },
    ]);
    render(<Harness entityId="e1" />);
    // The locale with rows becomes selectable; switching to it shows the loaded value.
    fireEvent.click(await screen.findByText('switch zh-Hans'));
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('致爱丽丝'));
  });
});
