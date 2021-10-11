import React, {Component} from "react";
import cloneDeep from "lodash.clonedeep";

class WhoIsThatPokemon extends Component {

  static levelConfig = {
    easy: {
      maxTurns: 20,
      hintsAvailable: 999,
      maxOnScreen: 4,
      timedMode: false
    },
    medium: {
      maxTurns: 20,
      hintsAvailable: 5,
      maxOnScreen: 12,
      timedMode: false
    },
    hard: {
      maxTurns: 20,
      hintsAvailable: 3,
      maxOnScreen: 24,
      timedMode: false
    },
    timed: {
      maxTurns: 9999,
      hintsAvailable: 3,
      maxOnScreen: 24,
      timedMode: true,
      timeInitial: 30000,
      timeBonusRegular: 1000,
      timeBonusLegendary: 10000
    }
  };

  static pokeballImageSrc = "/images/pokeball/pokeball.png";

  /**
   * Initialise the App compoment
   * @constructor
   * @param {Object} props - The properties passed to the object via a HTML tag
   */
  constructor(props) {
    super(props);

    // initiailize the default state
    this.state = {
        deck: [],
        table: [],
        caught: [],
        escaped: [],
        turn: 1,
        message: "",
        hintsRemaining: 1,
        showHint: false,
        level: WhoIsThatPokemon.levelConfig[props.level.toLowerCase()],
        pokedex: props.pokedexes[props.region.toLowerCase()],
        bigWord: null,
        ignoreClicks: true,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        gameOver: props.gameOver
    };

    this.startGame = this.startGame.bind(this);
    this.handleTableClick = this.handleTableClick.bind(this);
    this.handleShowHintClick = this.handleShowHintClick.bind(this);

    let preloadedImage = new Image();
    preloadedImage.src = MatchingGame.pokeballImageSrc;

    window.addEventListener('resize', () => {
      this.setState({
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth
      });
    });

    setTimeout(() => this.startGame(), 1);
  }

