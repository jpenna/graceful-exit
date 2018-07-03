module.exports = {
  "extends": "airbnb-base",
  "env": {
    "browser": false,
    "node": true,
    "mocha": true
  },
  "plugins": [
    "mocha"
  ],
  "rules": {
    "consistent-return": 0,
    "no-plusplus": 0,
    "object-curly-newline": ["warn", {
      "ImportDeclaration": { "consistent": true },
    }],
    "mocha/no-exclusive-tests": "error"
  },
};
