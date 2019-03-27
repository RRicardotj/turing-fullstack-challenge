const jwt = require('jsonwebtoken');
// const moment = require('moment');
// const User = require('../models/User');
// const Session = require('../models/Session');


const jwtAuth = (req, res, next) => {
  let token = req.headers.authorization || req.query.token;
  if (req.path.substring(0, 6) !== '/admin' && req.path.substring(0, 5) !== '/user') {
    if (token) {
      token = token.split(' ');

      jwt.verify(
        (token.length > 1 ? token[1] : token[0]),
        process.env.KEY_APP, async (err, decoded) => {
          if (!err) {
            req.customerId = decoded.customerId;
            req.customerLanguage = decoded.customerId;
          }
          return next();
        },
      );
    }

    return next();
  }

  if (!token) { return res.error('TOKEN_NOT_PROVIDED', 403, req.path); }

  token = token.split(' ');

  jwt.verify(
    (token.length > 1 ? token[1] : token[0]),
    process.env.KEY_APP, async (err, decoded) => {
      if (err) {
        console.log(err.message); // eslint-disable-line
        return res.error('TOKEN_INVALID', 403, req.path);
      }
      req.customerId = decoded.customerId;
      req.customerLanguage = decoded.customerId;
      return next();
    },
  );
  return undefined;
};

module.exports = jwtAuth;
