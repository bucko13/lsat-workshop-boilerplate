# lsat-workshop-boilerplate <!-- omit in toc -->

A boilerplate project to build proof of concept paywalls with lightning service authentication tokens (LSATs)

- [Install](#install)
- [Setup Regtest Network](#setup-regtest-network)
- [Setup Environment Variables](#setup-environment-variables)
    - [LND configs](#lnd-configs)
- [Usage](#usage)
    - [Free endpoint](#free-endpoint)
    - [Protected Endpoint - baseline](#protected-endpoint---baseline)
    - [Service-level endpoints](#service-level-endpoints)
  - [Enable time based caveats](#enable-time-based-caveats)
- [Customize protected routes](#customize-protected-routes)
- [Useful Resources](#useful-resources)

## Install

```shell
$ git clone git@github.com:bucko13/lsat-workshop-boilerplate.git
$ cd lsat-workshop-boilerplate
$ npm install
```

## Setup Regtest Network

You can choose to connect to a network however you wish, even a live mainnet
node. However, for the purposes of this boilerplate, we'll use Polar.

Go to [https://polarlightning.com](htps://polarlightning.com) and download the application.
Next, you'll want to start a new network. This will create a bitcoin node on simulated local network,
spin up 3 lightning nodes by default, mine blocks and fund all the wallets. Make sure
at least one of your nodes is lnd since that's the only API boltwall currently supports.

Once that's running, create channels between your nodes in the Polar network.

## Setup Environment Variables

Copy the `.env.example` file to a `.env` file locally. This is where you will be setting your
configs for connecting to your lightning node.

If you want to persist LSAT validation between restarts, you'll want to generate a random
secret. You can do this in a Node REPL pretty easily:

```node
const crypto = require('crypto')
crypto.randomBytes(32).toString('hex')
```

Copy and paste the output to your .env file.

#### LND configs

Head back to Polar and choose your lnd node from the network. From the toolbar
on the side, select "Connect", and then you should be able to get the hex versions
of the connection details. Copy these over to the corresponding variables in the `.env` file.

## Usage

You should have everything you need to run the testing server now

Run the following command to spin up a test server. This will restart
anytime a file changes and it automatically compiles your typescript.

```sh
$ npm run dev
```

This will run a server at the localhost port `3000` by default.

A recommended way to interact with the endpoint is using a tool like [Postman](https://www.postman.com/downloads/).
This is a convenient way to read and edit headers which you will need
to use the LSATs.

#### Free endpoint

Now, try and hit the endpoint: `GET localhost:3000/` and you should
get a welcome message.

#### Protected Endpoint - baseline

Next, try and hit the first protected endpoint: `GET localhost:3000/protected`.
This will return a 402 endpoint requiring payment to reach.

To get access to the payment, look at the WWW-Authenticate header.
To parse the LSAT challenge you can paste in to the LSAT Playground
[here](https://lsat-playground.vercel.app/#from-challenge).

Find the invoice and copy it to get ready for payment. You will want to
pay with a tool that will return the preimage as proof of payment.

With polar you do this by launching the terminal and then entering:

```shell
# cli depends on the node implementation, e.g. could be `lncli`
$ lightning-cli pay [bolt11 invoice]
```

Copy the preimage and then go to [Satisfy the LSAT](https://lsat-playground.vercel.app/#satisfy)
in the playground. This is as simple as filling in: `LSAT [MACAROON]:[PREIMAGE]`
but the playground can do this for you just in case.

Copy the satisfied LSAT and add an `Authorization` header to your request
for the protected endpoint with the LSAT as its value.

Try and hit `GET localhost:3000/protected` again with the Authorization header
and it should let you through.

#### Service-level endpoints

To show the power of caveats, you can try and hit the service level endpoints.
`GET localhost:3000/protected/service/1` will fail with the baseline Authorization
LSAT from the previous steps. To get access to the services, head on over
to the playground to [add some caveats](https://lsat-playground.vercel.app/#caveats).

Try adding `service=1`, then copy the resulting macaroon, replacing the existing
macaroon in your LSAT header with the new one. Now, `GET localhost:3000/protected/service/1`
should work. If you try and hit `/service/2` however, you won't be allowed.

If you try and add a greater service level to your existing LSAT, you'll find
that our authorization middleware won't allow it. This is because we've set up a delegation
system, whereby you can give out more restrictive access (service level 2 can add a
caveat that restricts to level 1) but you can't give out less restrictive access (someone
with level 1 access shouldn't be able to give out level 2 access).

Try mixing around adding different caveats and see how it works!

### Enable time based caveats

Finally, you can enable time-based caveats using boltwall's built in configs.
This will make it such that you have limited access once you've paid for your LSAT
such that for every satoshi paid, you'll have 1 second of access.

To enable this set the `ENABLE_TIME_CONFIG` to `true` in the `.env` file.
You will need to turn your server off entirely and start it again for the change
to take effect so that the new environment variable is available at runtime.

## Customize protected routes

All the protected route logic is in `/src/protected.ts`. Fiddle with the different settings,
add new caveat satisfiers for your own custom restrictions, and use logging to
understand how everything is parsed and handled.

## Useful Resources

- [LSAT Playground](https://lsat-playground.vercel.app/)
- [Postman](https://www.postman.com/downloads/)
- [lsat-js](https://github.com/Tierion/lsat-js)
- [boltwall](https://github.com/tierion/boltwall)
- [LSAT Documentation](https://lsat.tech/)
