# Proximi.io Portal

This Web Portal is part of the Proximi.io Proximity Platform ecosystem. Web Portal is used to manage the whole proximity installation like places, floors, geofences, beacon fleets, rich action flows etc. 

![Web Portal](https://proximi.io/github_portal1.png)

## Free account registration required

Please note that free account registration is required. Registration can be done beforehand using the registration form at https://proximi.io/registration or when you start the Web Portal and use the registration option at the login page. You'll receive basic instructions on how to get started after the registration via email.

## Init from Github
1. run "git clone https://github.com/proximiio/proximiio-web-portal.git"
2. run "npm install" to install dependencies
3. run "node ./index.js start" to start a portal

## Init from npm
1. run "sudo npm install -g proximiio"
2. run "proximiio start" to start a portal

## Configuration
By default Proximi.io server runs at port **8000** and stores all files into **.proximiio** directory in user's home.
You can override these values by setting environment variables PROXIMIIO_HOME and PORT

```
    export PROXIMIIO_HOME=/opt/proximiio
    export PORT=8043
```

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/proximiio/proximiio-web-portal)

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/proximiio/proximiio-web-portal)
