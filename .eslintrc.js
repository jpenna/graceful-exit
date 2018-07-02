module.exports = {
  "extends": "airbnb-base",
  "rules": {
    "consistent-return": 0,
    "no-plusplus": 0,
    "object-curly-newline": ["warn", {
      "ImportDeclaration": { "consistent": true },
    }],
  },
};
