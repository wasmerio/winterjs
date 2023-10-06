# Using TypeScript with WinterJS

This example demonstrates how WinterJS can be integrated into a larger
JavaScript project.

## Getting Started

To get started, install dependencies and run the build, like you would with any
other TypeScript project.

```console
$ npm install
$ npm run build
```

This will produce a `index.js` file under `dist/`.

Now that the project is compiled, we can test it locally using the `wasmer`
CLI.

```console
$ wasmer run . --net
INFO wasmer_winter: starting webserver
INFO wasmer_winter::server: starting server on 0.0.0.0:8080 listen=0.0.0.0:8080
```

This will run the package in the current directory (defined in `./wasmer.toml`)
and give it network access (the `--net`) flag.

If everything was successful, you should now have a HTTP server running on
`localhost:8080`.

From here, you can start sending requests to it from another terminal or the
browser:

```console
$ curl http://localhost:8080/ --data 'Hello, World!'
{
    "url": "https://app.wasmer.internal/",
    "method": "POST",
    "headers": {
        "items": {
            "host": [
                "localhost:8080"
            ],
            "user-agent": [
                "curl/8.1.2"
            ],
            "accept": [
                "*/*"
            ],
            "content-length": [
                "13"
            ],
            "content-type": [
                "application/x-www-form-urlencoded"
            ]
        }
    },
    "body": "Hello, World!"
}
```

## Caveats

The WinterJS runner needs to be given a single, self-contained `*.js` file to
run. A bundler will be needed if your code imports external functionality.
