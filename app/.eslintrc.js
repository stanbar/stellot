module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  globals: {
    REACT_APP_ENV: true,
    KEYBASE_AUTH_SERVER_URL: true,
    EMAILS_AUTH_SERVER_URL: true,
  },
};
