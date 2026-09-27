import * as migration_20260927_030833_initial from './20260927_030833_initial';

export const migrations = [
  {
    up: migration_20260927_030833_initial.up,
    down: migration_20260927_030833_initial.down,
    name: '20260927_030833_initial'
  },
];
