import React, {Component} from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

class TextInputModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      inputValue: ""
    };

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    this.setState({
      inputValue: event.target.value
    });
  }

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
          <Form>
            <Form.Group className="mb-3">
              <Form.Control type="text" value={this.state.inputValue} onChange={(e) => this.handleInputChange(e)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => this.props.onSubmit(this.state.inputValue)}>Ok</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default TextInputModal;