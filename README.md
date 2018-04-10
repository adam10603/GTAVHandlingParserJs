# GTA V Handling Parser (for Node.js)
![Version](https://img.shields.io/badge/Version-1.01-green.svg) ![License](https://img.shields.io/badge/License-WTFPL%20v2-blue.svg)

Table of contents:
  * [Intro](#intro)
  * [Usage](#usage)
  * [API docs](#api-docs)
  * [Object structure of handling data](#object-structure-of-handling-data)
  * [Version history](#version-history)
___


## Intro


This is a Node.js library to read and parse .meta handling files from GTA V.

It's primarily intended to be used with Discord bots, such as for building a command that fetches the handling of GTA V vehicles, but it's just standalone Node.js code, so feel free to use it anywhere else too.

Main features:

  * Reading and parsing data from **multiple .meta files** in a single directory
  * Fetching data in various ways such as **specific properties**, a **simplified summery** of a vehicle, or even properties that are related to certain **keywords** such as "cornering"
  * Decoding `strModelFlags`, `strHandlingFlags`, `strDamageFlags` and even the new `strAdvancedFlags` properties into a list of **human-readable flag names** (by processing them the correct way as bitmasks)
  * Grouping handling properties into **categories** for easy readability
  * Very verbose and easy to use API


## Usage


First of all, **I'm not going to upload game files** on this repository, so you'll have to source those yourself.

So let's assume you're setting up a Discord bot command with [Discord.js](http://discord.js.org) to fetch handling data.

First, place *handling.js* next to your main .js file for your bot. Next, make a directory next to it where you'll put all the .meta files from the game. It's important that **only these files** exist in this directory!

**IMPORTANT**: Make sure that all of your handling files are named as such: **handling_mpassault.meta**. That is "handling_" followed by the internal name of the DLC it's from, as seen in [OpenIV](http://openiv.com) (or simply "update" if it's from update.rpf), and finally the ".meta" extension.

Next, add some code to your bot, something along these lines *(Of course you should do some more error handling and stuff, this is just a bare bones example)*:

```javascript

const handling = require("./handling"); // Including the handling library
const Discord  = require('discord.js');
const client   = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content.startsWith("!handling ")) {
        // Getting an array of all arguments
        var args = msg.content.substr(10).split(" ");

        // First argument is the vehicle name (not using the rest in this example)
        var vehicleName = args[0];

        if (!handling.doesVehicleExist(vehicleName)) {
            /*
             * Vehicle doesn't exist, notify user of it...
             */
            return;
        }

        // Getting the simple handling summary
        var vehicleHandling = handling.getSimpleHandlingForVehicle(vehicleName);

        if (vehicleHandling === null) {
            /*
             * Something went wrong, notify user of it...
             */
        } else {
            /*
             * Here you can use the contents of `vehicleHandling` to form a response.
             */
        }
    }
});

// Load the handling files before logging in!
console.log("Loading handling files...");
handling.loadFiles("handling_data"); // Tell it the name of the directory containing the files

client.login('token');

```

Here's an example of a Discord command I built into my bot:

![Discord bot command](https://i.imgur.com/wg9edCt.png)

Of course it could be used outside of Discord bots too, the core part of it is just vanilla JS. Maybe a web app, anyone?


## API docs


```javascript
function loadFiles(path, force = false)
```
> **You need to call this once** before calling any other functions. It loads and parses all the handling files from the specified directory.
>
> **Arguments**
>
> `path` (string): Path to directory containing the handling files (relative to the script's path).
>
> `force` (optional boolean, default `false`): When `true`, the handling files will be read again, even if they already have been read before.
>
> **Return value**
>
> None. It can throw an `Error()` with a brief description if something goes wrong though.

___

```javascript
function getDlcNameForVehicle(vehicle)
```
> Returns the internal name of the DLC that a vehicle is from. This is based on the names of the handling files, which should follow the naming scheme pointed out earlier.
>
> **Arguments**
>
> `vehicle` (string): The internal name of the vehicle. Matching is case-insensitive.
>
> **Return value**
>
> A string with the DLC name, or `null` on error.

___

```javascript
function getCategoryOfProperty(propertyName)
```
> Returns the category of a property. This is helpful for better organizing the response message.
>
> **Arguments**
>
> `propertyName` (string): The exact name of a property, such as "fMass".
>
> **Return value**
>
> A string with the category name. Returns "Misc" for any properties that don't have a category defined.

___

```javascript
function getKeywords()
```
> Returns all possible keywords and the names of properties that they are associated with.
>
> **Arguments**
>
> None.
>
> **Return value**
>
> An object indexed by keywords, each having an array of strings that are the property names associated with the keyword.

___

```javascript
function convertFlagsPropertyToFlagNames(hex, propertyName)
```
> Converts "flag" type properties into human-readable flag names. It interprets these values the correct way as bitmasks, instead of just looking at the hex characters, as this is how the game interprets them as well.
>
> **Arguments**
>
> `hex` (string): The hexadecimal value of the property (simply as returned with the vehicle's handling data).
>
> `propertyName` (string): The name of the property such as "strHandlingFlags". This determines the table used to decode the flags.
>
> **Return value**
>
> An array of strings that represent the flags, or `null` on error. Unknown flags are represented by their value as a bit-shift expression, such as "(0x1 << 3)".

___

```javascript
function isPropertyConvertableToFlagNames(propertyName)
```
> Tells you if a property is a "flag" type and can be converted into a list of flag names with `convertFlagsPropertyToFlagNames()`, or not.
>
> **Arguments**
>
> `propertyName` (string): The exact name of a property, such as "strAdvancedFlags".
>
> **Return value**
>
> Boolean (`true` if property is "flag" type).

___

```javascript
function doesVehicleExist(vehicle)
```
> Tells you if a vehicle exists (has handling data to be fetched), or not.
>
> **Arguments**
>
> `vehicle` (string): The internal name of the vehicle. Matching is case-insensitive.
>
> **Return value**
>
> Boolean (`true` if vehicle exists).

___

```javascript
function getHandlingForVehicle(vehicle)
```
> Returns ALL handling data for a certain vehicle.
>
> **Arguments**
>
> `vehicle` (string): The internal name of the vehicle. Matching is case-insensitive.
>
> **Return value**
>
> Object (see structure in the [next section](#object-structure-of-handling-data)), or `null` on error.

___

```javascript
function getSimpleHandlingForVehicle(vehicle)
```
> Returns a simplified version of the handling data for a vehicle, containing only the most relevant properties.
>
> **Arguments**
>
> `vehicle` (string): The internal name of the vehicle. Matching is case-insensitive.
>
> **Return value**
>
> Object (see structure in the [next section](#object-structure-of-handling-data)), or `null` on error.

___

```javascript
function getPropertyForVehicle(vehicle, property)
```
> Returns one specific handling property of a vehicle.
>
> **Arguments**
>
> `vehicle` (string): The internal name of the vehicle. Matching is case-insensitive.
>
> `property` (string): The exact name of the property, such as "fMass". It has to be an exact match, otherwise the function fails.
>
> **Return value**
>
> Object (see structure in the [next section](#object-structure-of-handling-data)), or `null` on error.

___

```javascript
function findPropertiesForVehicle(vehicle, propertySearch)
```
> Returns one or more properties of a vehicle that match the search term in some way. The returned properties will either have the search term occur in their names (e.g. "driveforce" would return "fInitialDriveForce"), or if the search term is one of the pre-defined keywords (such as "cornering"), then all properties assigned to this keyword will be returned. You can obtain a list of keywords and the properties they return with `getKeywords()`.
>
> **Arguments**
>
> `vehicle` (string): The internal name of the vehicle. Matching is case-insensitive.
>
> `propertySearch` (string): The search term to be used for matching property names or keywords. Matching is case-insensitive.
>
> **Return value**
>
> Object (see structure in the [next section](#object-structure-of-handling-data)), or `null` on error.


## Object structure of handling data


The handling data (e.g. as returned by `findPropertiesForVehicle()`) is structured in a simple way. For the most part, it's just a **flat object indexed by property names**. They are **not grouped** into sub-objects or anything (regardless if the property was inside "SubHandlingData" for example). The only time a value is an object is with vectors (properties that start with "vec"). These have 3 floating point components named `x`, `y` and `z`.

Here's an example object with one property of each possible data type, represented as JSON here:

```json
{
    "vecInertiaMultiplier": {
        "x": 1,
        "y": 1.6,
        "z": 1.7
    },
    "fInitialDriveForce": 0.36,
    "nInitialDriveGears": 6,
    "strHandlingFlags": "20002"
}
```

Notice that "handlingName" is not returned, so keep track of the vehicle name separately.


## Version history


* v1.0
  * Initial release
* v1.01
  * Added `getKeywords()`
  * Small code changes

_____________________
![WTFPL](http://www.wtfpl.net/wp-content/uploads/2012/12/wtfpl-badge-2.png) Licensed under WTFPL v2 (see the file [COPYING](COPYING)).
