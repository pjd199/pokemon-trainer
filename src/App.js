import React, {Component} from "react";
import Pokedex from "./Pokedex";
import MatchingGame from "./MatchingGame";
import TypeEffectivenessGame from "./TypeEffectivenessGame";
import Quest from "./Quest";
import cloneDeep from "lodash.clonedeep";

import {BrowserRouter, Switch, Route, Redirect} from "react-router-dom";
//import {withRouter} from "react-router";
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

    
    // initiailize the default state
    this.state = {
      pokedexes: null,
      species: null,
      varieties: null,
    };

    // bind methods to this instance of the App
    this.loadData = this.loadData.bind(this);
    
    setTimeout(this.loadData, 0);
  }

  async loadData() {
    let pokedexData = require("./pokedexData.json");
    let speciesData = require("./speciesData.json");
    let pokemonData = require("./pokemonData.json");

    // resolve the references in the data, changing string names into object references
    let varieties = {};
    for (let i in pokemonData) {
      varieties[pokemonData[i].name] = cloneDeep(pokemonData[i]);
    }

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

    let pokedexes = {};
    for (let i in pokedexData) {
      pokedexes[pokedexData[i].name] = cloneDeep(pokedexData[i]);
      for (let j in pokedexes[pokedexData[i].name].species) {
        let name = pokedexes[pokedexData[i].name].species[j];
        pokedexes[pokedexData[i].name].species[j] = species[name];
      }
    }

    this.setState ({
      pokedexes: pokedexes,
      species: species,
      varieties: varieties
    });
  }
  
  /**
   * Render the App into HTML.
   * @returns The HTML rendering of the App.
   */
  render() {

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
                <LinkContainer to="/credits">
                  <Nav.Link href="/credits">Credits</Nav.Link>
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
              gameOver={() => props.history.goBack()}
              />
          } />
          <Route path="/TypeEffectivenessGame/:mode/:region/:level" component={ 
            (props) => 
              <TypeEffectivenessGame pokedexes={this.state.pokedexes} species={this.state.species} varieties={this.state.varieties}
              mode={props.match.params.mode} region={props.match.params.region} level={props.match.params.level}
              gameOver={() => props.history.goBack()}
              />
          } />
          <Route exact path="/pokedex">
            <Pokedex pokedexes={this.state.pokedexes} species={this.state.species} varieties={this.state.varieties}/>
          </Route>
          <Route exact path="/about">
            About
          </Route>
          <Route exact path="/credits">
            Credits
          </Route>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
