# Writing Hooks
Hooks allow you to customize the process of exporting a collection of Firestore documents to JSON.  This can be used for any purpose, such as:

- customizing or modifying keys
- calculating data
- flattening nested documents into related SQL tables
- or anything else you want / need

## Writing a hook

#### Create a .js file for your collection
If your Firestore collection is called `users` then create a file called `users.js` in the current folder.

#### Constructing your .js file
The basic format of a hook file looks like this:
```js
module.exports = (collectionName, doc, recordCounters, writeRecord) => {
  // modify the doc here
  return doc;
}
```
##### Parameters
The parameters passed to your hook are:

- `collectionName`: This is the name of the collection you are processing.
- `doc`: This is the current document being processed.  It's a JSON object.
- `recordCounters`: This is an internal object that keeps track of how many records have been processed in each collection.
- `writeRecord`: This function automatically handles the process of writing data to other JSON files (useful for "flatting" your document into separate JSON files to be written to separate database tables.)
    - `writeRecord` function takes the following parameters:
    `writeRecord(name: string, doc: any, recordCounters: any)`
        - `name`: name of the JSON file to write to
        - `doc`: the document to write to the file
        - `recordCounters`: the same `recordCounters` object that was passed to this hook (just pass it on)
    - (see examples below)

#### Examples
##### Add a new (unique) numeric key to a collection
```js
module.exports = (collectionName, doc, recordCounters, writeRecord) => {
  doc.unique_key = (recordCounter[collectionName] + 1);
  return doc;
}
```
##### Add a timestamp of when this record was dumped from Firestore
```js
module.exports = (collectionName, doc, recordCounters, writeRecord) => {
  doc.dump_time = new Date().toISOString();
  return doc;
}
```
##### Flatten JSON into separate files
Let's flatten this `users` collection into separate files:
```json
[{"uid": "abc123",
  "name": "mark",
  "score": 100,
  "weapons": ["toothpick","needle","rock"]},
  {"uid": "xyz789",
   "name": "chuck",
   "score": 9999999,
   "weapons": ["hand","foot","head"]}]
```
Our `users.js` hook file:
```js
module.exports = (collectionName, doc, recordCounters, writeRecord) => {
  for (let i=0; i < doc.weapons.length; i++) {
    const weapon = {
        "uid": doc.uid,
        "weapon": doc.weapons[i]
    }
    writeRecord("weapons", weapon, recordCounters);
  }
  delete doc.weapons; // moved to separate file 
  return doc;
}
```
The result is two separate JSON files:
`users.json`:
```json
[{"uid": "abc123",
  "name": "mark",
  "score": 100},
  {"uid": "xyz789",
   "name": "chuck",
   "score": 9999999}]
```
`weapons.json`:
```json
[{"uid": "abc123",
  "weapon": "toothpick"},
  {"uid": "abc123",
  "weapon": "needle"},  
  {"uid": "abc123",
  "weapon": "rock"},
  {"uid": "xyz789",
  "weapon": "hand"},
  {"uid": "xyz789",
  "weapon": "foot"},
  {"uid": "xyz789",
  "weapon": "head"}]
```
