/**
 * Creates a new data file from a local PokeApi git repo
 */


const fs = require('fs');
const { findLastKey } = require('lodash');

/**
 * Name of the output files
 * 
 */

savePath = "src/";

saveName = {
  pokedex:   savePath + "pokedexData.json",
  species:   savePath + "speciesData.json",
  pokemon:   savePath + "pokemonData.json",
  colors:    savePath + "colors.json",
  habitats:  savePath + "habitats.json",
  types:     savePath + "types.json",
  shapes:    savePath + "shapes.json",
  pokedexes: savePath + "pokedexes.json"
}

 /**
  * Location of the static API data
  */
 let apiPath = "../pokemon-data/api-data/data/api/v2/";
 let spritePath = "../pokemon-data/sprites/";
  
/**
 * These objects are the source output at JSON into outputFileName
 */
let pokedexData   = [];
let speciesData   = [];
let pokemonData   = [];
let colorsData    = [];
let habitatsData  = [];
let typesData     = [];
let shapesData    = [];
let pokedexesData = [];

log = (str, cr = false) => {
  elapsedTime = (Date.now() - startTime);
  timeStr = ".........." + elapsedTime;
  timeStr = timeStr.substr(timeStr.length-7)
  return process.stdout.write(`${timeStr}ms: ${str}                                        ${cr ? "\r" : "\n\r"}`); 
}

idFromUrl = (url) => {
  fragments = url.split('/');
  //log(fragments);
  return fragments[fragments.length - 2];
}

titleCase = (str) => {
  let words = str.split(" ");

  for (let i in words) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }

  return words.join(" ");
}

// Start the clock!!!i
let startTime = Date.now();

/*
 * Add the pokedex lists
 */
let pokedexToInclude = [
  "national", 
  "updated-kanto", 
  "updated-johto", 
  "updated-hoenn",
  "extended-sinnoh",
  "updated-unova",
  "kalos-central",
  "kalos-coastal",
  "kalos-mountain",
  "updated-alola",
  "galar"
];

let pokedexImagePath = "./images/pokedex/";
let pokedexImages = [
  pokedexImagePath + "national.png", 
  pokedexImagePath + "kanto.png", 
  pokedexImagePath + "johto.png",
  pokedexImagePath + "hoenn.png",
  pokedexImagePath + "sinnoh.png",
  pokedexImagePath + "unova.png",
  pokedexImagePath + "kalos.png",
  pokedexImagePath + "kalos.png",
  pokedexImagePath + "kalos.png",
  pokedexImagePath + "alola.png",
  pokedexImagePath + "galar.png"
];



log("Loading pokedex index file");
let pokedexListApi = JSON.parse(fs.readFileSync(apiPath + "pokedex/index.json"));

log(`Loading ${pokedexToInclude.length} pokedex files`);
for (let i in pokedexToInclude) {

  log(`Loading pokedex: ${pokedexToInclude[i]}`, true);
  pokedexData[i] = {};

  // find the pokedex in the list
  let id = idFromUrl(pokedexListApi.results.find(x => x.name === pokedexToInclude[i]).url);
  let pokedexApi = JSON.parse(fs.readFileSync(apiPath + `pokedex/${id}/index.json`));

  // unique name
  pokedexData[i].name = pokedexApi.name;
  pokedexData[i].name = pokedexData[i].name.replace("updated-", "");
  pokedexData[i].name = pokedexData[i].name.replace("extended-", "");

  // display name
  for (let x in pokedexApi.names) {
    if (pokedexApi.names[x].language.name === "en") {
      pokedexData[i].displayName = pokedexApi.names[x].name;
      pokedexData[i].displayName = pokedexData[i].displayName.replace("Updated ", "");
      pokedexData[i].displayName = pokedexData[i].displayName.replace("Extended ", "");
      pokedexData[i].displayName = pokedexData[i].displayName.replace("New ", "");
    }
  }

  // description
  for (let x in pokedexApi.descriptions) {
    if (pokedexApi.descriptions[x].language.name === "en") {
      pokedexData[i].description = pokedexApi.names[x].description;
    }  
  }

  pokedexData[i].imageUrl = pokedexImages[i];

  // pokemon in the pokedex
  pokedexData[i].species = [];
  for (let x in pokedexApi.pokemon_entries) {
    pokedexData[i].species[x] = pokedexApi.pokemon_entries[x].pokemon_species.name;
  }
}
log("", true);

/*
 * Process the species files
 */
log("Loading list of species index file");
let speciesListApi = JSON.parse(fs.readFileSync(apiPath + "pokemon-species/index.json"));

