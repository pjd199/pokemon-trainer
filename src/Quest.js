import React, {Component} from "react";
import Button from "react-bootstrap/Button";
import OptionSelectModal from "./OptionSelectModal";
import { withRouter } from "react-router";
import autoBindReact from "auto-bind";

/**
 * Component for the quest
 */
class Quest extends Component {

  /**
   * Constuctor for the compoment
   * @param {Object} props - Properties passed to the component
   */
  constructor(props) {
    super(props);
    autoBindReact(this);

    let regionList = [];
    let regionBackgrounds = [];
    for (let i in props.pokedexes) {
      if (props.pokedexes[i].name !== "national" && props.pokedexes[i].name !== "personal") {
        regionList.push(props.pokedexes[i].name);

        let image = new Image();
        image.src = `/images/region/${props.pokedexes[i].name}.png`
      }
    }

    this.state = {
      showLevelSelect: false,
      regionList: regionList,
      regionBackgrounds: regionBackgrounds,
      regionIndex: 0,
      gameHeader: "MatchingGame",
      gameMode: "color",
      gameLevel: "easy",
      worldTicket: true
    };
  }

  /**
   * Starts the matching game, with the given level
   * @param {String} level 
   */
  startMatchingGame(level) {
    this.setState({
      gameLevel: level,
      showLevelSelect: false
    });

    this.props.history.push(`/${this.state.gameHeader}/${this.state.gameMode}/${this.state.regionList[this.state.regionIndex]}/${level}`);
  }

  /**
   * Get the seen, caught and total stats for the current region
   * @returns {Object} An object with the numeric properties seen, caught and total
   */
  getRegionStats() {
    let regionName = this.state.regionList[this.state.regionIndex];
    let seen = 0;
    let caught = 0;
    let total = 0;

    // for each species in this region, record the stats from the personal pokedex
    for (let i in this.props.pokedexes[regionName].species) {
      let species = this.props.pokedexes.personal.species.find(x => (x.name === this.props.pokedexes[regionName].species[i].name))
      if (species.seen) {
        seen = seen + 1;
      }
      if (species.caught) {
        caught = caught + 1;
      }
      total = total + 1;
    }

    return {
      seen: seen,
      caught: caught,
      total: total
    }
  }

  /**
   * Returns true if the region is completed in the personal pokedex
   * @returns {boolean} Returns true if the region is complete in the personal pokedex, otherwise returns false
   */
  isRegionComplete() {
    let regionName = this.state.regionList[this.state.regionIndex];

    // for each specie in this region, check to see if it is marked as caught in the personal pokedex
    for (let i in this.props.pokedexes[regionName].species) {
      if (!this.props.pokedexes.personal.species.find(x => (x.name === this.props.pokedexes[regionName].species[i].name)).caught) {
        return false;
      }
    }

    return true;

  }

  /**
   * Renders the component into HTML
   * @returns JSX
   */
  render() {
    let regionName = this.state.regionList[this.state.regionIndex];

    let {seen, caught, total} = this.getRegionStats();

    return (
      <div className="scrollable-full d-flex align-items-center w-100 bg-image" style={{backgroundImage: `url(/images/region/${regionName}.png)`}}>
        <div className="bg-white text-center bg-opacity-50 m-auto d-inline-flex flex-column p-5 align-items-center">
          {/*Header*/}
          <h1>
            {this.props.pokedexes[regionName].displayName} 
          </h1>
          <h2 className="text-center">
            Can you catch 'em all?
          </h2>
          <p>You've seen {seen} out of {total} pokemon <br/> and have {total - caught} pokemon left to catch</p>
          {/*Game buttons*/}
          <Button className="m-1" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "color"})}>
            Colour
          </Button>
          <Button className="m-1" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "type"})}>
            Type
          </Button>
          <Button className="m-1" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "shape"})}>
            Shapes
          </Button>
          <Button className="m-1" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "name"})}>
            Names
          </Button>
          <Button className="m-1" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "TypeEffectivenessGame", gameMode: "single"})}>
            Single Type Effectiveness
          </Button>
          <Button className="m-1" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "TypeEffectivenessGame", gameMode: "dual"})}>
            Dual Type Effectiveness
          </Button>
          {/*Forward and backwards buttons*/}
          <div className="d-flex w-100 justify-content-between">
            <Button variant="secondary" className={this.state.regionIndex > 0 ? "visible" : "invisible"} onClick={() => this.setState((prevState) => ({regionIndex: prevState.regionIndex - 1}))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
            </Button>
            <Button variant="secondary" className={(this.isRegionComplete() && (this.state.regionIndex < this.state.regionList.length)) ? "visible" : "invisible"} onClick={() => this.setState((prevState) => ({regionIndex: prevState.regionIndex + 1}))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
              </svg>
            </Button>
          </div>
        </div>

        <OptionSelectModal
          title="Level Select"
          message="What level of challenge would you like?"
          options={["Easy", "Medium", "Hard"]}
          show={this.state.showLevelSelect}
          onHide={() => this.setState({showLevelSelect: false})}
          onOptionSelect={(level) => this.startMatchingGame(level.toLowerCase())}
        />
      </div>
    );
  }
}

export default withRouter(Quest);