import React, {Component} from "react";
import Pokedex from "./Pokedex";
import MatchingGame from "./MatchingGame";
import TypeEffectivenessGame from "./TypeEffectivenessGame";
import Quest from "./Quest";
import cloneDeep from "lodash.clonedeep";

import {BrowserRouter, Switch, Route, Redirect} from "react-router-dom";
import {LinkContainer} from 'react-router-bootstrap';
import { Navbar, Nav } from 'react-bootstrap'

class App extends Component {

  /**
   * Initialise the App compoment
   * @constructor
   * @param {Object} props - The properties passed to the object via a HTML tag
   */
  constructor(props) {
    super(props);

    let pokedexData = require("./pokedexData.json");
    let speciesData = require("./speciesData.json");
    let pokemonData = require("./pokemonData.json");

    // resolve the references in the varieties, changing string names into object references
    let varieties = {};
    for (let i in pokemonData) {
      varieties[pokemonData[i].name] = cloneDeep(pokemonData[i]);
      varieties[pokemonData[i].name].seen = false;
      varieties[pokemonData[i].name].caught = false;
    }
    // set the Kanto starter pokemon to seen & caught
    varieties.bulbasaur.seen = true;
    varieties.charmander.seen = true;
    varieties.squirtle.seen = true;

    // resolve the references in the species, changing string names into object references
    let species = {};
    for (let i in speciesData) {
      species[speciesData[i].name] = cloneDeep(speciesData[i]);
      for (let j in species[speciesData[i].name].varieties) {
        let name = species[speciesData[i].name].varieties[j];
        species[speciesData[i].name].varieties[j] = varieties[name];
      }
      for (let j in species[speciesData[i].name].evolvesTo) {
        let name = species[speciesData[i].name].evolvesTo[j];
        species[speciesData[i].name].evolvesTo[j] = varieties[name];
      }
      if (species[speciesData[i].name].evolvesFrom !== null) {
        let name = species[speciesData[i].name].evolvesFrom;
        species[speciesData[i].name].evolvesFrom = varieties[name];
      }
    }

    // resolve the references in the pokedexes, changing string names into object references
    let pokedexes = {};
    for (let i in pokedexData) {
      pokedexes[pokedexData[i].name] = cloneDeep(pokedexData[i]);
      for (let j in pokedexes[pokedexData[i].name].species) {
        let name = pokedexes[pokedexData[i].name].species[j];
        pokedexes[pokedexData[i].name].species[j] = species[name];
      }
    }

    pokedexes["personal"] = cloneDeep(pokedexes["national"]);
    pokedexes["personal"].name = "personal";
    pokedexes["personal"].displayName = "Personal";

    this.state = {
      pokedexes: pokedexes,
      species: species,
      varieties: varieties
    };

    // bind methods to this instance of the App
    this.addToPersonalPokedex = this.addToPersonalPokedex.bind(this);
    
  }

  /**
   * Add the species to the Personal Pokedex
   * @param {species} array
   */
  addToPersonalPokedex(seen, caught) {
    this.setState ((prevState) => {
      let pokedexes = cloneDeep(prevState.pokedexes);
      let varieties = cloneDeep(prevState.varieties);
      
      // mark the pokemon as seen
      for (let i in seen) {      
        let species = pokedexes.personal.species.find(x => x.name === seen[i].name);
        species.varieties[0].seen = true;
      }

      // mark the pokemon as caught
      for (let i in caught) {
        let species = pokedexes.personal.species.find(x => x.name === caught[i].name);
        species.varieties[0].caught = true;
      }

      return {
        pokedexes: pokedexes,
        varieties: varieties
      }
    });
  }
  
  /**
   * Render the App into HTML.
   * @returns The HTML rendering of the App.
   */
  render() {
    let self = this;

    if ((this.state.pokedexes === null) || (this.state.species === null) || (this.state.varieties === null)) {
      return (
        <div className="App">
          <p>Loading Data</p>
        </div>
      );
    }

    return (
      <BrowserRouter>
        <Navbar style={{height: "10vh"}} bg="white" variant="light" expand="lg" fixed="top" collapseOnSelect="true">
          <LinkContainer to="/">
            <Navbar.Brand className="brand ms-2" href="/">
              Dibdin & Son's Pokémon Trainer
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle/>
          <Navbar.Collapse className="justify-content-end me-3" id="basic-navbar-nav">
              <Nav className="mr-auto">
                <LinkContainer to="/">
                  <Nav.Link href="/">Home</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/Quest">
                  <Nav.Link href="/Quest">Quest</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/Games">
                  <Nav.Link href="/Games">Games</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/pokedex">
                  <Nav.Link href="/pokedex">Pokedex</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/about">
                  <Nav.Link href="/about">About</Nav.Link>
                </LinkContainer>
              </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Switch>
          <Route exact path="/">
            <Redirect to="/quest"/>
          </Route>
          <Route path="/quest">
            <Quest pokedexes={this.state.pokedexes} species={this.state.species} varieties={this.state.varieties}
              changeUrl={(url) => this.props.history.push(url)}
            />
          </Route>  
          <Route path="/Games">
            <div className="scrollable-full">
              <a href="/MatchingGame/color/kanto/medium">Color Matching Game - Kanto - Medium</a><br/>
              <a href="/MatchingGame/color/johto/medium">Color Matching Game - Johto - Medium</a><br/>
              <a href="/MatchingGame/color/galar/easy">Color Matching Game - Galar - Easy</a><br/>

              <a href="/MatchingGame/type/kanto/easy">Type Matching Game - Kanto - Easy</a><br/>
              <a href="/MatchingGame/shape/kanto/easy">Shape Matching Game - Kanto - Easy</a><br/>

              <a href="/TypeEffectivenessGame/single/kanto/easy">Type Effectiveness Game - Kanto - Easy</a><br/>
            </div>
          </Route>
          <Route path="/MatchingGame/:mode/:region/:level" component={ 
            (props) => 
              <MatchingGame pokedexes={this.state.pokedexes} species={this.state.species} varieties={this.state.varieties}
              mode={props.match.params.mode} region={props.match.params.region} level={props.match.params.level}
              gameOver={(seen, caught) => {self.addToPersonalPokedex(seen, caught); props.history.push("/");}}
              />
          } />
          <Route path="/TypeEffectivenessGame/:mode/:region/:level" component={ 
            (props) => 
              <TypeEffectivenessGame pokedexes={this.state.pokedexes} species={this.state.species} varieties={this.state.varieties}
              mode={props.match.params.mode} region={props.match.params.region} level={props.match.params.level}
              gameOver={(seen, caught) => {self.addToPersonalPokedex(seen, caught); props.history.push("/");}}
              />
          } />
          <Route exact path="/pokedex">
            <Pokedex pokedexes={this.state.pokedexes} species={this.state.species} varieties={this.state.varieties}/>
          </Route>
          <Route exact path="/about">
            <div className="scrollable-full full-height d-flex justify-content-center flex-column bg-image" style={{backgroundImage: "url(images/wallpaper.jpg)"}}>
              <div className="bg-opacity-75 bg-white text-center p-3 m-auto">
                <h1>Created by Pete Dibdin</h1>
                <h2>Tested by Caleb Dibdin</h2>
                <p>
                  Coded in Javascript, HTML and CSS<br/>
                  Frameworks: React, Bootstrap and React-Bootstrap<br/>
                  Pokémon data and images provided by PokéAPI<br/>
                </p>
              </div>
            </div>

          </Route>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