for (let i in speciesListApi.results) {
  speciesData[i] = {};
  speciesData[i].name = speciesListApi.results[i].name;
  speciesData[i].id = idFromUrl(speciesListApi.results[i].url);
}

log(`Loading ${speciesData.length} species files`);

for (i in speciesData) {

  log(`Loading: ${speciesData[i].name}`, true);

  // retrieve the data from the API
  let speciesApi = JSON.parse(fs.readFileSync(apiPath + `pokemon-species/${speciesData[i].id}/index.json`));

  speciesData[i].displayName = speciesData[i].name.charAt(0).toUpperCase() + speciesData[i].name.slice(1);

  // populate the genus
  for (let x in speciesApi.genera) {
    if (speciesApi.genera[x].language.name === "en") {
      speciesData[i].genus = speciesApi.genera[x].genus;
    }
  }
  
  // get the English description. If there are multiply English descriptions, get the most recent version
  let description = "";
  let descriptionVersion = 0;
  for (let x in speciesApi.flavor_text_entries) {
    let version = idFromUrl(speciesApi.flavor_text_entries[x].version.url);
    if ((speciesApi.flavor_text_entries[x].language.name === "en") && (version > descriptionVersion)) {
      description = speciesApi.flavor_text_entries[x].flavor_text;  
      descriptionVersion = version;
    }
  }
  // replace the new line, form feed, carriage retun character with a space
  description = description.replace(/[\n\f\r]/g, " ");
  // replace the uppercase species names with a Title case name
  description = description.replace(speciesData[i].name.toUpperCase(), speciesData[i].displayName);
  speciesData[i].description = description;

  // get more information
  speciesData[i].color = speciesApi.color.name;
  speciesData[i].shape = speciesApi.shape.name;
  speciesData[i].habitat =  speciesApi.habitat != null ? speciesApi.habitat.name : "";
  speciesData[i].isLegendary = speciesApi.is_legendary;
  speciesData[i].isMythical = speciesApi.is_mythical;

  // get the variety information
  speciesData[i].varieties = [];
  for (let x in speciesApi.varieties) {
    speciesData[i].varieties[x] = speciesApi.varieties[x].pokemon.name; 
  }
}

log("", true);

/*
 * Process the pokemon names file
 */
log("Loading pokemon index file");
let nameApi = JSON.parse(fs.readFileSync(apiPath + "pokemon/index.json"));

for (let i in nameApi.results) {
  pokemonData[i] = {};
  pokemonData[i].name = nameApi.results[i].name;
  pokemonData[i].id = idFromUrl(nameApi.results[i].url);
}


/*
 * Process the pokemon files
 */
