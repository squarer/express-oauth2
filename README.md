# express-oauth2

## Installation

``` bash
$ npm install express-oauth2
```

## Usage


``` js
var app = express();
var session = require('express-session');
var config = require('./oauth_config');

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

require('express-oauth2')(app, config);
```

``` html
<a href="github_authorize">login</a>
```

``` js
req.session['login']
```