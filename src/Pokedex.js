import React, {Component} from "react";
import PokemonCard from "./PokemonCard";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row"; 
import Dropdown from "react-bootstrap/Dropdown";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

class Pokedex extends Component {

  static pokedexes = require("./pokedexes.json"); 
  static colors = require("./colors.json");
  static habitats = require("./habitats.json");
  static types = require("./types.json");
  static shapes = require("./shapes.json");

  static filters = { 
    pokedex: {
      names: ["personal", ...Pokedex.pokedexes.map((item, i) => item.name)],
      displayNames: ["Personal Pokedéx", ...Pokedex.pokedexes.map((item, i) => (item.displayName + " Pokedéx"))]
    },
    color: {
      names: ["all", ...Pokedex.colors.map((item, i) => item.name)],
      displayNames: ["All Colours", ...Pokedex.colors.map((item, i) => item.displayName)]
    },
    habitat: {
      names: ["all", ...Pokedex.habitats.map((item, i) => item.name)],
      displayNames: ["All Habitats", ...Pokedex.habitats.map((item, i) => item.displayName)]
    },
    type: {
      names: ["all", ...Pokedex.types.map((item, i) => item.name)],
      displayNames: ["All Types", ...Pokedex.types.map((item, i) => item.displayName)]
    },
    shape: {
      names: ["all", ...Pokedex.shapes.map((item, i) => item.name)],
      displayNames: ["All Shapes", ...Pokedex.shapes.map((item, i) => item.displayName)]
    },
    group: {
      names: ["all", "ordinary", "mythical", "legendary"],
      displayNames: ["All Groups", "Ordinary", "Mythical", "Legendary"]
    }
  };

  /**
   * Initialise the App compoment
   * @constructor
   * @param {Object} props - The properties passed to the object via a HTML tag
   */
  constructor(props) {
    super(props);

    // Preload a blank image
    let preload = new Image();
    preload.src = "/images/blank.png";

    // initiailize the default state
    this.state = {
      currentSpecies: null,
      currentVariety: null,
      filter: {
        pokedex: 0,
        color: 0,
        habitat: 0,
        type: 0,
        shape: 0,
        group: 0
      }
    };

    // bind methods to this instance of the App
    this.handleSpeciesChange = this.handleSpeciesChange.bind(this);
    this.getFiltedList = this.getFilteredList.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
  }

  handleFilterChange (name, index) {
    this.setState((state) => {
      state.filter[name] = index;
      if (name === "pokedex") {
        state.currentSpecies = null;
        state.currentVariety = null;
      }
      return state;
    });
  }

  handleSpeciesChange(speciesName) {
    let species = this.props.species[speciesName];
    this.setState({
      currentSpecies: species,
      currentVariety: species.varieties[0]
    });
  }

  getFilteredList() {
    let filteredList = [...this.props.pokedexes[Pokedex.filters.pokedex.names[this.state.filter.pokedex]].species];

    // fitler Personal pokedex
    if (this.props.pokedexes[Pokedex.filters.pokedex.names[this.state.filter.pokedex]].name === "personal") {
      filteredList = filteredList.filter(species => (species.seen || species.caught));
    }

    // filter on pokedex
    if (this.state.filter.color > 0) {
      let name = Pokedex.filters.color.names[this.state.filter.color];
      filteredList = filteredList.filter(species => (species.color === name));
    }

    // filter on color
    if (this.state.filter.color > 0) {
      let name = Pokedex.filters.color.names[this.state.filter.color];
      filteredList = filteredList.filter(species => (species.color === name));
    }

    // filter on habitat
    if (this.state.filter.habitat > 0) {
      let name = Pokedex.filters.habitat.names[this.state.filter.habitat];
      filteredList = filteredList.filter(species => (species.habitat === name));
    }

    // filter on types
    if (this.state.filter.type > 0) {
      let name = Pokedex.filters.type.names[this.state.filter.type];
      filteredList = filteredList.filter(species => (species.varieties[0].types.includes(name)));
    }

    // filter on shape
    if (this.state.filter.shape > 0) {
      let name = Pokedex.filters.shape.names[this.state.filter.shape];
      filteredList = filteredList.filter(species => (species.shape === name));
    }

    // filter on grouping
    if (this.state.filter.group > 0) {
      switch (this.state.filter.group) {
        case 1: // Ordinary
          filteredList = filteredList.filter(species => (!species.isLegendary && !species.isMythical));
          break;
        case 2: // Mythical
          filteredList = filteredList.filter(species => (species.isMythical === true));
          break;
        case 3: // Legendary
          filteredList = filteredList.filter(species => (species.isLegendary === true));
          break;
        default: // All 
          break;
      }
    }

    return filteredList;
  }

  /**
   * Render the Pokedex into HTML.
   * @returns The HTML rendering of the App.
   */
  render() {

    let isPersonalPokedex = (Pokedex.filters.pokedex.names[this.state.filter.pokedex] === "personal");

    // Get the pokemon to display with the current filter settings
    let filteredList = this.getFilteredList();

    return (
      <div>
        <div className="scrollable-left">
          <div className="sticky-top d-flex bg-white p-1 border">
            {Object.keys(Pokedex.filters).map((name, i) => (
              <Dropdown className="mx-1" key={"dropdown-" + name}>
                <Dropdown.Toggle variant="success">
                  {Pokedex.filters[name].displayNames[this.state.filter[name]]}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {Pokedex.filters[name].displayNames.map((item, i) =>
                    <Dropdown.Item eventKey={i} onClick={(e) => this.handleFilterChange(name, i)} key={"filter" + name + item} >{item}</Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            ))}
          </div>

          <div>
            <Row className="m-1">
              {(filteredList.length === 0) && <h1 className="text-center">Found no matching Pokemon</h1>}
              {filteredList.map((species, i) => (
                <Col className="border rounded d-flex align-items-center justify-items-center" key={species.name} xs={4} md={2}>
                  <div onClick={(e) => this.handleSpeciesChange(species.name)}>
                    <LazyLoadImage key={i} className="w-100" alt={species.name} src={species.varieties[0].imageUrl} placeholderSrc="/images/blank.png"
                      style={{filter: (isPersonalPokedex && species.seen && !species.caught) ? "brightness(0)" : ""}}/>
                  </div>
                </Col>    
              ))}
          </Row>
          </div>
        </div>
        <div className="scrollable-right">
          <div>
          {((this.state.currentSpecies === null) || this.state.currentVariety === null) &&
            <div className="text-center">
              <h1>The {this.props.pokedexes[Pokedex.filters.pokedex.names[this.state.filter.pokedex]].displayName} Pokedéx</h1>
              <LazyLoadImage className="w-75" 
                alt={`${this.props.pokedexes[Pokedex.filters.pokedex.names[this.state.filter.pokedex]].displayName} Pokedéx`}
                src={this.props.pokedexes[Pokedex.filters.pokedex.names[this.state.filter.pokedex]].imageUrl}
                effect="opacity"
              />
            </div>
          }
            {((this.state.currentSpecies !== null) && this.state.currentVariety !== null) &&
              <PokemonCard pokedex={this.props.pokedexes[Pokedex.filters.pokedex.names[this.state.filter.pokedex]]} species={this.state.currentSpecies} variety={this.state.currentVariety}/>
            }
          </div>
        </div>
      </div>
    );
  }
}
export default Pokedex;
