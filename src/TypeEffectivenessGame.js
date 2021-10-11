import React, {Component} from "react";
import cloneDeep from "lodash.clonedeep";
import shuffleArray from "lodash.shuffle";

class TypeEffectivenessGame extends Component {

  static typeEffectivenessData = require("./typeEffectiveness.json");

  static typeList = Object.keys(this.typeEffectivenessData);

  static types = require("./types.json");

  static levelConfig = {
    easy: {
      maxTurns: 20,
      hintsAvailable: 999,
      maxOnScreen: 6,
      timedMode: false
    },
    medium: {
      maxTurns: 20,
      hintsAvailable: 5,
      maxOnScreen: 9,
      timedMode: false
    },
    hard: {
      maxTurns: 20,
      hintsAvailable: 3,
      maxOnScreen: 18,
      maxCanCatch: 999,
      timedMode: false
    },
    timed: {
      maxTurns: 9999,
      hintsAvailable: 3,
      maxOnScreen: 18,
      maxCanCatch: 999,
      timedMode: true,
      timeInitial: 30000,
      timeBonusRegular: 1000,
      timeBonusLegendary: 10000
    }
  };

  static gameMode = {
    single: {
      displayName: "single",
      count: 1
    },
    dual: {
      displayName: "dual",
      count: 2
    }
  }

  static pokeballImageSrc = "/images/pokeball/pokeball.png";

  /**
   * Initialise the compoment
   * @constructor
   * @param {Object} props - The properties passed to the object via a HTML tag
   */
  constructor(props) {
    super(props);

    let mode = TypeEffectivenessGame.gameMode[props.mode.toLowerCase()];
    let pokedex = props.pokedexes[props.region.toLowerCase()];
    let level = TypeEffectivenessGame.levelConfig[props.level.toLowerCase()];

    // setup the game, as either singles or doubles
    let deck = shuffleArray(pokedex.species).filter(value => value.varieties[0].types.length <= mode.count);
    let defender = deck.pop();


    this.state = {
      deck: deck,
      defender: defender,
      attacks: this.getAttackArray(defender, level.maxOnScreen),
      maxOnScreen: level.maxOnScreen,
      turn: 1,
      message: `What's the best type to use against ${defender.displayName} (${defender.varieties[0].types.join('/')}).`,
      hintsRemaining: level.hintsAvailable,
      showHint: false,
      bigWord: null,
      ignoreClicks: false,
      mode: mode,
      showHint: false,
      level: level,
      pokedex: pokedex,
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      gameOver: props.gameOver
    };

    this.getAttackArray = this.getAttackArray.bind(this);
    this.handleAttackClick = this.handleAttackClick.bind(this);
    this.handleShowHintClick = this.handleShowHintClick.bind(this);

    let preloadedImage = new Image();
    preloadedImage.src = TypeEffectivenessGame.pokeballImageSrc;

    window.addEventListener('resize', () => {
      this.setState({
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth
      });
    });
  }

  getAttackArray(defender, max) {
    // load the attacks with their multipliers
    let attacks = [];
    let i = 0;
    for (let attackType of TypeEffectivenessGame.typeList) {
      let multiplier = TypeEffectivenessGame.typeEffectivenessData[attackType][defender.varieties[0].types[0]];
      if (defender.varieties[0].types.length === 2) {
        multiplier = multiplier * TypeEffectivenessGame.typeEffectivenessData[attackType][defender.varieties[0].types[1]];
      }

      attacks[i] = {
        name: attackType,
        multiplier: multiplier,
        hasBeenClicked: false
      };
      i = i + 1;
    }

    // sort the attacks into most effective first, then select the first maxOnScreen
    attacks.sort((a, b) => (b.multiplier - a.multiplier));
    attacks = attacks.slice(0, max);
    attacks = shuffleArray(attacks);

    return attacks;
  }

  handleShowHintClick() {
    this.setState( (prevState) => {
      return {
        showHint: true,
        hintsRemaining: (prevState.hintsRemaining >= 1) ? (prevState.hintsRemaining - 1) : 0
      }
    });
  }

