import * as migration_20260927_030833_initial from './20260927_030833_initial';
import * as migration_20260927_200000_live_preview_autosave from './20260927_200000_live_preview_autosave';
import * as migration_20260927_202302_slug_follows_title_until_publish from './20260927_202302_slug_follows_title_until_publish';

export const migrations = [
  {
    up: migration_20260927_030833_initial.up,
    down: migration_20260927_030833_initial.down,
    name: '20260927_030833_initial',
  },
  {
    up: migration_20260927_200000_live_preview_autosave.up,
    down: migration_20260927_200000_live_preview_autosave.down,
    name: '20260927_200000_live_preview_autosave',
  },
  {
    up: migration_20260927_202302_slug_follows_title_until_publish.up,
    down: migration_20260927_202302_slug_follows_title_until_publish.down,
    name: '20260927_202302_slug_follows_title_until_publish'
  },
];
