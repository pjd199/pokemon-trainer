import React, {Component} from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import autoBindReact from "auto-bind";

class OptionSelectModal extends Component {

  static initialState = {
    selectedOption: -1,
    showConfirmation: false
  } 

  constructor(props) {
    super(props);
    autoBindReact(this);

    this.state = OptionSelectModal.initialState;
  }

  optionClicked(item, index) {
    let stateUpdate = {};
    stateUpdate.selectedOption = index;
    stateUpdate.showConfirmation = this.props.requireConfirmation; 
    this.setState(stateUpdate);

    if (!this.props.requireConfirmation) {
      this.props.onOptionSelect(item);
      this.props.onHide();
    }
  }

  okClicked() {
    this.setState(OptionSelectModal.initialState);
    this.props.onOptionSelect(this.props.options[this.state.selectedOption]);
  }

  cancelClicked() {
    this.setState(OptionSelectModal.initialState);
    this.props.onHide();
  }

  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        aria-labelledby="contained-modal-title-vcenter"
        centered
        animation="true"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
              {this.props.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {this.props.message}
          </p>
          {this.props.options.map((item, index) => (
            <Button
              key={item} 
              className="m-1" 
              variant={(this.state.selectedOption === index) ? "primary" : "outline-primary"} 
              onClick={() => this.optionClicked(item, index)}>{item}</Button>
          ))}
        </Modal.Body>
        {this.state.showConfirmation &&
          <Modal.Footer>
            {this.props.confirmationMessage}
            <Button onClick={() => this.okClicked()}>Ok</Button>
            <Button onClick={() => this.cancelClicked()}>Cancel</Button>
          </Modal.Footer>
        }
      </Modal>
    );
  }
}

export default OptionSelectModal;