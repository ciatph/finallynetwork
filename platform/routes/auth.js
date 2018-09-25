let express = require('express');
let steem = require('../modules/steemconnect')
let router = express.Router();

/* GET auth listing. */
router.get('/', (req, res, next) => {
    console.log('testing auth')
    if (!req.query.access_token ) {
        console.log('no token')
        let uri = steem.getLoginURL();
        console.log(uri);
        res.redirect(uri);
    } else {
        steem.setAccessToken(req.query.access_token);
        console.log(req.query.access_token)
        steem.me((err, steemResponse) => {
          req.session.steemconnect = steemResponse.account;
          req.session.access_token = req.query.access_token;
          res.redirect('/dashboard')
        });
    }
});

router.get('/logout', (req, res) => {
   req.session.destroy();
   res.redirect("/")
});

module.exports = router;
