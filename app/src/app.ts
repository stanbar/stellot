import "./ipfs"

export const dva = {
  config: {
    onError(err: ErrorEvent) {
      err.preventDefault();
      console.error(err.message);
    },
  },
  plugins: [REACT_APP_ENV === 'development' ? require('dva-logger')() : {}],
};
