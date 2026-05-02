import next from 'eslint-config-next';

const config = [
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**', 'data/**', 'aidlc-reports/**'],
  },
];

export default config;