log(`Loading ${pokemonData.length} pokemon files`);
for (i in pokemonData) {

  log(`Loading: ${pokemonData[i].name}`, true);

  // retrieve the data from the API
  let pokemonApi = JSON.parse(fs.readFileSync(apiPath + `pokemon/${pokemonData[i].id}/index.json`));

  // find the pokemon types
  pokemonData[i].types = [];
  for (let x in pokemonApi.types) {
    pokemonData[i].types[x] = pokemonApi.types[x].type.name;
  }

  // populate the pokemon with it's vital stats
  pokemonData[i].base = {};
  for (let x in pokemonApi.stats) {
    switch (pokemonApi.stats[x].stat.name) {
      case "hp":
      case "attack":
      case "defense":
      case "speed":
        pokemonData[i].base[pokemonApi.stats[x].stat.name] = pokemonApi.stats[x].base_stat;
        break;
      case "special-attack":
        pokemonData[i].base.specialAttack = pokemonApi.stats[x].base_stat;
        break;
      case "special-defense":
        pokemonData[i].base.specialDefense = pokemonApi.stats[x].base_stat;
      break;
    }
  }

  pokemonData[i].height = pokemonApi.height * 10; // convert decimeters into cm
  pokemonData[i].weight = pokemonApi.weight * 100;// convert hectograms into grams

  // add the image URL
  pokemonData[i].imageUrl = pokemonApi.sprites.other["official-artwork"].front_default;
  if (pokemonData[i].imageUrl == null) {
    // the URL is null...
    if (fs.existsSync(`${spritePath}sprites/pokemon/other/official-artwork/${pokemonData[i].id}.png`)) {
      // but the file actually exists
      pokemonData[i].imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonData[i].id}.png`;
      console.log(`file actually exists for missing original artwork URL on ${pokemonData[i].name} (${pokemonData[i].id}) ... correcting`);

    } else if (pokemonApi.sprites.default_front !== null) {
      // so use the low res sprite instead
      pokemonData[i].imageUrl = pokemonApi.sprites.default_front; 
      //console.log(`using spirte for missing original artwork URL on ${pokemonData[i].name} (${pokemonData[i].id}) ... correcting`);

    } else {
      // so can't help - use a default image
      console.log(`using default image for missing orginal artwork URL for ${pokemonData[i].name} (${pokemonData[i].id}) ... correcting`);
      pokemonData[i].imageUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/sprites/pokemon/0.png";
    }  
  }


  if (pokemonApi.forms.length > 1) {
    log (pokemonApi.name + " > " + pokemonApi.forms.length);
  }

}

log("", true);

/*
 * Process the evolution data
 */
log("Loading evolution-chain index file");
let evolutionApi = JSON.parse(fs.readFileSync(apiPath + "evolution-chain/index.json"));

log(`Loading ${evolutionApi.results.length} evolution files`);


for (let i in evolutionApi.results) {
  log(`Loading: evolution chain ${i} of ${evolutionApi.results.length}`, true);

  let chainApi = JSON.parse(fs.readFileSync(apiPath + `evolution-chain/${idFromUrl(evolutionApi.results[i].url)}/index.json`));

  //Get data for the first evolution
  let firstEvolution = speciesData.find(p => (p.id === idFromUrl(chainApi.chain.species.url)));
  if (firstEvolution === undefined) {
    log(">>>" + chainApi.chain.species.name);
  }

  firstEvolution.evolvesTo = null;
  firstEvolution.evolvesFrom = null;

  for (let x in chainApi.chain.evolves_to) {
    if (firstEvolution.evolvesTo === null) {
      firstEvolution.evolvesTo = [];
    }
    firstEvolution.evolvesTo.push(chainApi.chain.evolves_to[x].species.name);
  }

  //for each of the second evolutions
  for (let x in chainApi.chain.evolves_to) {
    let secondEvolution = speciesData.find(p => (p.id === idFromUrl(chainApi.chain.evolves_to[x].species.url)));
    secondEvolution.evolvesFrom = firstEvolution.name;
    secondEvolution.evolvesTo = null;

    for (let y in chainApi.chain.evolves_to[x].evolves_to) {
      if (secondEvolution.evolvesTo === null) {
        secondEvolution.evolvesTo = [];
      }
      secondEvolution.evolvesTo.push(chainApi.chain.evolves_to[x].evolves_to[y].species.name);

      // for each third evolution
      let thirdEvolution = speciesData.find(p => (p.id === idFromUrl(chainApi.chain.evolves_to[x].evolves_to[y].species.url)));
      thirdEvolution.evolvesFrom = secondEvolution.name;
      thirdEvolution.evolvesTo = null;
    }
  }
}

log("", true);


/*
 * Process the filter list files (colors/habitats/shapes/types/shapes) files
 */
processList = (name, endpoint) => {

  output = [];

  log(`Loading list of ${name} index file`);
  let listApi = JSON.parse(fs.readFileSync(apiPath + `${endpoint}/index.json`));

  for (let i in listApi.results) {
    output[i] = {};
    output[i].name = listApi.results[i].name;
    output[i].id = idFromUrl(listApi.results[i].url);
  }

  log(`Loading ${listApi.results.length} ${name} files`);

  for (let i in output) {
    log(`Loading: ${name} ${output[i].name}`, true);

    let itemApi = JSON.parse(fs.readFileSync(apiPath + `${endpoint}/${output[i].id}/index.json`));
    
    // description
    for (let x in itemApi.names) {
      if (itemApi.names[x].language.name === "en") {
        output[i].displayName = titleCase(itemApi.names[x].name);
      }  
    }
  }

  log("", true);

  return output;
}

colorsData = processList("color", "pokemon-color");
habitatsData = processList("habitat", "pokemon-habitat");
typesData = processList("types", "type");
shapesData = processList("shapes", "pokemon-shape");

for (let i in pokedexData) {
  pokedexesData[i] = {};
  pokedexesData[i].name = pokedexData[i].name;
  pokedexesData[i].id = i + 1;
  pokedexesData[i].displayName = pokedexData[i].displayName;
}


/*
 * Save the files
 */ 
saveFile = (name, data) => {
  let output = JSON.stringify(data, null, 4);
  if (output === undefined) {
    log(`Unable to save ${name}: no output data`);
  } else {
    log(`Saving ${name} data to ${saveName[name]} (${output.length} bytes)`);
    fs.writeFileSync(saveName[name], output);
  }
}

saveFile("pokedex",    pokedexData);
saveFile("species",    speciesData);
saveFile("pokemon",    pokemonData);
saveFile("colors",     colorsData);
saveFile("habitats",   habitatsData);
saveFile("types",      typesData);
saveFile("shapes",     shapesData);
saveFile("pokedexes",  pokedexesData);

log("Finished!!!");