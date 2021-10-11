import React, {Component} from "react";
import Button from "react-bootstrap/Button";
import OptionSelectModal from "./OptionSelectModal";

import { withRouter } from "react-router";

class Quest extends Component {

  constructor(props) {
    super(props);

    let regionList = [];
    for (let i in props.pokedexes) {
      if (props.pokedexes[i].name !== "national") {
        regionList.push(props.pokedexes[i].name);
      }
    }

    this.state = {
      showLevelSelect: false,
      regionList: regionList,
      regionIndex: 0,
      gameHeader: "MatchingGame",
      gameMode: "color",
      gameLevel: "easy",
      worldTicket: true
    };

    this.startMatchingGame = this.startMatchingGame.bind(this);
  }

  startMatchingGame(level) {
    this.setState({
      gameLevel: level,
      showLevelSelect: false
    });

    this.props.history.push(`/${this.state.gameHeader}/${this.state.gameMode}/${this.state.regionList[this.state.regionIndex]}/${level}`);
  }

  render() {
    let regionName = this.state.regionList[this.state.regionIndex];

    return (
      <div className="scrollable-full d-flex align-items-center w-100 bg-image" style={{backgroundImage: `url(/images/region/${regionName}.png)`}}>
        <div className="bg-white text-center bg-opacity-50 m-auto d-inline-flex flex-column p-5 align-items-center">
          <h1>
            {this.props.pokedexes[regionName].displayName} 
          </h1>
          <h2 className="text-center">
            Can you catch 'em all?
          </h2>
          <Button className="m-3" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "color"})}>
            Learn Pokemon Colours
          </Button>
          <Button className="m-3" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "type"})}>
            Learn Pokemon Types
          </Button>
          <Button className="m-3" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "shape"})}>
            Learn Pokemon Shapes
          </Button>
          <Button className="m-3" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "MatchingGame", gameMode: "name"})}>
            Learn Pokemon Names
          </Button>
          <Button className="m-3" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "TypeEffectivenessGame", gameMode: "single"})}>
            Learn Type Effectiveness (Single)
          </Button>
          <Button className="m-3" variant="primary" onClick={() => this.setState({showLevelSelect: true, gameHeader: "TypeEffectivenessGame", gameMode: "dual"})}>
            Learn Type Effectiveness (Dual)
          </Button>
          {/*View My Personal Pokedex*/}
          <div className="d-flex w-100 justify-content-between">
            <Button variant="secondary" disabled={this.state.regionIndex === 0} onClick={() => this.setState((prevState) => ({regionIndex: prevState.regionIndex - 1}))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
            </Button>
            <Button variant="secondary" disabled={this.state.regionIndex === (this.state.regionList.length-1)} onClick={() => this.setState((prevState) => ({regionIndex: prevState.regionIndex + 1}))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
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