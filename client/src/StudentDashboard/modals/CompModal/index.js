import PropTypes from 'prop-types';
import React from 'react';

import RectangleButton from '../../components/RectangleButton'

import styles from '../DoneModal/styles.css'
import myStyles from './styles.css'

import ButtonArray from '../subcomponents/ButtonArray'

import BaseModal from '../BaseModal'

import commonStyles from '../commonstyles.css'
import ModalHeader from '../subcomponents/ModalHeader'


import {
  ReaderStateOptions,
} from '../../types'

import { Modal, Panel } from 'react-bootstrap'



const THIS_MODAL_ID = 'modal-comp'

export default class CompModal extends React.Component {
  static propTypes = {
    onSeeBookClicked: PropTypes.func,
    onTurnInClicked: PropTypes.func,

    currentShowModal: PropTypes.string,
    onStartClicked: PropTypes.func,
    onStopClicked: PropTypes.func,
  };

  /**
   * @param props - Comes from your rails view.
   * @param _railsContext - Comes from React on Rails
   */
  constructor(props, _railsContext) {
    super(props);
    this.state = {  };
  }

  render() {
    return (

        <Modal show={(this.props.currentShowModal === THIS_MODAL_ID)} className={myStyles.compModal}>
          <Modal.Header className={myStyles.compModalHeader}>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body className={myStyles.compModalBody}>
          { this.props.readerState !== ReaderStateOptions.inProgress &&

            <RectangleButton
              title="Start"
              subtitle="read and record"
              style={{ width: 200, height: 70, backgroundColor: '#5cb85c', borderColor: '#4cae4c' }}
              className={myStyles.compRecordButton}
              pulsatingArrow={true}
              disabled={this.props.disabled}
              onClick={this.props.onStartClicked}
            />

          }

          { this.props.readerState === ReaderStateOptions.inProgress &&
            <RectangleButton
              title='Stop'
              subtitle='recording'
              style={{ width: 200, height: 70, backgroundColor: '#982E2B' }}
              pulsatingArrow={true}
              disabled={this.props.disabled}
              onClick={this.props.onStopClicked}
            />
          }

          </Modal.Body>
        </Modal>


    );
  }
}