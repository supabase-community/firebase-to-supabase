# Firebase to Supabase: Auth Migration

This module automates the process of converting auth users from a Firebase project to a Supabase project.  There are 3 parts to the migration process:

- `firestoreusers2json` exports users from an existing Firebase project to a `.json` file on your local system
- `import_users` imports users from a saved `.json` file into your Supabase project (inserting those users into the `auth.users` table of your `PostgreSQL` database instance)
- `middleware` server component for verifying a user's existing Firebase password and updating that password in your Supabase project the first time a user logs in **[WORK IN PROGRESS]**
    - [done] local node server for checking Firebase password
    - [done] [fly.io](https://fly.io) server for checking Firebase password
    - [tbd] AWS Lambda server for checking Firebase password
    - [tbd] local node server for updating Supabase password on first login
    - [tbd] [fly.io](https://fly.io) server for updating Supabase password on first login
    - [tbd] AWS Lambda server for updating Supabase password on first login


### Configuration

#### Download your `firebase-service.json` file from the Firebase Console
* log into your Firebase Console
* open your project
* click the gear icon to the right of `Project Overview` at the top left, then click `Project Settings`
* click `Service Accounts` at the center of the top menu
* select `Firebase Admin SDK` at the left then click the `Generate new private key` button on the right (bottom)
* click `Generate key`
* rename the downloaded file to `firebase-service.json`

#### Set up your `supabase-service.json` file
* copy or rename `supabase-service-sample.json` to `supabase-service.json`
* edit the `supabase-service.json` file:
    * log in to [app.supabase.io](https://app.supabase.io) and open your project
    * click the `settings` (gear) icon at the bottom of the left menu
    * click `Database` from the `Settings Menu`
    * scroll down and find your `Host` string under `Connection info`, copy that to the `host` entry in your `supabase-service.json` file.
    * enter the password you used when you created your Supabase project in the `password` entry in the `supabase-service.json` file
    * save the `supabase-service.json` file

#### Save your Firebase Password Hash Parameters
* log into your Firebase Console
* open your project
* select `Authentication` in the menu on the left
* select `Users` at the top bar
* click the 3 dots context menu button at the top right corner of the users list
* click `Password hash parameters` from the context menu
* copy and save your parameters for `base64_signer_key`, `base64_salt_separator`, `rounds`, and `mem_cost`

Sample `Password hash parameters`:
```
hash_config {
  algorithm: SCRYPT,
  base64_signer_key: XXXX/XXX+XXXXXXXXXXXXXXXXX+XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX==,
  base64_salt_separator: Aa==,
  rounds: 8,
  mem_cost: 14,
}
```

#### Set your Hash Parameters
Now that you have your 4 hash parameters, you can set them up in your environment(s):
##### For a local development server (or hosting your own `NodeJS` server):
* copy the file `local.env.sh.sample` to `local.env.sh`
* edit the `MEMCOST`, `ROUNDS`, `SALTSEPARATOR`, and `SIGNERKEY` environment variables you obtained in the previous step

Sample `local.env.sh` file:
```
export PORT=3000
export MEMCOST=14
export ROUNDS=8
export SALTSEPARATOR=Aa== 
export SIGNERKEY=XXXX/XXX+XXXXXXXXXXXXXXXXX+XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX==
```
##### For hosting globally using [fly.io](https://fly.io):
* copy the `fly.toml.sample` file to `fly.toml`
* edit the `[env]` section of the `fly.toml` to match the values you obtained in the previous step for `MEMCOST`, `ROUNDS`, `SALTSEPARATOR`, and `SIGNERKEY`

Sample `[env]` section for the `fly.toml` file:
```
[env]
  PORT = "8080"
  MEMCOST = 14
  ROUNDS = 8
  SALTSEPARATOR = "Aa==" 
  SIGNERKEY = "XXXX/XXX+XXXXXXXXXXXXXXXXX+XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=="
```

### Command Line Syntax

#### Dump Firestore users to a JSON file
`node firestoreusers2json.js [<filename.json>] [<batch_size>]`
* `filename.json`: (optional) output filename (defaults to ./users.json')
* `batchSize`: (optional) number of users to fetch in each batch (defaults to 100)

#### Import JSON users file to Supabase Auth (PostgreSQL: auth.users)

`node import_users.js <path_to_json_file> [<batch_size>]`
* `path_to_json_file`: full local path and filename of .json input file (of users)
* `batch_size`: (optional) number of users to process in a batch (defaults to 100)

#### Hosting the Middleware
##### Local hosting for testing (or for running your own server using `NodeJS`):
* make sure you've set up `local.env.sh` as described above
* run `node local.sh`
The `local.sh` file does two things:
```sh
source ./local.env.sh # sets environment variables stored in ./local.env.sh
node server.js # runs the node-based server on the port listed in local.env.sh (defaults to 3000)
```
##### Deploying with [fly.io](https://fly.io)
* make sure you have the [flyctl command line](https://fly.io/docs/getting-started/installing-flyctl/) installed
* configure your `fly.toml` file as described above
* [log or sign up with fly.io](https://fly.io/docs/getting-started/login-to-fly/)
* launch the `fly` app: `flyctl launch`
* deploy the `fly` app: `flyctl deploy`
* see [Build, Deploy and Run a Node Application](https://fly.io/docs/getting-started/node/) for further details

