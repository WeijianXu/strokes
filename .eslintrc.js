module.exports = {
  root: true,
  // extends: '@react-native-community',
  extends: "airbnb",
  parser: "babel-eslint",
  rules: {
    camelcase: 0,
    'no-underscore-dangle': 0,
    semi: [2, 'always'],
    quotes: [2, 'single'],
    indent: [2, 2],
    "linebreak-style": [2, "unix"],
    "react/jsx-filename-extension": [
      "warn",
      { "extensions": [".js", ".jsx"] }
    ],
    "react/forbid-prop-types": 0,
    "max-len": [
      "warn",
      { "comments": 200 },
      { "code": 120 }
    ],
    "import/no-unresolved": 0,
    "react/prop-types": 1,
    "import/prefer-default-export": 1,
    "no-return-assign": 1,
    "consistent-return": 1,
    "react/no-array-index-key": 1
  }
};
