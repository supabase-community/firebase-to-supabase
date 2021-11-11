# Firebase to Supabase: Firestore Data Migration

### Command Line Syntax
#### List all collections
`ts-node collections.ts`

#### Dump Firestore collection to JSON file
`ts-node firestore2json.ts <collectionName> [<batchSize>]`

* `batchSize` defaults to 1000
* output filename is `<collectionName>.json`

