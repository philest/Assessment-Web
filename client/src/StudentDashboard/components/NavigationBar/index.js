import PropTypes from 'prop-types';
import React from 'react';
import RectangleButton from '../RectangleButton'
import BookInfoHeader from '../BookInfoHeader'
import css from './styles.css'


export default class NavigationBar extends React.Component {
  static propTypes = {
    studentName: PropTypes.string,
    onPauseClicked: PropTypes.func,
    onExitClicked: PropTypes.func,

    // cover related stuff
    isCoverPage: PropTypes.bool,
    showPauseButton: PropTypes.bool,
    showBookInfo: PropTypes.bool,
    bookTitle: PropTypes.string,
    bookAuthor: PropTypes.string,
    inComp: PropTypes.bool,
    onReport: PropTypes.bool,
  };
  static defaultProps = {
    showPauseButton: true,
    isCoverPage: false,
    showBookInfo: false,
    onReport: false,
  }

  /**
   * @param props - Comes from your rails view.
   * @param _railsContext - Comes from React on Rails
   */
  constructor(props, _railsContext) {
    super(props);


    // How to set initial state in ES6 class syntax
    // https://facebook.github.io/react/docs/reusable-components.html#es6-classes
    this.state = { name: this.props.name };
  }


  render() {

    let onRightIconClick 
    let rightIconLabel
    let rightIconButton

    if (this.props.onReport) {
      onRightIconClick = this.props.onReplayClicked
      rightIconButton = 'fa fa-repeat'
      rightIconLabel = "Retry demo"
    } else {
      onRightIconClick = this.props.onExitClicked
      rightIconButton = 'fa fa-sign-out'
      rightIconLabel = "Exit"

    }

    let navClass = null 

    if (this.props.onReport) { 
      navClass = css.reportNav
    }

    return (
      <div className={[navClass, css.navContainer].join(' ')}>
        <div className={css.subContainer}>
          <span className={css.brandText} onClick={this.props.onExitClicked}>ReadUp</span>
        </div>

        { this.props.showPauseButton &&

          <div className={css.subContainer}>
            <div className={[css.centerDisplayContainer, css.headerTabRed].join(' ')}>
              <RectangleButton
                title={'Stop'}
                subtitle={'recording'}
                style={{ marginTop: 20 }}
                id="navigation-button"
                onClick={this.props.onPauseClicked}
              />
              <div className={css.pulsatingCircle}> </div>
            </div>
          </div>

        }

        { ((this.props.isCoverPage || this.props.showBookInfo) && !this.props.inComp) &&

          <div className={css.subContainer}>
            <div className={[css.centerDisplayContainer, css.headerTabBlue].join(' ')}>
              <BookInfoHeader
                title={this.props.bookTitle}
                subtitle={('by ' + this.props.bookAuthor)}
                style={{ marginTop: 20 }}
              />
            </div>
          </div>

        }




        <div className={css.subContainer}>
          <div className={css.rightDisplayContainer}>
            <span className={css.userNameLabel}>{this.props.studentName}</span>
            <span className={css.logoutButton} onClick={onRightIconClick}>
              <a className={css.logoutLabel} >
                {rightIconLabel}
              </a>
              <i className={[css.logoutIcon, rightIconButton].join(' ')} />
            </span>
          </div>
        </div>
      </div>
    );
  }
}
