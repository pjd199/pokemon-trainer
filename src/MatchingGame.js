import React, {Component} from "react";
import cloneDeep from "lodash.clonedeep";
import shuffleArray from "lodash.shuffle";
import autoBindReact from 'auto-bind';

class MatchingGame extends Component {

  static levelConfig = {
    easy: {
      maxTurns: 15,
      hintsAvailable: 999,
      showHowManyToCatch: false  ,
      maxOnScreen: 12,
      maxCanCatch: 2,
      timedMode: false
    },
    medium: {
      maxTurns: 20,
      hintsAvailable: 5,
      showHowManyToCatch: true,
      maxOnScreen: 16,
      maxCanCatch: 999,
      timedMode: false
    },
    hard: {
      maxTurns: 20,
      hintsAvailable: 3,
      showHowManyToCatch: false,
      maxOnScreen: 24,
      maxCanCatch: 999,
      timedMode: false
    },
    timed: {
      maxTurns: 9999,
      hintsAvailable: 3,
      showHowManyToCatch: false,
      maxOnScreen: 24,
      maxCanCatch: 999,
      timedMode: true,
      timeInitial: 30000,
      timeBonusRegular: 1000,
      timeBonusLegendary: 10000
    }
  };

  static gameMode = {
    color: {
      displayName: "colour",
      getMatchValue: (species) => species.color,
      isMatching: (species, matchValue) => (species.color === matchValue),
      valueToString: (value) => value,
      speciesToString: (species) => species.color,
      colorHint: true,
      typeHint: false,
      shapeHint: false,
      nameHint: false,
      pairs: false
    },
    type: {
      displayName: "type",
      getMatchValue: (species) => [...species.varieties[0].types],
      isMatching: (species, matchValue) => (matchValue !== null && (species.varieties[0].types.includes(matchValue[0]) || ((matchValue.length === 2) && species.varieties[0].types.includes(matchValue[1])))), 
      valueToString: (value) => value !== null ? value.join(' or ') : undefined,
      speciesToString: (species) => species.varieties[0].types.join('/'),
      colorHint: false,
      typeHint: true,
      shapeHint: false,
      nameHint: false,
      pairs: false
    },
    shape: {
      displayName: "shape",
      getMatchValue: (species) => species.shape,
      isMatching: (species, matchValue) => (species.shape === matchValue),
      valueToString: (value) => value,
      speciesToString: (species) => species.shape,
      colorHint: false,
      typeHint: false,
      shapeHint: true,
      nameHint: false,
      pairs: false
    },
    name: {
      displayName: "name",
      getMatchValue: (species) => species.displayName,
      isMatching: (species, matchValue) => (species.displayName === matchValue),
      valueToString: (value) => value,
      speciesToString: (species) => species.displayName,
      colorHint: false,
      typeHint: false,
      shapeHint: false,
      nameHint: true,
      pairs: true
    }
  }

  static colorMap = require("./colorMap.json");

  static pokeballImageSrc = "/images/pokeball/pokeball.png";

  /**
   * Initialise the compoment
   * @constructor
   * @param {Object} props - The properties passed to the object via a HTML tag
   */
  constructor(props) {
    super(props);
    autoBindReact(this);

    // initiailize the default state
    this.state = {
        deck: [],
        table: [],
        caught: [],
        escaped: [],
        turn: 1,
        message: "",
        hintsRemaining: 1,
        mode: MatchingGame.gameMode[props.mode.toLowerCase()],
        showHint: false,
        level: MatchingGame.levelConfig[props.level.toLowerCase()],
        pokedex: props.pokedexes[props.region.toLowerCase()],
        bigWord: null,
        ignoreClicks: true,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        gameOver: props.gameOver
    };

    let preloadedImage = new Image();
    preloadedImage.src = MatchingGame.pokeballImageSrc;

  }

