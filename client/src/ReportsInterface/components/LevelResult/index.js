import PropTypes from 'prop-types';
import React from 'react';
import css from './styles.css'
import styles from '../../styles.css'


import { Panel } from 'react-bootstrap'
import { bootstrapUtils } from 'react-bootstrap/lib/utils';

bootstrapUtils.addStyle(Panel, 'myDanger');
bootstrapUtils.addStyle(Panel, 'myWarning');
bootstrapUtils.addStyle(Panel, 'mySuccess');





export default class LevelResult extends React.Component {
  static propTypes = {
    difficulty: PropTypes.string.isRequired,
    currentLevel: PropTypes.string,
    levelFound: PropTypes.bool,
    reassess: PropTypes.bool,
    didEndEarly: PropTypes.bool,
    yellowColorOverride: PropTypes.bool,
  };

  static defaultProps = {
    levelFound: false,
    reassess: false,
    yellowColorOverride: false
  }



  /**
   * @param props - Comes from your rails view.
   * @param _railsContext - Comes from React on Rails
   */
  constructor(props, _railsContext) {
    super(props);

    // How to set initial state in ES6 class syntax
    // https://facebook.github.io/react/docs/reusable-components.html#es6-classes

  }

  getDelta(difficulty) {
    if (this.props.reassess || this.props.didEndEarly) {
      return 0
    } else if (difficulty == 'Frustrational') {
      return -1
    } else {
      return 1
    }
  }

  getNextLevelString(delta) {
    return String.fromCharCode(this.props.currentLevel.charCodeAt(0) + delta)
  }


  getClass() {
   
    if (this.props.reassess === true || this.props.didEndEarly || this.props.yellowColorOverride) {
      return "myWarning"
    } else if (this.props.difficulty == 'Frustrational') {
      return "myDanger"
    } else  {
      return "mySuccess"
    }

  }

  render() {




    let label
    let nextStepMsg

    if (this.props.didEndEarly) {
      label = "Did not finish reading"
      nextStepMsg = "Next Step: Reassess at Level " + this.getNextLevelString(this.getDelta(this.props.difficulty))
    } else {
      label = this.props.difficulty + " at Level " + this.props.currentLevel
      nextStepMsg = "Next Step: Assess at Level " + this.getNextLevelString(this.getDelta(this.props.difficulty))
    }

    const title = (
      <h2>{label}</h2>
    );





    return (

      <div> 
        <style type="text/css">{`
        .panel-myDanger, .panel-myWarning, .panel-mySuccess  {
          margin-top: 14px;
          margin-left: 0px;
        }

        .panel-myDanger h2, .panel-myWarning h2, .panel-mySuccess h2 {
          font-size: 1.6em;
          font-weight: bold;
        }

        .panel-myDanger div.panel-heading, .panel-myWarning div.panel-heading, .panel-mySuccess div.panel-heading {
          padding: 15px 15px 15px 14px;
        }

        .panel-myDanger .panel-body, .panel-myWarning .panel-body, .panel-mySuccess .panel-body {
          padding: 8px 15px 8px 17px;
          font-style: italic;

        }



        .panel-myDanger div.panel-heading {

          color: #a94442;
          background-color: #f2dede;
          border-color: #ebccd1;
        }

        .panel-myDanger {

          border-color: #ebccd1;
        }


        .panel-myWarning div.panel-heading {

          color: #8a6d3b;
          background-color: #fcf8e3;
          border-color: #faebcc;
        }

        .panel-myWarning {

          border-color: #faebcc;
        }


        .panel-mySuccess div.panel-heading {

          color: #3c763d;
          background-color: #dff0d8;
          border-color: #d6e9c6;
        }

        .panel-mySuccess {

          border-color: #d6e9c6;
        }

        `}</style>
        <Panel header={title} bsStyle={this.getClass()}>
          {nextStepMsg}
        </Panel>

      </div>






    );
  }
}
