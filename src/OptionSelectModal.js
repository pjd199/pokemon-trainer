import React, {Component} from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

class OptionSelectModal extends Component {

  render() {
    return (
      <Modal
        {...this.props}
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
        </Modal.Body>
        <Modal.Footer>
          {this.props.options.map((item, index) => (
            <Button key={item} onClick={() => this.props.onOptionSelect(item)}>{item}</Button>
          ))}
        </Modal.Footer>
      </Modal>
    );
  }
}

export default OptionSelectModal;