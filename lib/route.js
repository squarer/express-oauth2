var request = require('request');

module.exports = function(app, config) {
  app.get('/auth/github', function(req, res) {
    var uri = 'https://github.com/login/oauth/authorize?';
    var params = 'scope=user&client_id=' + config.github.client_id+ '&redirect_uri=' + config.github.redirect_uri;

    res.redirect(uri + params);
  });

  app.get('/auth/google', function(req, res) {
    var uri = 'https://accounts.google.com/o/oauth2/v2/auth?';
    var params = 'response_type=code&scope=profile&client_id=' + config.google.client_id+ '&redirect_uri=' + config.google.redirect_uri;

    res.redirect(uri + params);
  });

  var googleCallback = config.google.redirect_uri.replace(/.*\/\/[^\/]*/, '');
  app.get(googleCallback, function(req, res) {
    getAccessToken(req.query.code);

    function getAccessToken(code) {
      request.post(
        'https://www.googleapis.com/oauth2/v4/token',
        {
          form : {
            client_id: config.google.client_id,
            client_secret: config.google.client_secret,
            redirect_uri: config.google.redirect_uri,
            grant_type: 'authorization_code',
            code: code
          },
        },
        function (err, response, body) {
          if (err) {
            res.send(err.message);
            return;
          }

          body = JSON.parse(body);
          if (body.error) {
            res.send(body.error);
            return;
          }

          var accessToken = body.access_token;
          gerUserInfo(accessToken);
        }
      );
    }

    function gerUserInfo(token) {
      request.get('https://www.googleapis.com/plus/v1/people/me',
        {
          headers: {
            'User-Agent': req.headers.host,
            Authorization: 'Bearer ' + token
          }
        },
        function (err, request, ret) {
          if (err) {
            res.send(err.message);
            return;
          }

          var ret = JSON.parse(ret);
          if (ret.error) {
            res.send(ret.error.message);
            return;
          }

          req.session['login'] = ret.displayName;
          done();
        }
      );

      function done() {
        res.redirect('/');
      }
    }
  });


  var githubCallback = config.github.redirect_uri.replace(/.*\/\/[^\/]*/, '');
  app.get(githubCallback, function(req, res) {
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
            'User-Agent': req.headers.host,
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
