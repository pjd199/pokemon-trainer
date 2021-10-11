
//const PokedexWrapper = require("pokeapi-js-wrapper");
//const pokedexApi = new PokedexWrapper.Pokedex({cache: true, cacheImages: false});

const PokedexPromise = require("pokedex-promise-v2");
const pokedexApi = new PokedexPromise({cache: true, cacheImages: false});

exports.getPokemonNameArray = async ()  => {
    let list = await pokedexApi.getPokemonsList();

    let names = [];

    for (let x in list.results) {
      names[x] = list.results[x].name;
    }

    return new Promise( (resolve, reject) => {
      resolve(names);
    });
  }

  /**
   * Change a string to camelCase. For example hello-world becomes helloWorld
   * @param {String} str - the String to change 
   * @returns The new camelCase String
   */
exports.toCamelCase = (str) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  /**
   * Download all the data associated with the specified pokemon from the PokeAPI
   * to this.state.pokemonData.
   * @param {String} name - The name of the pokemon to get data for.
   */
exports.downloadPokemonData = async (name) => {

    let pokemon = {};

    // retrieve the data from the API
    const pokemonApi = await pokedexApi.getPokemonByName(name);
    const speciesApi = await pokedexApi.getPokemonSpeciesByName(pokemonApi.species.name);

    // workaround for the current "null" image problem in the API data 
    let imageUrl = pokemonApi.sprites.other["official-artwork"].front_default;
    if (imageUrl == null) {
      imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonApi.id}.png`
    }

    // find the pokemon types
    let types = [];
    for (let x in pokemonApi.types) {
      types[x] = pokemonApi.types[x].type.name;
    }

    // get the English description. If there are multiply English descriptions, get the most recent version
    let description = "";
    let descriptionVersion = 0;
    for (let x in speciesApi.flavor_text_entries) {
      let urlArray = speciesApi.flavor_text_entries[x].version.url.split('/');      
      if ((speciesApi.flavor_text_entries[x].language.name === "en") && (urlArray[urlArray.length - 2] > descriptionVersion)) {
        description = speciesApi.flavor_text_entries[x].flavor_text;
        descriptionVersion = urlArray[urlArray.length - 2];
      }
    }
    description = description.replace(/[\n\f\r]/g, " ");

    // populate the pokemon
    pokemon = {
      id: pokemonApi.id,
      name: pokemonApi.name,
      description: description,
      imageUrl: imageUrl,
      species: pokemonApi.species.name,
      speciesColor: speciesApi.color.name,
      types: types,
      height: pokemonApi.height,
      weight: pokemonApi.weight,
      habitat: speciesApi.habitat != null ? speciesApi.habitat.name : "",
      isLegendary: speciesApi.is_legendary,
      isMythical: speciesApi.is_mythical,
      shape: speciesApi.shape.name,
      canMega: false,
      megaName: "",
      canGmax: false,
      gmaxName: ""
    // evolution_chain
    }

    // populate the pokemon with it's vital stats, mapping the double worded names into camel case
    for (let x in pokemonApi.stats) {      
      pokemon[this.toCamelCase(pokemonApi.stats[x].stat.name)] = pokemonApi.stats[x].base_stat;
    }

    // populate the genus
    for (let x in speciesApi.genera) {
      if (speciesApi.genera[x].language.name === "en") {
        pokemon.genus = speciesApi.genera[x].genus;
      }
    }

    for (let x in speciesApi.varieties) {
      let variety = speciesApi.varieties[x].pokemon.name; 
      if (variety.includes("-mega")) {
        pokemon.canMega = true;
        pokemon.megaName = variety;
      } else if (variety.includes("-gmax")) {
        pokemon.gmaxName = variety;
      }
    }

    return new Promise((resolve, reject) => {
        resolve(pokemon);
    });
  }

  exports.downloadEvolutionChains = async () => {
    let chains =[];

    // retrieve the data from the API
    let chainsListApi = await pokedexApi.getEvolutionChainsList(); 

    console.log(">>>>>>>>>>>>" + chainsListApi.results.length);

    for(let i in chainsListApi.results) {
     let chainApi = await pokedexApi.resource(chainsListApi.results[i].url);

     chains[i] = {id: chainApi.chain.id};

     console.log(chains[i].id);
/*
     chains[i].firstEvolution = chainApi.chain.species.name;
     for (let x in chainApi.chain.evolvesTo) {
       chains[i].secondEvolutions[x] = chainApi.chain.evolvesTo[x].species.name;
       chains[i].secondEvolutions[x].thirdEvolutions = [];

       for (let y in chainApi.chain.evolvesTo[x].evolvesTo) {
         chains[i].secondEvolutions[x].thirdEvolutions[y] = chainApi.chain.evolvesTo[x].evolvesTo[y].species.name;
       }
     }
     */ 
    }

    return new Promise((resolve, reject) => {
      resolve(chains);
    });
/*
     {
       id: 0,
       firstEvolution {
         name: bulbasaur,
         secondEvolutions: [
           {
             name: ivysaur,
             thirdEvolutions: [
               {
                 name: venasaur
               }
             ]
           } 
          ]
       }
       evolvesTo: {
         ivysa
       } 
     }
*/
  }