# Firebase to Supabase: Firestore Data Migration

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
#### List all Firestore collections
`node collections.js`

#### Dump Firestore collection to JSON file
`node firestore2json.js <collectionName> [<batchSize>]`

* `batchSize` defaults to 1000
* output filename is `<collectionName>.json`

#### Import JSON file to Supabase (PostgreSQL)

`json2supabase.ts <path_to_json_file> [<primary_key_strategy>]`

* `<path_to_json_file>` is the full path of the file you created in the previous step (`Dump Firestore collection to JSON file
`), such as `./my_collection.json`
* `[<primary_key_strategy>]` (optional) is one of:
    * `none` (the default) (no primary key is added to the table)
    * `serial` creates a key using `(id SERIAL PRIMARY KEY)` (autoincrementing 2-byte integer)
    * `smallserial` creates a key using `(id SMALLSERIAL PRIMARY KEY)` (autoincrementing 4-byte integer)
    * `bigserial` creates a key using `(id BIGSERIAL PRIMARY KEY)` (autoincrementing 8-byte integer)
    * `uuid` creates a key using `(id UUID PRIMARY KEY DEFAULT uuid_generate_v4())` (randomly generated uuid)
    * `firestore_id` creates a key using `(id TEXT PRIMARY KEY)` (uses existing firestore_id random text as key)
