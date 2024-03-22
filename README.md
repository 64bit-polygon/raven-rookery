# `raven-rookery`
 
`raven-rookery` is a backend tool to get localizations from the popular [POEditor](https://poeditor.com/) localization service. `raven-rookery` gets and stores your localizations in memory, refreshing them at a given interval. It also provides an optional customizable API.

You no longer need to worry about [throttling, queuing and rate limiting](https://poeditor.com/docs/api_rates). Instead of making calls to POEditor's API, incorporate `raven-rookery` in your current project's API or use its built in API.

The API response from POEditor has a bunch of info you probably don't need. Additionally all languages in a project require their own API call. `raven-rookery` provides a much cleaner response: just key/value pairs describing your content and you can choose which languages you'd like in one call.

Here's a response hitting POEditor's API directly:

```json
{
  "response": {
    "status": "success",
    "code": "200",
    "message": "OK"
  },
  "result": {
    "terms": [
      {
        "term": "GREETING",
        "context": "",
        "plural": "",
        "created": "2013-06-10T11:08:54+0000",
        "updated": "",
        "translation": {
          "content": "Hello",
          "fuzzy": 0,
          "proofread": 1,
          "updated": "2013-06-12T11:08:54+0000"
        },
        "reference": "",
        "tags": [
          "first_upload",
          "second_upload"
        ],
        "comment": ""
      }
      {}
    ]
  }
}
```

Here's a response using `raven-rookery`:

```json
{
  "en-us": {
    "GREETING": "Hello",
    "ETC": "..."
  },
  "sp-mx": {
    "GREETING": "Hola",
    "ETC": "..."
  }
}

```

If you find `raven-rockery` useful consider using [`raven-writer`](https://www.npmjs.com/package/raven-writer) on the FE to incorporate markdown and interpolations.

Additionally, `raven-rockery` is instantiated with your read-only API token once, instead of being used with every API call if hitting POEditor directly. This lessens the risk of it being committed accidentally if you have a larger team or codebase.  

---

## Docs

- [`Installation`](#install)
- [`Quick start example with starting server`](#basicServer)
- [`Quick start example without starting server`](#basicServerless)
- [`initRookery({...})`](#initRookery)
  - [`getLocalizations(id, languages)`](#getLocalizations)
  - [`getLocalizationsByLang(id, language)`](#getLocalizationsByLang)
  - [`startServer()`](#startServer)
  - [`killServer()`](#killServer)
- [`Customizing API endpoint and params`](#api)
- [`Response schema`](#responseSchema)

## <a id="install"></a>Install

```
$ npm install raven-rookery -S
```

## <a id="basicServer"></a>Quick start example with starting server

This will start a dedicated [`express`](https://expressjs.com/) app. This is not required though. See the next example if you want to start your own server and integrate `raven-rookery`'s functionality.

```js
import { initRookery } from "raven-rookery";

const { startServer } = await initRookery({
  token: "<YOUR_READ_ONLY_POEDITOR_API_TOKEN>",
  projectIds: ["MY_POEDITOR_PROJECT_ID", "ETC"]
});

startServer();
```

When running locally and making the following request:

```bash
curl --globoff 'http://localhost:3000/localizations?data={"projectId":"MY_POEDITOR_PROJECT_ID"}'
```

You'll get back your [localizations](#responseSchema) for your POEDITOR project with the project id `MY_POEDITOR_PROJECT_ID`.

## <a id="basicServerless"></a>Quick start example without starting server

In this example you'll be integrating `raven-rookery` with an already existing `express` app you've spun up yourself.

Note that of course you'd be setting your endpoint and query params to whatever you'd like.

```js
import express from "express";
import { initRookery } from "./InitRookery/index.js";

const { getLocalizations } = await initRookery({
  token: "<YOUR_READ_ONLY_POEDITOR_API_TOKEN>",
  projectIds: ["MY_POEDITOR_PROJECT_ID", "ETC"]
});

const app = express();
app.use(express.json());

app.get("/some-endpoint", (req, res) => {
  const query = req.query["my-query"];
  const { id, langs } = JSON.parse(query);
  res.json(getLocalizations(id, langs));
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

When running locally and making the following request:

```bash
curl --globoff 'http://localhost:3000/some-endpoint?my-query={"id":"MY_POEDITOR_PROJECT_ID","langs":["en-us"]}'
```

You'll get back your [localizations](#responseSchema) for your POEDITOR project with the project id `MY_POEDITOR_PROJECT_ID` and for just the language `en-us`.

## <a id="initRookery"></a>`initRookery({...})`

Gets localizations for a set of POEditor projects, stores them in memory, and refreshes their values per a set amount of time. Returns functions to access those localizations and to start up an `express` server to access the localizations through a built in API.

### Props

| Prop             | Type            | Required? | Description |
| -----------------| :-------------: | :-------: | ----------- |
| **token**        | `String`        | ✅        | The read only `api_token` found in your [POEditor acct](https://poeditor.com/account/api) |
| **projectIds**   | `Array[String]` | ✅        | An array of project `id`s found in your [POEditor acct](https://poeditor.com/account/api) |
| **keepAlive**    | `Integer`       |           | The refresh frequency in ms to `GET` localizations from POEditor. Defaults to `600000` (10 minutes) |
| **serverConfig** | `Object`        |           | Configurations for the server created with [`startServer()`](#startServer). See the `serverConfig` table below. |

### `serverConfig` prop
| Key              | Type            | Default value      | Description  |
| ---------------- | :-------------: | :----------------: | ------------ |
| **endpoint**     | `String`        | `"/localizations"` | The endpoint to request localizations. |
| **port**         | `Integer`       | `3000`             | The `port` that the `express` server will run on |
| **requestType**  | `String`        | `"GET"` | Can be `"POST"` OR `"GET"` |
| **dataKey**      | `String`        | `"data"` | Changes the query param |
| **languagesKey** | `String`        | `"languages"` | Changes the languages key in the request |
| **projectIdKey** | `String`        | `"projectId"` | Changes the project id key in the request |

Please see: [Customizing API endpoint and params](#api) for info on changing `serverConfig` values and general info on making calls.

### Returns

A `promise` that resolves to an object holding three methods:

- [`getLocalizations(id, languages)`](#getLocalizations) - accesses the localizations stored in memory
- [`getLocalizationsByLang(id, language)`](#getLocalizationsByLang) - accesses the localizations stored in memory
- [`startServer()`](#startServer) - starts an `express` server
- [`killServer()`](#killServer) - stops the `express` server started by `startServer()`

### Usage

See [also quick start examples](#basicServer).

The following code snippet gets localization for projects w/ IDs "ID_1" and "ID_2".
It will refresh the values of those localizations every 5 minutes.
It sets some localizations of the projects into two `const`s.
It starts an `express` server on port `3000` and will be accessible via the endpoint `/api/translations` for `POST` requests.

```js
import { initRookery } from "raven-rookery";

const {
  getLocalizations,
  getLocalizationsByLang,
  startServer,
  killServer
} = await initRookery({
  token: "<YOUR_READ_ONLY_POEDITOR_API_TOKEN>",
  projectIds: ["ID_1", "ID_2"],
  keepAlive: 1000 * 60 * 5,
  serverConfig: {
    endPoint: "/api/translations",
    requestType: "POST"
  }
});

const allLocalizationsForProject1 = getLocalizations("ID_1");
const enUSLocalizationsForProject2 = getLocalizationsByLang("ID_2", "en-us");

startServer();
```

## <a id="getLocalizations"></a>`getLocalizations(id, languages)`

Gets localizations for a given POEditor project whose `id` was used to instantiate `initRookery({...})`, optionally filtered by an array of `languages` present on that project.

### Props

| Prop          | Type            | Required? | Description |
| --------------| :-------------: | :-------: | ----------- |
| **id**        | `String`        | ✅        | The project `id` of one of the projects used to instantiate `initRookery({...})` |
| **languages** | `Array[String]` |           | `Array` of ISO 639-1 language codes that exist in the project whose `id` you passed in. If missing, all language localizations are returned. |

### Returns

A nest object whose top level keys are [ISO 639-1 language codes](https://en.wikipedia.org/wiki/ISO_639-1), each holding that language's localizations in key/value pairs where the key is what POEditor refers to as the `term` and value is what POEditor refers to as the `content`. See the [POEditor API](https://poeditor.com/docs/api#terms) for more details.

```json
{
  "en-us": {
    "GREETING": "Hello"
  },
  "en-au": {
    "GREETING": "G'day"
  },
  "sp-mx": {
    "GREETING": "Hola"
  }
}
```

### Usage

```js
import { initRookery } from "raven-rookery";

const { getLocalizations } = await initRookery({
  token: "<YOUR_READ_ONLY_POEDITOR_API_TOKEN>",
  projectIds: ["ID_1", "ID_2"]
});

console.log(getLocalizations("ID_1", ["en-us"]));
/*
Logs:
"en-us": {
  "GREETING": "Hello"
}
*/

console.log(getLocalizations("ID_1"))
// logs all localizations for en-us, en-au, and sp-mx
```

## <a id="getLocalizationsByLang"></a>`getLocalizationsByLang(id, languages)`

Gets localizations of a `language` for a given POEditor project whose `id` was used to instantiate `initRookery({...})`. The `language` given must be present on the POEditor project whose `id` is passed here.

### Props

| Prop         | Type     | Required? | Description |
| -------------| :------: | :-------: | ----------- |
| **id**       | `String` | ✅        | The project `id` of one of the projects used to instantiate `initRookery({...})` |
| **language** | `String` | ✅         | A ISO 639-1 language code that exists in the project whose `id` you passed in. |

### Returns

A flat object with key/value pairs where the key is what POEditor refers to as the `term` and value is what POEditor refers to as the `content`. See the [POEditor API](https://poeditor.com/docs/api#terms) for more details.

```json
{
  "GREETING": "Hello"
}
```

### Usage

```js
import { initRookery } from "raven-rookery";

const { getLocalizationsByLang } = await initRookery({
  token: "<YOUR_READ_ONLY_POEDITOR_API_TOKEN>",
  projectIds: ["ID_1", "ID_2"]
});

console.log(getLocalizationsByLang("ID_1", "en-us"));
/*
Logs:
{
  "GREETING": "Hello",
  ...
}
*/

console.log(getLocalizationsByLang("ID_1", "sp-mx"));
/*
Logs:
{
  "GREETING": "Hola",
  ...
}
*/
```

## <a id="startServer"></a>`startServer()`

Starts an `express` server with a built in API to get localizations from endpoints. Out of the box it will listen for `GET` requests at the `/localizations` but this and other aspects can be customized. Please take a look [customizing API endpoint and params](#api).

### Props

none

### Returns

An object with keys `app` holding the created [`express app`](https://expressjs.com/en/api.html) and `server` a [`UNIX socket`](https://expressjs.com/en/5x/api.html#app.listen_path_callback). You don't have to do anything with these but they are there if you need them.

```js
  { app, server }
```

### Usage

```js
import { initRookery } from "raven-rookery";

const { startServer } = await initRookery({...});

startServer();

/*
const { app, server } = startServer();
if you wanted to access the app and server.
*/
```

Once this is running you can make API calls to get localizations.









## <a id="killServer"></a>`killServer()`

Kills the express server started with [`startServer()`](#startServer).

### Props

none

### Returns

`undefined`

### Usage

```js
import { initRookery } from "raven-rookery";

const { startServer } = await initRookery({...});

startServer();
killServer();

```

Once called you can no longer make API calls to get localizations.

## <a id="api"></a>Customizing API endpoint and params

The following sections outlines how to use the `serverConfig` object's `dataKey`, `languagesKey`, and `projectIdKey` to customize how you call API endpoints created via [`startServer()`](#startServer). They are all optional. What follows are comparisons to illustrate their use.

Please refer to [`Response schema`](#responseSchema) 

**`GET`**

Note: to construct the URL I recommend using `JSON.stringify()`:

```js
const options = {
  projectId: "ID_1",
  languages: ["en-us"]
};

const url = `'http://localhost:3000/localizations?data=${JSON.stringify(options)}`;
```

```js
// with all defaults
const { startServer } = await initRookery({token: "MY_TOKEN", projectIds: ["ID_1", "ID_2"]});
startServer();
```

You'd need to make the following `GET` request for a single project, returning a [2-D response](#2dResponse):

```bash
curl --globoff 'http://localhost:3000/localizations?data={"projectId":"ID_1","languages":["en-us"]}'
```

You'd need to make the following `GET` request for a multiple projects, returning a [3-D response](#3dResponse):

```bash
curl --globoff 'http://localhost:3000/localizations?data=[{"projectId":"ID_1","languages":["en-us"]},{"projectId":"ID_1","languages":["en-us"]}]'
```

Now if we adjust the `endpoint`, `port`, `dataKey`, `projectIdKey` and `languagesKey` values:

```js
const { startServer } = await initRookery({
  token: "MY_TOKEN",
  projectIds: ["ID_1", "ID_2"],
  serverConfig: {
    endpoint: "/my/long/endpoint",
    port: 1234,
    dataKey: "query",
    projectIdKey: "id",
    languagesKey: "langs"
  }
});
startServer();
```

You'd need to make the following `GET` request to get the same result [2-D response](#2dResponse) as the previous call:

```bash
curl --globoff 'http://localhost:1234/my/long/endpoint?query={"id":"ID_1","langs":["en-us"]}'
```

Or the following `GET` to get the same [3-D response](#3dResponse) as the previous call:

```bash
curl --globoff 'http://localhost:1234/my/long/endpoint?query=[{"id":"ID_1","langs":["en-us"]},{"id":"ID_2","langs":["en-us"]}]'
```

**`POST`**

```js
// with all defaults except for requestType being set to "POST"
const { startServer } = await initRookery({
  token: "MY_TOKEN",
  projectIds: ["ID_1", "ID_2"],
  serverConfig: {
    requestType: "POST"
  }
});
startServer();
```

You'd need to make the following `POST` request for a single project, returning a [2-D response](#2dResponse):

```bash
curl --location 'http://localhost:3000/localizations' \
  --header 'Content-Type: application/json' \
  --data '{ "projectId": "ID_1", "languages":["en-us"] }'
```

You'd need to make the following `POST` request for a multiple projects, returning a [3-D response](#3dResponse):

```bash
curl --location 'http://localhost:3000/localizations' \
  --header 'Content-Type: application/json' \
  --data '{ "data": [{"projectId": "ID_1","languages":["en-us"]}, {"projectId": "ID_2","languages":["en-us"]}] }'
```

Now if we adjust the `endpoint`, `port`, `dataKey`, `projectIdKey` and `languagesKey` values:

```js
const { startServer } = await initRookery({
  token: "MY_TOKEN",
  projectIds: ["ID_1", "ID_2"],
  serverConfig: {
    endpoint: "/my/long/endpoint",
    port: 1234,
    dataKey: "query",
    projectIdKey: "id",
    languagesKey: "langs"
  }
});
startServer();
```

You'd need to make the following `POST` request to get the same result [2-D response](#2dResponse) as the previous call:

```bash
curl --location 'http://localhost:1234/my/long/endpoint' \
  --header 'Content-Type: application/json' \
  --data '{ "id": "ID_1", "langs":["en-us"] }'
```

Or the following `POST` to get the same [3-D response](#3dResponse) as the previous call:

```bash
curl --location 'http://localhost:1234/my/long/endpoint' \
  --header 'Content-Type: application/json' \
  --data '{ "query": [{"id": "ID_1","langs":["en-us"]}, {"id": "ID_2","langs":["en-us"]}] }'
```

## <a id="responseSchema"></a>Response schema

The response is a nested object, either 2 or 3 dimensions depending on your request. Both `GET` and `POST` calls return the same response. To enable `POST` requests see [`initRookery({...})`](#initRookery).

### 2-D API calls

The localizations for one project are returned as a single nested object. Top level keys are [ISO 639-1 language codes](https://en.wikipedia.org/wiki/ISO_639-1), each holding that language's localizations in key/value pairs where the key is what POEditor refers to as the `term` and value is what POEditor refers to as the `content`. See the [POEditor API](https://poeditor.com/docs/api#terms) for more details.

Note to get a 2-D response you're passing an object, to get a 3-D response you're passing an array of objects.

**`GET`**

```bash
curl --globoff 'http://localhost:3000/localizations?data={"projectId":"MY_POEDITOR_PROJECT_ID"}'
```

(Note: This `GET` call integrates well with the [`raven-writer`](https://www.npmjs.com/package/raven-writer) front end util. To do so, set the `url` in the `POE.fetchLocalizations({...})` method.)

**`POST`**

```bash
curl --location 'http://localhost:3000/localizations' \
  --header 'Content-Type: application/json' \
  --data '{ "projectId": "MY_POEDITOR_PROJECT_ID" }'
```

#### Response

<a id="2dResponse"></a>Assuming you have the following languages on your project: `en-us`, `sp-mx` and a POE term `GREETING`.

```json
{
  "en-us": {
    "GREETING": "Hello"
  },
  "sp-mx": {
    "GREETING": "Hola"
  }
}
```

### 3-D API calls

Returns one or more projects in a single nested object with the given project ID as the key for each.

**`GET`**

```bash
curl --globoff 'http://localhost:3000/localizations?data=[{"projectId":"MY_POEDITOR_PROJECT_ID"}]'
```

**`POST`**

```bash
curl --location 'http://localhost:3000/localizations' \
  --header 'Content-Type: application/json' \
  --data '{ "data": [{"projectId": "MY_POEDITOR_PROJECT_ID"}] }'
```

#### Response

<a id="3dResponse"></a>Assuming you have the following languages on your project with id `MY_POEDITOR_PROJECT_ID`: `en-us`, `sp-mx` and a POE term `GREETING` and 

```json
{
  "MY_POEDITOR_PROJECT_ID": {
    "en-us": {
      "GREETING": "Hello"
    },
    "sp-mx": {
      "GREETING": "Hola"
    }
  }
}
```