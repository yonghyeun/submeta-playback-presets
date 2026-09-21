export default {
  stories: ['../stories/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-docs'],
  core: {disableTelemetry: true},
  staticDirs: [{from: '../design/evidence', to: '/evidence'}],
};