  /**
   * Called by React when the component is mounted
   */
  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.startGame();
  }

  /**
   * Called by React when the component is unmounted
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * Start a new game
   */
  startGame() {
    // setup the board
    let deck = shuffleArray(this.state.pokedex.species);
    let table = [];

    // remove card(s) from the deck and add to the table
    for (let i = 0; i < this.state.level.maxOnScreen; i++) {
        table[i] = {
          species: deck.pop(),
          hasCard: true,
          hasBeenClicked: false,
          firstOnTable: true
        };
        if (this.state.mode.pairs && (i < (this.state.level.maxOnScreen - 1))) {
          table[i + 1] = cloneDeep(table[i]);
          table[i + 1].firstOnTable = false;
          i = i + 1;
        }
    }

    // shuffle the pairs if needed
    if (this.state.mode.pairs) {
      table = shuffleArray(table);
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

  /**
   * Callback for when the window is resized
   */
  handleResize() {
    this.setState({
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth
    });
  }

  /**
   * Handles the user clicking on the show hint button
   */
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
      let bigWord = null;
      let endOfTurn = false;
      
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
          if (prevState.mode.pairs) {
            message = `Can you find a matching pair?`
          } else if (prevState.level.showHowManyToCatch) {
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
        message = "Well done! Can you find any other matches?";
        if (totalPossibleMatches >= 6) {
          bigWord = "Excellent!";
        } else if (totalPossibleMatches >= 4) {
          bigWord = "Great!";
        } else {
          bigWord = "Nice!";
        }
        
        for (let i in table) {
          if (table[i].hasBeenClicked && table[i].firstOnTable) {
            caught = [...caught, table[i].species];
          }
        }
        endOfTurn = true;

      } else {
        // there are more to catch
        if (prevState.level.showHowManyToCatch) {
          message = `Can you find ${(totalPossibleMatches - totalClicked)} more ${prevState.mode.valueToString(matchValue)} pokemon?`
        } else {
          message = `Can you find another ${prevState.mode.valueToString(matchValue)} pokemon?`;
        }
        endOfTurn = false;
      }

      return {
        deck: deck,
        table: table,
        caught: caught,
        escaped: escaped,
        matchValue: matchValue,
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

        let endTable = cloneDeep(endOfTurnState.table);
        let endDeck = [...endOfTurnState.deck];
        let endMessage = "";
        let endTurn = endOfTurnState.turn;
        let endIgnoreClicks = endOfTurnState.ignoreClicks;
        
        for (let i = 0; i < endTable.length; i++) {
          if (endTable[i].hasBeenClicked && endTable[i].hasCard) {
            let pairValue = endOfTurnState.mode.getMatchValue(endTable[i].species);
            let pairedIndex = endTable.findIndex((entry, x) => ((x !== i) && endOfTurnState.mode.isMatching(entry.species, pairValue)));
            
            // replace the clicked squares with new cards, if available
            if (endDeck.length > 0) {
              endTable[i] = {
                species: endDeck.pop(),
                hasBeenClicked: false,
                hasCard: true,
                firstOnTable: true
              }
              //new Image().src = endTable[i].species.varieties[0].imageUrl;
            } else {
              endTable[i] = {
                species: null,
                hasBeenClicked: true,
                hasCard: false,
                firstOnTable: true
              }
            }

            // replace the pair too
            if (endOfTurnState.mode.pairs && (pairedIndex > -1)) {
              endTable[pairedIndex] = cloneDeep(endTable[i]);
              endTable[pairedIndex].firstOnTable = false;
            }
          } 
        }

        if (endOfTurnState.mode.pairs) {
          endTable = shuffleArray(endTable);
        }

        // check if end of round
        if (endTurn >= endOfTurnState.level.maxTurns) {
          // end of round
          endMessage = `End of Round! You caught ${endOfTurnState.caught.length} pokemon.`;
          alert (endMessage);
          endOfTurnState.gameOver([...endOfTurnState.caught, ...endOfTurnState.escaped, ...endOfTurnState.table.map(x => x.species)], endOfTurnState.caught);
          endIgnoreClicks = true;
        } else {
          // not yet the end, so increament the turn counter
          endTurn = endTurn + 1;
          endIgnoreClicks = false;
        }

        return {
          table: endTable,
          deck: endDeck,
          turn: endTurn,
          message: endMessage,
          ignoreClicks: endIgnoreClicks,
          showHint: false,
          endOfTurn: false
        }
      });
    }, 1500);
  }


  /**
   * Render the Pokedex into HTML.
   * @returns The HTML rendering of the App.
   */
  render() {
    // find best combination of rows, columns and image size
    //let numberOfRows = 0;
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
          //numberOfRows = calcRows;
          numberOfCols = calcCols;
          size = calcSize;
        }
      }
    }
    size = Math.floor(size);


    // assemble the HTML into columns and rows
    let rows = [];
    let columns = [];    
    this.state.table.forEach((square, i) => {

      let colorHintBackground = (this.state.showHint && this.state.mode.colorHint) ? `radial-gradient(circle, white 10%, ${MatchingGame.colorMap[square.species.color]} 50%, white 60%` : "";
      let imageSrc = square.hasBeenClicked ? MatchingGame.pokeballImageSrc : square.species.varieties[0].imageUrl;
      let blankSrc = square.hasBeenClicked ? MatchingGame.pokeballImageSrc : "/images/blank.png";
      let nameHintImage = (this.state.showHint && this.state.mode.nameHint) ? <img className="text-center pair-name-overlay" width={`${size}px`} alt={square.species.name} src={square.species.varieties[0].imageUrl} style={{filter: "brightness(0)"}}/> : <></>;


      alert(`${this.state.showHint}, ${this.state.mode.shapeHint}, ${Math.floor(size/5)}px, /images/shape/${square.species.shape}.png, square.species.shape`)
      {(this.state.showHint && this.state.mode.shapeHint) &&
        <div className="shape-hint">
          <img style={{width: `${Math.floor(size/5)}px`}} src={`/images/shape/${square.species.shape}.png`} alt={square.species.shape}/>
          X
        </div>


      columns.push(
        <td key={`col-${i}`}>
          <div className="text-center position-relative" onClick={(e) => this.handleTableClick(i)}>
            {/* Display the standard image, with optional colourHintBackground */}
            {(square.hasCard && square.firstOnTable) && 
              <img className="text-center border rounded" width={`${size}px`} alt={square.species.name} src={imageSrc} style={{backgroundImage: colorHintBackground}}/>
            }
            {/* Display the paired image */}
            {(square.hasCard && !square.firstOnTable) && 
              <div>
                <img className="text-center border rounded" width={`${size}px`} alt={square.species.name} src={blankSrc} style={{backgroundImage: "radial-gradient(circle, white 10%, orangered 50%, white 60%"}}/>
                {nameHintImage}
                <p className="pair-name-overlay rounded p-2" style={{opacity: "0.80", backgroundColor: "white"}}>{square.species.displayName}</p>
              </div>
            }
            {/* Add the type marker */}
            {(this.state.showHint && this.state.mode.typeHint) &&
              <div className="type-hint">
                {(square.species.varieties[0].types.length >= 1) && <img style={{width: `${Math.floor(size/5)}px`}} src={`/images/type/${square.species.varieties[0].types[0]}.svg`} alt={square.species.varieties[0].types[0]}/>}
                {(square.species.varieties[0].types.length === 2) && <img style={{width: `${Math.floor(size/5)}px`}} src={`/images/type/${square.species.varieties[0].types[1]}.svg`} alt={square.species.varieties[0].types[1]}/>}
              </div>
            }
            {/* Add the shape hint */}
            {(this.state.showHint && this.state.mode.shapeHint) &&
              <div className="shape-hint">
                <img style={{width: `${Math.floor(size/5)}px`}} src={`/images/shape/${square.species.shape}.png`} alt={square.species.shape}/>
                X
              </div>
            }
          </div>
        </td>
      );


      if (((i+1) % numberOfCols) === 0) {
        let rowNumber = rows.length;
        rows.push(
          <tr key={`row-${rowNumber}`}>
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
        <div key={i} className="p-2">
         <img height="40px" src="/images/berry/razz.png" alt="hint" onClick={(e) => this.handleShowHintClick()}/>
        </div>;
    }

    // put everything together, with a status bar at the top
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
              <tbody>
                {rows}
              </tbody>
            </table>
          </div>
          {(this.state.bigWord !== null) &&     
            <div className="centered-overlay">
              {this.state.bigWord.split("").map((letter, i) => (
                  <span key={i} className="big-text big-text-letter">{letter}</span>
              ))}
            </div>
          }          
        </div>
      </div>
    );
  }
}

export default MatchingGame;
