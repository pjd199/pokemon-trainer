import React, {Component} from "react";

class PokemonCard extends Component {

  constructor(props) {
    super(props);

    this.state = {
      colorMap: require("./colorMap.json")
    };

  } 

  render(props) {
    return (
      <div className="m-auto">
{/*style={{boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"}  this.props.species.color*/}
        <div className="w-100 d-flex flex-column">
          <div className="d-flex w-100 bg-light justify-content-between align-items-center">
            <h1 className="text-capitalize p-2">{this.props.variety.name}</h1>
            <div className="justify-item-end text-end p-1 m-1 text-capitalize">
              {this.props.variety.types.length >= 1 && <img style={{width: "50px"}} src={`/images/type/${this.props.variety.types[0]}.svg`} alt={this.props.variety.types[0]}/>}
              {this.props.variety.types.length === 2 && <img style={{width: "50px"}} src={`/images/type/${this.props.variety.types[1]}.svg`} alt={this.props.variety.types[1]}/>}
            </div>
          </div>
          <div className="text-center p-2">
            <img className="w-50" style={{backgroundImage: `radial-gradient(circle, white 10%, ${this.state.colorMap[this.props.species.color]} 50%, white 60%`}} src={this.props.variety.imageUrl} alt={this.props.variety.name}></img>
            <h2>{this.props.variety.genus}</h2>
            {this.props.variety.types.length === 1 && <p className="fst-italic text-capitalize">{this.props.variety.types[0]} type</p>}
            {this.props.variety.types.length === 2 && <p className="fst-italic text-capitalize">{this.props.variety.types[0]} and {this.props.variety.types[1]} type</p>}
            <p className="p-2">{this.props.species.description}</p>
          </div>  
        </div>
      </div>
    );
  }
}

export default PokemonCard;