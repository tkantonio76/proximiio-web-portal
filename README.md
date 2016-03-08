# Proximi.io Portal


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
