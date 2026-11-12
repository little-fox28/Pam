module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Bundles Drizzle `.sql` migration files into the JS bundle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};

