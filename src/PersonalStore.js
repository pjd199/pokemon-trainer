import { openDB } from 'idb';
import autoBind from 'auto-bind';

/**
 * A class to manage the interface with the IndexedDB to store users and personal pokedexes
 */
class PersonalStore {

  /**
   * Creates an instance of the Personal Store
   */
  constructor() {
    // bind all function to this
    autoBind(this);
  }

  /**
   * On the first call, opens the database and performs an upgrade if required.
   * On subsequent calls, returns the stored database.
   * @returns {Promise} A prompise containing the database object
   */
  async openDatabase() {
    if (this.db === undefined) {
      // Open the database, upgrading if required
      this.db = await openDB("PokemonTrainer", 3, {
        upgrade(db) {
          // If "users" object store doesn't exist, create it
          if (!db.objectStoreNames.contains("users")) {
            db.createObjectStore("users", {autoIncrement: true});
          }
          // If "personalPokedex" object store doesn't exist, create it
          if (!db.objectStoreNames.contains("personalPokedex")) {
            db.createObjectStore("personalPokedex", {keyPath: ["userId", "pokemon"]});
          }
          // If "settings" object store doesn't exist, create it
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", {keyPath: "key"});
          }
        },
      });
    }

    // Return a promise with the database object
    return Promise.resolve(this.db);
  }

  
  /**
   * Stores the setting value under key
   * @param {String} key - the key to store the value under
   * @param {String} value - the value to store
   * @param {Promise}
   */
    async setSetting(key, value) {
    try {
      let db = await this.openDatabase();
      await db.put("settings", {key: key, value: value});
      return Promise.resolve();
    } catch(err) {
      return Promise.reject(`failed to put ${value} in ${key}: ${err.message}`);
    }
  }


  /**
   * Get the value of the setting stored under key
   * @returns {Promise} A promise containing the value for the key
   */
  async getSetting(key) {
    try {
      let db = await this.openDatabase();
      let value = await db.get("setttings", key);
      return Promise.resolve(value);
    } catch(err) {
      return Promise.reject(`failed to get ${key}: ${err.message}`);
    }
  }

  /**
   * Get all the settings
   * @returns {Promise} A promise containing all the settings
   */
  async getAllSettings() {
    try {
      let db = await this.openDatabase();
      let settings = await db.getAll("settings");
      
      // convert the settings into an object with properties and values
      let returnValue = {};
      for (let i in settings) {
        returnValue[settings[i].key] = settings[i].value;
      }

      // add the userList to the object
      let userList = await db.getAll("users");
      returnValue.userList = userList;
      
      // return the obj
      return Promise.resolve(returnValue);
    } catch(err) {
      return Promise.reject(`failed to get all settings: ${err.message}`);
    }
  }

  /**
   * Load the list of users
   * @returns {Promise} A promise containing the user list
   */
  async getUserList() {
    try {
      let db = await this.openDatabase();
      let userList = await db.getAll("users");
      return Promise.resolve(userList);
    } catch(err) {
      return Promise.reject(`failed to get userList: ${err.message}`);
    }
  }

  /**
   * Add a user
   * @param {String} name - The name of the user to add (case-sensitive)
   * @returns {Promise}
   */
  async addUser(name) {
    try {
      let db = await this.openDatabase();
      await db.add("users", name);
      return Promise.resolve();
    } catch(err) {
      return Promise.reject(`failed to add user ${name}: ${err.message}`);
    }
  }

  /**
   * Remove a user
   * @param {String} name - The name of the user to remove (case-sensitive)
   */
   async removeUser(name) {
    try {
      let db = await this.openDatabase();
      let userId = await this.getUserId(name);
      await db.delete("users", userId);
      return Promise.resolve();
    } catch(err) {
      return Promise.reject(`failed to remove user ${name}: ${err.message}`);
    }
  }

  /**
   * Get the ID of the named user
   * @param {String} name - The name of the user (case-sensitive)
   */
   async getUserId(name) {
    try {
      let db = await this.openDatabase();
      let keys = await db.getAllKeys("users");

      for (let userId of keys) {
        let user = await db.get("users", userId);
        if (user === name) {
          return Promise.resolve(userId);
        }
      }
      throw new Error (`Unable to find user ID for ${name}`);

    } catch(err) {
      return Promise.reject(`failed to get user id for ${name}: ${err.message}`);
    }
  }


  /**
   * Sets an entry in the personal pokedex
   * @param {String} user - The name of the current user (case-sensitive)  
   * @param {String} pokemon - The name of the pokemon to store
   * @param {boolean} seen - Sets the seen value, true or false
   * @param {boolean} caught - Sets the caught value, true or false
   * @returns 
   */
  async setPersonalPokedexEntry(user, pokemon, seen, caught) {
    try {
      let db = await this.openDatabase();
      let userId = await this.getUserId(user);

      let data = {
        userId: userId,
        pokemon: pokemon,
        seen: seen,
        caught: caught
      };

      // Store the data
      await db.put("personalPokedex", data);
      return Promise.resolve();
    } catch(err) {
      return Promise.reject(`failed to set ${pokemon} for ${user}: ${err.message}`);
    }
  }


  /**
   * Set the seen value to true for user and pokemon  
   * @param {String} user - The user to set the seen value for (case-sensitive)
   * @param {String} pokemon - The pokemon to set the seen value for
   */
  async setPersonalPokedexSeen(user, pokemon) {
    try {
      let stored = await this.getPersonalPokedexEntry(user, pokemon);
      await this.setPersonalPokedexEntry(user, pokemon, true, stored.caught);
      return Promise.resolve();
    } catch(err) {
      return Promise.reject(`failed to set seen ${pokemon} for ${user}: ${err.message}`);
    }
  }


  /**
   * Set the caught vlue to true for user and pokemon
   * @param {String} user - The user to set the seen value for (case-sensitive)
   * @param {String} pokemon - The pokemon to set the seen value for
   */
  async setPersonalPokedexCaught(user, pokemon) {
    try {
      let stored = await this.getPersonalPokedexEntry(user, pokemon);
      await this.setPersonalPokedexEntry(user, pokemon, stored.seen, true);
      return Promise.resolve();
    } catch(err) {
      return Promise.reject(`failed to set seen ${pokemon} for ${user}: ${err.message}`);
    }
  }


  /**
   * Gets the seen/caught values for the user and pokemon
   * @param {String} user - The user to set the seen value for (case-sensitive)
   * @param {String} pokemon - The pokemon to set the seen value for
   * @returns {Promise} - A promose containing the results
   */
  async getPersonalPokedexEntry(user, pokemon) {
    try {
      let db = await this.openDatabase();
      let userId = await this.getUserId(user);
      let results = await db.getAll("personalPokedex", [userId, pokemon]);
      return Promise.resolve(results);
    } catch(err) {
      return Promise.reject(`failed to getPersonalPokedexEntries for ${user} ${pokemon}: ${err.message}`);
    }
  }


  /**
   * Gets the seen/caught values for the user
   * @param {String} user - The user to set the seen value for (case-sensitive)
   * @returns {Promise} - A promose containing an array of results
   */
  async getPersonalPokedexEntries(user) {
    try {
      let db = await this.openDatabase();
      let userId = await this.getUserId(user);
      let results = await db.getAll("personalPokedex", IDBKeyRange.bound([userId, "aaaaaaa"], [userId, "zzzzzzz"]));
      return Promise.resolve(results);
    } catch(err) {
      return Promise.reject(`failed to getPersonalPokedexEntries for ${user}: ${err.message}`);
    }
  }


  /**
   * Returns a dump of the entire database
   * @returns {Object} An object containing a dump of the database
   */
  async dump() {
    try {
      let db = await this.openDatabase();
      let objectStoreNames = await db.objectStoreNames;

      // Create a new object, and set the properites using values from the database
      let output = {};
      output.name = db.name;
      output.version = db.version;
      output.objectStores = {};
      for (let name of objectStoreNames) {
        output.objectStores[name] = await db.getAll(name);
      }
      
      return Promise.resolve(output);
    } catch(err) {
      return Promise.reject(`failed to dump database: ${err.message}`);
    }
  }


  /**
   * Clears all data from the PersonalStore. Irreversible!!!
   * @returns {Promise}
   */
  async clearAllData() {
    try {
      let db = await this.openDatabase();
      let objectStoreNames = await db.objectStoreNames;

      // Clear each object store
      for (let name of objectStoreNames) {
        await db.clear(name);
      }

      return Promise.resolve();
    } catch(err) {
      return Promise.reject(`failed to clear the database: ${err.message}`);
    }
  }
}

export default PersonalStore;