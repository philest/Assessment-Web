import PropTypes from 'prop-types';
import React from 'react';
import RectangleButton from '../RectangleButton'
import BookInfoHeader from '../BookInfoHeader'
import css from './styles.css'
import { Button, Popover, OverlayTrigger } from 'react-bootstrap'
import questionCSS from '../../../ReportsInterface/components/Metric/styles.css'



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
    onGrading: PropTypes.bool,
    onReader: PropTypes.bool,
    white: PropTypes.bool, 
    beforeStudentDemo: PropTypes.bool,
  };
  static defaultProps = {
    showPauseButton: true,
    isCoverPage: false,
    showBookInfo: false,
    onReport: false,
    onGrading: false,
    onReader: true,
    white: false,
    beforeStudentDemo: false, 
  }


  renderButton =() => {
      return (
      <Button
        className={[this.state.atBottom ? css.tryButton : css.tryButtonMuted].join(' ')}
        bsStyle={'default'}
        onClick={this.onAskQuestion}
      >
        <span className={css.tryButtonText}> Try student demo </span>
        <i className={["fa", "fa-chevron-right", css.pulsatingArrow, css.delay].join(" ")} style={{marginLeft: 7}} aria-hidden={"true"} />
      </Button>
    )
  }

  /**
   * @param props - Comes from your rails view.
   * @param _railsContext - Comes from React on Rails
   */
  constructor(props, _railsContext) {
    super(props);


    // How to set initial state in ES6 class syntax
    // https://facebook.github.io/react/docs/reusable-components.html#es6-classes
    this.state = { name: this.props.name,
                   atBottom: false
    };
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

    if (this.props.onReport || this.props.onGrading) { 
      navClass = css.reportNav
    }

    let barColorClass =  css.barNavy
    let textColorClass = css.textWhite

    if (this.props.white) {
      barColorClass = css.barWhite
      textColorClass = css.textNavy
    }


  const popoverClickRootClose = (
    <Popover className={questionCSS.sharePopover} id="popover-trigger-click-root-close" >
      <a href={window.location.href}><strong>{window.location.href}</strong></a>
      <br/>
      Copy and paste this link to share this screen with students, parents, and administrators.
    </Popover>
  );



    return (
      <div className={[navClass, css.navContainer, barColorClass].join(' ')}>
        <div className={css.subContainer}>
          <span className={[css.brandText, textColorClass].join(' ')} onClick={this.props.onExitClicked}>ReadUp</span>
        </div>

        { this.props.showPauseButton &&

          <div className={css.subContainer}>
            <div className={[css.centerDisplayContainer, css.headerTabRed].join(' ')}>
              <RectangleButton
                title={'Stop'}
                subtitle={'recording'}
                id="navigation-button"
                onClick={this.props.onPauseClicked}
              />
              <div className={css.pulsatingCircle}> </div>
            </div>
          </div>

        }

        { !this.props.showBookInfo && this.props.onReader && !this.props.showPauseButton && this.props.inComp &&
          <div className={css.notRecordingSubContainer}>
           <span className={css.notRecording}>Not recording</span>
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
          <div className={[css.rightDisplayContainer, textColorClass].join(' ')}>

          { this.props.beforeStudentDemo &&
            this.renderButton()
          }

          { this.props.onReport &&
            <OverlayTrigger  trigger="click" rootClose placement="bottom" overlay={popoverClickRootClose}>
              <span className={this.props.beforeStudentDemo ? css.lastNavElt : ''}>
                <span className={css.shareLabel}>Share report</span>
                <i className={[css.logoutIcon, 'fa fa-share', css.shareIcon].join(' ')} />
              </span>
            </OverlayTrigger>
          }

          { this.props.onGrading &&
            <span className={css.userNameLabel}>On grading view</span>
          }
          { !this.props.beforeStudentDemo &&
            <div className={css.rightMostAction}>
              <span className={css.userNameLabel}>{this.props.studentName}</span>
              <span className={css.logoutButton} onClick={onRightIconClick}>
                <a className={[css.logoutLabel, textColorClass].join(' ')} >
                  {rightIconLabel}
                </a>
                <i className={[css.logoutIcon, rightIconButton].join(' ')} />
              </span>
            </div>
          }

          </div>
        </div>
      </div>
    );
  }
}
