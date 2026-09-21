export default {
  stories: ['../stories/**/*.stories.js'],
  framework: '@storybook/html-vite',
  addons: [],
  core: {disableTelemetry: true},
  staticDirs: [{from: '../design/evidence', to: '/evidence'}],
};
