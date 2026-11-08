import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'renderer', 'shell.css'), 'utf8');
const block = (sel: string): string => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

// A drag region swallows the clicks of everything on top of it unless that element is no-drag. The three window controls
// (sidebar toggle, back, forward) sit on the draggable title-bar strip, so they must be no-drag or they do nothing.
describe('shell.css — title bar drag regions', () => {
  it('the title-bar strips are draggable', () => {
    expect(block('#sidebar-drag')).toMatch(/-webkit-app-region:\s*drag/);
    expect(block('#toolbar')).toMatch(/-webkit-app-region:\s*drag/);
  });
  it('the controls on top of them are not', () => {
    expect(block('#controls')).toMatch(/-webkit-app-region:\s*no-drag/);
  });
  it('the toolbar search box and "Yangi xona" button stay clickable', () => {
    expect(block('.search-wrap')).toMatch(/-webkit-app-region:\s*no-drag/);
    expect(block('.primary')).toMatch(/-webkit-app-region:\s*no-drag/);
  });
});
