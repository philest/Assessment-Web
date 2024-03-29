import PropTypes from "prop-types";
import React from "react";

import styles from "./styles.css";
import commonStyles from "../commonstyles.css";

import { Modal } from "react-bootstrap";

import ModalHeader from "../subcomponents/ModalHeader";
import RectangleButton from "StudentDashboard/components/RectangleButton";

import classNames from "classnames/bind";

let cx = classNames.bind(styles);

let commonCX = classNames.bind(commonStyles);

export default class BaseModal extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    show: PropTypes.bool,
    animation: PropTypes.bool,
    modalType: PropTypes.string,
    onEntering: PropTypes.func,
    volumeIcon: PropTypes.bool,
    onHearIntroAgainClicked: PropTypes.func,
    subtitle: PropTypes.string
  };

  static defaultProps = {
    show: true,
    animation: true,
    onEntering: null,
    volumeIcon: false,
    subtitle: null
  };

  /**
   * @param props - Comes from your rails view.
   * @param _railsContext - Comes from React on Rails
   */
  constructor(props, _railsContext) {
    super(props);
    this.state = {};
  }

  render() {
    let modalClass = cx({
      successModal: this.props.modalType === "success",
      baseModal: true
    });

    let modalContainerClass = commonCX({
      successModalContainer: this.props.modalType === "success",
      modalContainer: true
    });

    let modalHeaderWrapperClass = commonCX({
      successModalHeaderWrapper: this.props.modalType === "success",
      modalHeaderWrapper: true,
      modalHeaderWrapperLarge: this.props.subtitle
    });

    let modalHeaderClass = commonCX({
      successModalHeader: this.props.modalType === "success"
    });

    return (
      <Modal
        className={modalClass}
        show={this.props.show}
        onHide={this.close}
        animation={this.props.animation}
        onEntering={this.props.onEntering}
      >
        <div className={modalContainerClass}>
          <div className={modalHeaderWrapperClass}>
            <ModalHeader
              title={this.props.title}
              subtitle={this.props.subtitle}
              className={modalHeaderClass}
              modalType={this.props.modalType}
              volumeIcon={this.props.volumeIcon}
              onHearIntroAgainClicked={this.props.onHearIntroAgainClicked}
            />
          </div>

          {this.props.children}
        </div>
      </Modal>
    );
  }
}
