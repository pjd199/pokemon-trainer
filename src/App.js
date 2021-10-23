import React, {Component} from "react";
import {BrowserRouter, Switch, Route} from "react-router-dom";
import {LinkContainer} from 'react-router-bootstrap';
import { Navbar, Nav } from 'react-bootstrap'
import Button from "react-bootstrap/Button";
import Pokedex from "./Pokedex";
import MatchingGame from "./MatchingGame";
import TypeEffectivenessGame from "./TypeEffectivenessGame";
import Quest from "./Quest";
import TextInputModal from "./TextInputModal";
import cloneDeep from "lodash.clonedeep";
import PersonalStore from "./PersonalStore";
import autoBindReact from "auto-bind";

/**
 * The main app
 */
class App extends Component {

  /**
   * Initialise the App compoment
   * @constructor
   * @param {Object} props - The properties passed to the object via a HTML tag
   */
  constructor(props) {
    super(props);
    autoBindReact(this);

    let preload = new Image();
    preload.src = "/images/pokemon-training-center.png";

    let pokedexData = require("./pokedexData.json");
    let speciesData = require("./speciesData.json");
    let pokemonData = require("./pokemonData.json");

    let personalStore = new PersonalStore();

    // resolve the references in the varieties, changing string names into object references
    // also, set the seen & caught flags to false
    let varieties = {};
    for (let i in pokemonData) {
      varieties[pokemonData[i].name] = cloneDeep(pokemonData[i]);
    }

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

    // Create the personal pokedex
    pokedexes.personal = cloneDeep(pokedexes["national"]);
    pokedexes.personal.name = "personal";
    pokedexes.personal.displayName = "Personal";

    // set the Kanto starter pokemon to seen, to get the personal pokedex started
    pokedexes.personal.species.find(x => (x.name === "bulbasaur")).seen = true;
    pokedexes.personal.species.find(x => (x.name === "charmander")).seen = true;
    pokedexes.personal.species.find(x => (x.name === "squirtle")).seen = true;

    // set the initial state
    this.state = {
      pokedexes: pokedexes,
      species: species,
      varieties: varieties,
      userList: null,
      currentUser: null,
      personalStore: personalStore
    };
  }

  /**
   * Called when React mounts the component
   */
  componentDidMount() {

    // DEBUG - Clear the database - use wisely!!!
    //this.state.personalStore.clearAllData();
    

    /*
    // DEBUG - Dump the database to the console for testing purposes
    this.state.personalStore.dump()
    .then(output => console.log(JSON.stringify(output)))
    .catch(reason => console.error(reason));
    */

    // Load the settings and the personal pokedex
    this.state.personalStore.getAllSettings()
    .then(settings => {
      // load the settings and set the state
      console.log("Settings >>> " + JSON.stringify(settings));
      let firstTime = (settings.currentUser === undefined);

      this.setState({
        currentUser: firstTime ? null : settings.currentUser,
        showCreateUser: firstTime,
        userList: settings.userList
      });

      // load the personal pokedex, if one exists
      if (!firstTime) {
        this.state.personalStore.getPersonalPokedexEntries(settings.currentUser)
        .then(results => {
            this.setState((prevState) => { 
              let pokedexes = cloneDeep(prevState.pokedexes);
    
              // assign values from the personal pokedex
              for (let i in results) {
                pokedexes.personal.species.find(x => (x.name === results[i].pokemon)).seen = results[i].seen;
                pokedexes.personal.species.find(x => (x.name === results[i].pokemon)).caught = results[i].caught;
              }
    
              return {
                pokedexes: pokedexes
              }
            });
        })
        .catch(reason => {
          // undefied means there is no values stored, so not an error
          if (reason !== undefined) {
            console.error(reason)
          }
        });
      }
    })
    .catch(reason => console.error(reason));
  }


  /**
   * Add the species to the Personal Pokedex
   * @param {species} array
   */
  async addToPersonalPokedex(seen, caught) {
    this.setState ((prevState) => {
      let pokedexes = cloneDeep(prevState.pokedexes);
      
      // mark the pokemon as seen
      for (let i in seen) {
        pokedexes.personal.species.find(x => x.name === seen[i].name).seen = true;
        prevState.personalStore.setPersonalPokedexSeen(prevState.currentUser, seen[i].name);
      }

      // mark the pokemon as caught
      for (let i in caught) {
        pokedexes.personal.species.find(x => x.name === caught[i].name).caught = true;
        prevState.personalStore.setPersonalPokedexCaught(prevState.currentUser, caught[i].name);
      }

      return {
        pokedexes: pokedexes
      }
    });
  }


  /**
   * Add a new user to the personalStore
   * @param {String} name 
   */
  async addUser(name) {
    // add the user, and make the new user the current user
    await this.state.personalStore.addUser(name);
    await this.state.personalStore.setSetting("currentUser", name); 
    
    // get the updated userList
    let userList = await this.state.personalStore.getUserList();
    this.setState({
      userList: userList,
      currentUser: name,
      showCreateUser: false
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
      <>
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
                  <LinkContainer exact to="/">
                    <Nav.Link>Home</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/Quest">
                    <Nav.Link>Quest</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/Games">
                    <Nav.Link>Games</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/pokedex">
                    <Nav.Link>Pokedex</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/about">
                    <Nav.Link>About</Nav.Link>
                  </LinkContainer>
                </Nav>
            </Navbar.Collapse>
          </Navbar>

          <Switch>
            <Route exact path="/" component={
              (props) => 
                <div className="scrollable-full full-height d-flex justify-content-center flex-column bg-image" style={{backgroundImage: "url(/images/pokemon-training-center.png)"}}>
                  <div className="bg-opacity-75 bg-white text-center p-3 m-auto">
                    <h1>Welcome {this.state.currentUser}</h1>
                    <p>
                      Are you ready to become a Pokemon Master?
                    </p>
                    <Button className="m-3" variant="primary" onClick={() => props.history.push("/quest")}>
                      Let's Go!
                    </Button>
                  </div>
                </div>
            }/>
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
                gameOver={(seen, caught) => {self.addToPersonalPokedex(seen, caught); props.history.goBack();}}
                />
            } />
            <Route path="/TypeEffectivenessGame/:mode/:region/:level" component={ 
              (props) => 
                <TypeEffectivenessGame pokedexes={this.state.pokedexes} species={this.state.species} varieties={this.state.varieties}
                mode={props.match.params.mode} region={props.match.params.region} level={props.match.params.level}
                gameOver={(seen, caught) => {self.addToPersonalPokedex(seen, caught); props.history.goBack();}}
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

        <TextInputModal
            title="Create new user"
            message="Welcome! Please enter you name below"
            show={this.state.showCreateUser}
            onHide={() => this.setState({showCreateUser: false})}
            onSubmit={(user) => this.addUser(user)}
        />
      </>
    );
  }
}

export default App;