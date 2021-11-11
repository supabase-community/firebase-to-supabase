# Firebase to Supabase: Firestore Data Migration

### Command Line Syntax
#### List all collections
`node collections.js`

#### Dump Firestore collection to JSON file
`node firestore2json.js <collectionName> [<batchSize>]`

* `batchSize` defaults to 1000
* output filename is `<collectionName>.json`

