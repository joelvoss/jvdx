const config = {
  '*.+(js|jsx|json|yml|yaml|css|less|scss|ts|tsx|md|graphql|mdx|vue)': [
    `npm run format`,
    `npm run lint`,
    // `${jvdx} test --passWithNoTests --findRelatedTests`,
    `git add`,
  ].filter(Boolean),
};

module.exports = config;