  startGame() {
    // setup the board
    let deck = [...this.state.pokedex.species];
    let table = [];
    let totalToCatch = deck.length;

    //shuffe the deck
    for (let i = deck.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // remove a card from the deck and add it to the table
    for (let i = 0; i < (this.state.level.maxOnScreen); i++) {
        table[i] = {
          species: deck.pop(),
          hasCard: true,
          hasBeenClicked: false
        }
    }

    // preload the next images (i.e. last maxOnScreen in array)
    //for (let i = deck.length - 1; i >= 0; i--) {
    //  new Image().src = table[i].species.varieties[0].imageUrl;
    //}

    this.setState({
      deck: deck,
      table: table,
      caught: [],
      escaped: [],
      totalToCatch: totalToCatch,
      maxOnScreen: this.state.level.maxOnScreen,
      turn: 1,
      matchValue: null,
      message: `Choose your first pokemon, then find another of the same ${this.state.mode.displayName}.`,
      hintsRemaining: this.state.level.hintsAvailable,
      showHint: false,
      bigWord: null,
      ignoreClicks: false
    });
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
  handleTableClick(position) {

    // ignore click if this sqaure has already been clicked this turn
    if (this.state.ignoreClicks || this.state.table[position].hasBeenClicked) {
      return;
    }

    // move the game on one throw after 500 milliseconds, so user see's update    
    this.setState ((prevState) => {
      let deck = [...prevState.deck];
      let table = cloneDeep(prevState.table);
      let caught = [...prevState.caught];
      let escaped = [...prevState.escaped];
      let matchValue = prevState.matchValue;
      let message = ""; 
      let turn = prevState.turn;
      let endOfTurn = false;
      let bigWord = null;
      let ignoreClicks = prevState.ignoreClicks;
      
      table[position].hasBeenClicked = true;

      // count the table metrics
      let totalClicked = table.reduce((prev, current) => (prev + (current.hasBeenClicked ? 1 : 0)), 0);
      let allClickedMatching = table.reduce((prev, current) => (prev && (!current.hasBeenClicked || (current.hasBeenClicked && (prevState.mode.isMatching(current.species, matchValue))))), true);
      let totalPossibleMatches = table.reduce((prev, current) => (prev + ((prevState.mode.isMatching(current.species, matchValue)) ? 1 : 0)), 0);

      // process the game logic
      if (totalClicked === 1) {
        // this is the first click in the turn, so set the matchValue
        matchValue = prevState.mode.getMatchValue(table[position].species);
        
        // check if the only match one on the board
        totalPossibleMatches = table.reduce((prev, current) => (prev + ((prevState.mode.isMatching(current.species, matchValue)) ? 1 : 0)), 0);
        if (totalPossibleMatches === 1) {
          message = `Uh Oh! There are no other ${prevState.mode.valueToString(matchValue)} pokemon here that match!`;
          bigWord = "Uh Oh!";
          endOfTurn = true;
        } else {
          // there are more to catch
          if (this.state.level.showHowManyToCatch) {
            message = `Can you find ${(totalPossibleMatches - totalClicked)} more ${prevState.mode.valueToString(matchValue)} pokemon?`
          } else {
            message = `Can you find another ${prevState.mode.valueToString(matchValue)} pokemon?`;
          }
          endOfTurn = false;  
        }

      } else if (!allClickedMatching) {
        // this one doesn't match the others!!!
        message = `Uh Oh! ${table[position].species.displayName} is ${prevState.mode.speciesToString(table[position].species)} NOT ${prevState.mode.valueToString(matchValue)}.`;
        bigWord = "Uh Oh!";

        // move all the clicked pokemon to the escaped list
        for (let i in table) {
          if (table[i].hasBeenClicked) {
            escaped = [...escaped, table[i].species];
          }
        }
        endOfTurn = true;

      } else if ((totalClicked === prevState.level.maxCanCatch) || (totalClicked === totalPossibleMatches)) {
        // player has succesfully clicked all they are allowed to click or there are no matches left to click
        message = `Well done! Can you match any other ${prevState.mode.displayName}s?`;
        if (totalPossibleMatches >= 6) {
          bigWord = "Excellent!";
        } else if (totalPossibleMatches >= 4) {
          bigWord = "Great!";
        } else {
          bigWord = "Nice!";
        }
        
        for (let i in table) {
          if (table[i].hasBeenClicked) {
            caught = [...caught, table[i].species];
          }
        }
        endOfTurn = true;

      } else {
        // there are more to catch
        if (this.state.level.showHowManyToCatch) {
          message = `Can you find ${(totalPossibleMatches - totalClicked)} more ${prevState.mode.valueToString(matchValue)} pokemon?`
        } else {
          message = `Can you find another ${prevState.mode.valueToString(matchValue)} pokemon?`;
        }
        endOfTurn = false;
      }

      // if this is the end of the turn, replace all the clicked pokemon with new ones after a short delay
      if (endOfTurn) {
        setTimeout( () => {
          this.setState( (X) => {
            for (let i in table) {
              if (table[i].hasBeenClicked) {
                // replace the clicked squares with new cards, if available
                if (deck.length > 0) {
                  table[i] = {
                    species: deck.pop(),
                    hasBeenClicked: false,
                    hasCard: true
                  }
                  //new Image().src = table[i].species.varieties[0].imageUrl;
                } else {
                  table[i] = {
                    species: null,
                    hasBeenClicked: true,
                    hasCard: false
                  }
                }
              } 
            }

            // check if end of round
            if (turn >= prevState.level.maxTurns) {
              // end of round
              message = `End of Round! You caught ${caught.length} pokemon.`;
              alert (message);
              this.state.gameOver(caught);
              //setTimeout(this.startGame, 100);
              ignoreClicks = true;
            } else {
              // not yet the end, so increament the turn counter
              turn = turn + 1;
              ignoreClicks = false;
            }

            return {
              table: table,
              deck: deck,
              turn: turn,
              ignoreClicks: ignoreClicks,
              message: message,
              showHint: false
            }
          });
        }, 1500);
      }

      return {
        deck: deck,
        table: table,
        caught: caught,
        escaped: escaped,
        matchValue: matchValue,
        message: message,
        bigWord: bigWord,
        ignoreClicks: (endOfTurn ? true : false)
      }
    });
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

    let rows = [];
    let columns = [];    
    this.state.table.forEach((square, i) => {

      let colorHint = (this.state.showHint && this.state.mode.colorHint) ? `radial-gradient(circle, white 10%, ${MatchingGame.colorMap[square.species.color]} 50%, white 60%` : "";
      let imageSrc = square.hasBeenClicked ? MatchingGame.pokeballImageSrc : square.species.varieties[0].imageUrl;

      columns.push(
        <td>
          <div className="d-flex align-items-start justify-items-center text-center" style={{position: "relative"}} onClick={(e) => this.handleTableClick(i)}>
            <img className="text-center border rounded " width={`${size}px`} alt={square.species.name} src={imageSrc} style={{backgroundImage: colorHint}}/>
            {this.state.showHint && this.state.mode.typeHint &&
              <div className="type-hint">
                {(square.species.varieties[0].types.length >= 1) && <img style={{width: `${Math.floor(size/5)}px`}} src={`/images/type/${square.species.varieties[0].types[0]}.svg`} alt={square.species.varieties[0].types[0]}/>}
                {(square.species.varieties[0].types.length === 2) && <img style={{width: `${Math.floor(size/5)}px`}} src={`/images/type/${square.species.varieties[0].types[1]}.svg`} alt={square.species.varieties[0].types[1]}/>}
              </div>
            }
            {this.state.showHint && this.state.mode.shapeHint &&
              <div className="shape-hint">
                <img style={{width: `${Math.floor(size/5)}px`}} src={`/images/shape/${square.species.shape}.png`} alt={square.species.shape}/>
              </div>
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

    let hintImages = [];
    for (let i = 0; (i < this.state.hintsRemaining) && (i < 5); i++) {
      hintImages[i] =
        <div className="p-2">
         <img height="40px" src="/images/berry/razz.png" alt="hint" onClick={(e) => this.handleShowHintClick()}/>
        </div>;
    }

    return (
      <div className="scrollable-full">
        <div className="d-flex w-100 font-weight-bold" style={{backgroundColor: "gold"}}>
            <div className="p-2">Turn {this.state.turn}/{this.state.level.maxTurns}</div>
            <div className="p-2">Caught {this.state.caught.length}</div> 
            <div className="p-2">Escaped {this.state.escaped.length}</div>
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

export default WhoIsThatPokemon;
