import React, {Component} from "react";
import TextInputModal from "./TextInputModal";
import OptionSelectModal from "./OptionSelectModal";
import Button from "react-bootstrap/Button";

/**
 * The settings tab
 */
 class Settings extends Component {

  /**
   * Constructor
   * @param {Object} props - The properties passed to the compenent 
   */
  constructor(props) {
    super(props);

    this.state = {
      showCreateUser: false,
      showRemoveUser: false,
      showChangeCurrentUser: false
    }
  }

  /**
   * Renders the HTML
   * @returns The rendered HTML
   */
  render() {
    return (
      <>
        <div className="scrollable-full full-height d-flex justify-content-center flex-column bg-image" style={{backgroundImage: "url(images/wallpaper.jpg)"}}>
          <div className="bg-opacity-75 bg-white text-center p-3 m-auto">
            <h1>Users</h1>
            {(this.props.userList.length === 0) &&
              <p>
                There are no users - please add a new user
              </p>
            }
            {(this.props.userList.length > 0) &&
              <p>
                Currently playing as {this.props.currentUser}
              </p>
            }
            <Button className="m-3" variant="primary" disabled={(this.props.userList.length === 0)} onClick={() => this.setState({showChangeCurrentUser: true})}>
              Change user
            </Button>
            <Button className="m-3" variant="primary" onClick={() => this.setState({showCreateUser: true})}>
              Add user
            </Button>
            <Button className="m-3" variant="primary" disabled={(this.props.userList.length === 0)} onClick={() => this.setState({showRemoveUser: true})}>
              Remove user
            </Button>
            <br/>
            <h1>Credits</h1>
            <p>
              Developed by Pete Dibdin and tested by Caleb Dibdin
            </p>
            <p>
              Coded in Javascript, HTML and CSS<br/>
              Frameworks: React, Bootstrap and React-Bootstrap<br/>
              Pokémon data and images provided by PokéAPI<br/>
              Pokémon is copyright The Pokémon Company, and the use of their copyrighted material here is for my personal, noncommercial home use only<br/>
            </p>
          </div>
        </div>

        <TextInputModal
          title="Create new user"
          message="Please enter the user's name below"
          show={this.state.showCreateUser}
          onHide={() => this.setState({showCreateUser: false})}
          onSubmit={(user) => {
            this.setState({showCreateUser: false});
            this.props.onAddUser(user);
          }}
        />

        <OptionSelectModal
          title="Change current user"
          message="Please select your user"
          options={this.props.userList}
          show={this.state.showChangeCurrentUser}
          onHide={() => this.setState({showChangeCurrentUser: false})}
          onOptionSelect={(user) => {
            this.setState({showChangeCurrentUser: false});
            this.props.onChangeCurrentUser(user);
          }}
        />
        
        <OptionSelectModal
          title="Remove User"
          message="Please choose a user to remove."
          options={this.props.userList}
          show={this.state.showRemoveUser}
          requireConfirmation="true"
          confirmationMessage="Are you sure you want to remove this user? You cannot undo this action!"
          onHide={() => this.setState({showRemoveUser: false})}
          onOptionSelect={(user) => {
            this.setState({showRemoveUser: false});
            this.props.onRemoveUser(user);
          }}
        />
      </>
    );
  }
 }

 export default Settings;