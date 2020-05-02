const config = {
  '*.+(js|jsx|json|yml|yaml|css|less|scss|ts|tsx|md|graphql|mdx|vue)': [
    `./Taskfile.sh format`,
    `./Taskfile.sh lint`,
  ].filter(Boolean),
};

module.exports = config;
