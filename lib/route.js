var request = require('request');

module.exports = function(app, config) {
  app.get('/github_authorize', function(req, res) {
    var uri = 'https://github.com/login/oauth/authorize?';
    var params = 'scope=user&client_id=' + config.github.client_id+ '&redirect_uri=' + req.protocol + '://' + req.headers.host + '/callback';

    res.redirect(uri + params);
  });

  app.get('/callback', function(req, res) {
    getAccessToken(req.query.code);

    function getAccessToken(code) {
      request.post(
        'https://github.com/login/oauth/access_token',
        {
          form : {
            client_id: config.github.client_id,
            client_secret: config.github.client_secret,
            code: code,
            accept: 'json'
          },
        },
        function (err, response, body) {
          if (err) {
            res.send(err.message);
            return;
          }

          var accessToken = body.split('&')[0].split('=')[1];
          gerUserInfo(accessToken);
        }
      );
    }

    function gerUserInfo(token) {
      request.get('https://api.github.com/user',
        {
          headers: {
            'User-Agent': 'request',
            Authorization: 'token ' + token
          }
        },
        function (err, request, ret) {
          if (err) {
            res.send(err.message);
            return;
          }

          var ret = JSON.parse(ret);
          if (ret.message) {
            res.send(ret.message);
            return;
          }

          req.session['login'] = ret.login;
          done();
        }
      );

      function done() {
        res.redirect('/');
      }
    }
  });
};