  /**
   * Handle the throwing of the ball, and progress the game.
   * 
   * Easy   - match two pokemon, show colors on display,
   * Medium - match all pokemon of that color, mention color/how many left in the message,
   * Hard   - match all pokemon of that color, hide colors
   * 
   * @param {Object} species - the species of pokemon that was clicked 
   */
  handleAttackClick(position) {

    // ignore click if this sqaure has already been clicked this turn
    if (this.state.ignoreClicks || this.state.attacks[position].hasBeenClicked) {
      return;
    }

    // move the game on one throw after 500 milliseconds, so user see's update    
    this.setState ((prevState) => {
      let attacks = cloneDeep(prevState.attacks);
      let defender = prevState.defender;
      let message = ""; 
      let bigWord = null;
      let endOfTurn = false;
      
      attacks[position].hasBeenClicked = true;

      if (attacks[position].multiplier >= 2) {
        bigWord = "Super Effective";
      } else if (attacks[position].multiplier >= 1) {
        bigWord = "Good Attack";
      } else if (attacks[position].multiplier > 0) {
        bigWord = "Not Very Effective";
      } else {
        bigWord = "No Effect";
      }

      message = `${attacks[position].name} type attack multiplier is ${attacks[position].multiplier} against ${defender.displayName} (${defender.varieties[0].types.join('/')})`;
      
      endOfTurn = true;

      return {
        message: message,
        bigWord: bigWord,
        ignoreClicks: (endOfTurn ? true : false),
        endOfTurn: endOfTurn
      }
    });
  
    // if this is the end of the turn, replace all the clicked pokemon with new ones after a short delay
    setTimeout( () => {
      this.setState( (endOfTurnState) => {

        // need this because React Strict calls twice
        if (!endOfTurnState.endOfTurn) return;

        let endDeck = [...endOfTurnState.deck];        
        let defender = endDeck.pop();
        let endAttacks = this.getAttackArray(defender, endOfTurnState.maxOnScreen);
        let endMessage = `What's the best type to use against ${defender.displayName} (${defender.varieties[0].types.join('/')}).`;
        let endTurn = endOfTurnState.turn;
        let endIgnoreClicks = endOfTurnState.ignoreClicks;

        // check if end of round
        if (endTurn >= endOfTurnState.level.maxTurns) {
          // end of round
          endMessage = `End of Round! You caught ${endOfTurnState.caught.length} pokemon.`;
          alert (endMessage);
          endOfTurnState.gameOver(endOfTurnState.caught);
          endIgnoreClicks = true;
        } else {
          // not yet the end, so increament the turn counter
          endTurn = endTurn + 1;
          endIgnoreClicks = false;
        }

        return {
          attacks: endAttacks,
          deck: endDeck,
          turn: endTurn,
          message: endMessage,
          bigWord: "",
          ignoreClicks: endIgnoreClicks,
          showHint: false,
          endOfTurn: false
        }
      });
    }, 3000);

  }


  /**
   * Render the Pokedex into HTML.
   * @returns The HTML rendering of the App.
   */
  render() {
    // find best combination of rows, columns and image size
    let numberOfRows = 0;
    let numberOfCols = 0;
    let size = 0;
    for (let i = 1; i <= this.state.maxOnScreen; i++) {
      // is this a valid number of rows
      if ((this.state.maxOnScreen % i) === 0) {
        let calcRows = i;
        let calcCols = this.state.maxOnScreen / i;
        let calcSize = Math.min(((this.state.innerWidth * 0.9) / calcCols), ((this.state.innerHeight * 0.8) / calcRows)); 
        // if this is a better size
        if (calcSize >= size) {
          numberOfRows = calcRows;
          numberOfCols = calcCols;
          size = calcSize;
        }
      }
    }
    size = Math.floor(size);


    // assemble the HTML into columns and rows
    let rows = [];
    let columns = [];    
    this.state.attacks.forEach((square, i) => {

      let typeSrc = square.hasBeenClicked ? TypeEffectivenessGame.pokeballImageSrc : `/images/type/${square.name}.svg`
      let blankSrc = square.hasBeenClicked ? TypeEffectivenessGame.pokeballImageSrc : "/images/blank.png";

      columns.push(
        <td>
          <div className="d-flex align-items-start justify-items-center text-center" style={{position: "relative"}} onClick={(e) => this.handleAttackClick(i)}>
            {/* Display the standard image*/}
            <img className="text-center border rounded" width={`${size}px`} alt={square.name} src={typeSrc}/>
            {this.state.showHint && 
              <p className="multiplier-overlay">{square.multiplier}</p>
            }
          </div>
        </td>
      );


      if (((i+1) % numberOfCols) === 0) {
        rows.push(
          <tr>
            {columns}
          </tr>  
        );
        columns = [];
      }

    });

    // create the HTML for the hint raspberries
    let hintImages = [];
    for (let i = 0; (i < this.state.hintsRemaining) && (i < 5); i++) {
      hintImages[i] =
        <div className="p-2">
         <img height="40px" src="/images/berry/razz.png" alt="hint" onClick={(e) => this.handleShowHintClick()}/>
        </div>;
    }

     // put everything together, with a status bar at the top
    return (
      <div className="scrollable-full">
        <div className="d-flex w-100 font-weight-bold" style={{backgroundColor: "gold"}}>
            <div className="p-2">Turn {this.state.turn}/{this.state.level.maxTurns}</div>
            <div className="m-auto p-2 px-5">{this.state.message}</div>
            {hintImages}
        </div>

        <div className="w-100 d-flex justify-items-center">
          <div className="m-auto">
            <table>
              {rows}
            </table>
          </div>
          {(this.state.bigWord !== null) &&     
            <div className="centered-overlay">
              {this.state.bigWord.split("").map((letter, i) => (
                  <span>{letter}</span>
              ))}
            </div>
          }          
        </div>
      </div>
    );
  }
}

export default TypeEffectivenessGame;
