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


### Command Line Syntax

#### Dump Firestore users to a JSON file
`node firestoreusers2json.js [<filename.json>] [<batch_size>]`
* `filename.json`: (optional) output filename (defaults to ./users.json')
* `batchSize`: (optional) number of users to fetch in each batch (defaults to 100)

#### Import JSON users file to Supabase Auth (PostgreSQL: auth.users)

`node import_users.js <path_to_json_file> [<batch_size>]`
* `path_to_json_file`: full local path and filename of .json input file (of users)
* `batch_size`: (optional) number of users to process in a batch (defaults to 100)

