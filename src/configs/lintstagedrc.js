const config = {
  '*.+(js|jsx|json|yml|yaml|css|less|scss|ts|tsx|md|graphql|mdx|vue)': [
    `npm run format`,
    `npm run lint`,
  ].filter(Boolean),
};

module.exports = config;
