import PropTypes from 'prop-types';
import React from 'react';
import styles from './styles.css'

import { Button, ButtonGroup, Alert, OverlayTrigger, Popover, Modal, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'

import FormattedMarkupText from '../sharedComponents/FormattedMarkupText'
import { newFireflyEvaluationText } from '../sharedComponents/fireflyMarkup'
import { updateScoredText, markScored, markUnscorable, updateFluencyScore, getFluencyScore} from '../ReportsInterface/emailHelpers'

import InfoBar from '../ReportsInterface/components/InfoBar'
import questionCSS from '../ReportsInterface/components/Metric/styles.css'
import reportStyles from '../ReportsInterface/styles.css'
import {getUserCount, getAssessmentSavedTimestamp} from '../ReportsInterface/emailHelpers.js'
import { playSoundAsync } from '../StudentDashboard/audioPlayer'


const popoverBottom = (
  <Popover id="popover-positioned-bottom" className={questionCSS.myPopover} title="Fluency Rubric, by Fountas & Pinnell">
 
    <strong>0 - Unsatisfactory fluency</strong>
    <ul>
    <li>Primarily word-by-word</li>
    <li>No expressive interpretation</li>
    <li>No appropriate stress or pausing</li>
    </ul>

     <strong>1 - Limited fluency</strong>
     <ul>
      <li>Primarily two-word phrases</li>
      <li>Almost no expressive interpretation</li>
      <li>Almost no appropriate pausing or stress</li>
     </ul>

     <strong>2 - Satisfactory fluency</strong>
     <ul>
    <li>Primarily three- or four-word phrases</li>
    <li>Some smooth, expressive interpretation </li>
    <li>Mostly appropriate stress and pausing</li>
     </ul>

    <strong>3 - Excellent fluency</strong>
    <ul>
    <li>Primarily larger, meaningful phrases</li>
    <li>Mostly smooth, expressive interpretation</li>
    <li>Pausing and stress guided by meaning</li>
    </ul>

  </Popover>
);



export default class TranscriberInterface extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired, // this is passed from the Rails view
  };


  constructor(props, _railsContext) {
    super(props);
    this.state = { 
      evaluationTextData: JSON.parse(this.props.scoredText),
      highlightedParagraphIndex: null,
      highlightedWordIndex: null,
      highlightedIsSpace: null,
      showSubmitAlert: false,
      showSaveAlert: false,
      fluencyScore: null,
      hasSavedRecently: false,
      hasSeenAlert: this.props.seenUpdatePrior,
      showReadyForReviewModal: false,
      showWakeModal: false,
      lastSaved: this.props.whenFirstSaved,
      prevLastSaved: this.props.whenFirstSaved,
      userCountCurrent: this.props.userCountPrior,
    }
        this.tick = this.tick.bind(this);


  }

  componentWillMount() {
    document.addEventListener("keydown", this._handleKeyDown);

    // TODO refactor this into a controller prop 
    getFluencyScore(this.props.assessmentID).then(res => {
    this.setState({ fluencyScore: res })
    })

  }


  componentDidMount() {
    this.interval = setInterval(this.tick, 3000);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this._handleKeyDown);
    clearInterval(this.interval);

  }


  tick() {



      const isUpdated = this.assessmentSavedThisSession(this.props.assessmentID)
      const hasSavedRecently = this.state.hasSavedRecently
      const hasSeenAlert = this.state.hasSeenAlert

      console.log(`hasSavedRecently is ${hasSavedRecently}`)

      if (isUpdated && !hasSavedRecently && !hasSeenAlert) {
        playSoundAsync('/audio/complete.mp3')
        this.setState({ showReadyForReviewModal: true,
                        hasSeenAlert: true,
                      })
      }


      getUserCount().then(res => {
       this.setState({ userCountCurrent:  res })
      })

      if ((this.state.userCountCurrent != this.props.userCountPrior) && !this.state.showWakeModal) {
        console.log("time to show the wake modal...")
        playSoundAsync('/audio/complete.mp3')
        this.setState({ showWakeModal: true})
      } else {
          console.log("don't trigger wake modal...")
      }


  }


  assessmentSavedThisSession(id) {

    let res = getAssessmentSavedTimestamp(id)
    res.then(res => {
      this.setState({ lastSaved: res })
    })


    let prevLastSaved = this.state.prevLastSaved
    let lastSaved = this.state.lastSaved

    console.log(`prevLastSaved is ${prevLastSaved}`)
    console.log(`lastSaved is ${lastSaved}`)


    if (prevLastSaved !== lastSaved) { // their timestamps are different
    console.log(`so an update!!!`)
      this.setState({ prevLastSaved: lastSaved })
      return true
    } else {
    console.log(`so nothing,,,`)

      return false
    }
  }



  _handleKeyDown = (event) => {

    // audio playback keys
    if (event.code === 'Space') {
      if (this.refs.audioPlayer.paused) {
        this.refs.audioPlayer.play()
      }
      else {
        this.refs.audioPlayer.pause()
      }
      
      event.preventDefault();
    }
    else if (event.code === 'ArrowLeft') {
      if (this.refs.audioPlayer.currentTime < 2) {
        this.refs.audioPlayer.currentTime = 0;
      }
      else {
        this.refs.audioPlayer.currentTime -= 2;
      }
    }
    else if (event.code === 'ArrowRight') {
      if (this.refs.audioPlayer.currentTime > this.refs.audioPlayer.duration - 2) {
        this.refs.audioPlayer.currentTime = this.refs.audioPlayer.duration
      }
      else {
        this.refs.audioPlayer.currentTime += 2;
      }
    }

    // grading keys
    // first ensure we have selected indices
    if (this.state.highlightedParagraphIndex == null || this.state.highlightedWordIndex == null) {
      return
    }

    var evaluationTextData = this.state.evaluationTextData


    if (event.code === 'KeyA') {

      const addText = window.prompt('Enter the added word')

      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].addAfterWord = addText


      this.setState({evaluationTextData: evaluationTextData})
    }
    else if (event.code === 'KeyS' && !this.state.highlightedIsSpace) {

      const subText = window.prompt('Enter the substituted word')

      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].substituteWord = subText
      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].wordDeleted = (subText != '')

      this.setState({evaluationTextData: evaluationTextData})
    }
    else if (event.code === 'KeyD' && !this.state.highlightedIsSpace) {
      // toggle
      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].wordDeleted = !evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].wordDeleted

      // kill any substitutions
      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].substituteWord = null

      
      this.setState({evaluationTextData: evaluationTextData})
    }
    else if (event.code === 'KeyD' && this.state.highlightedIsSpace) {
      // kill additions 
      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].addAfterWord = null
    }


    else if (event.code === 'KeyE') {
      // toggle
      if (this.state.highlightedParagraphIndex == evaluationTextData.readingEndIndex.paragraphIndex && this.state.highlightedWordIndex == evaluationTextData.readingEndIndex.wordIndex) {
        evaluationTextData.readingEndIndex.paragraphIndex = 9999
        evaluationTextData.readingEndIndex.wordIndex = 9999
      }
      else {
        evaluationTextData.readingEndIndex.paragraphIndex = this.state.highlightedParagraphIndex
        evaluationTextData.readingEndIndex.wordIndex = this.state.highlightedWordIndex
      }
      
     
     this.setState({evaluationTextData: evaluationTextData})
    }

    
  }


  _onMouseEnterWord = (paragraphIndex, wordIndex, isSpace) => {

    this.setState({
      highlightedParagraphIndex: paragraphIndex,
      highlightedWordIndex: wordIndex,
      highlightedIsSpace: isSpace,
    })

  }

  _onMouseLeaveWord = (paragraphIndex, wordIndex, isSpace) => {
    // TODO
    // is it possible for there to be a race condition where onMouseEnter of the target element is called before onMouseLeave of the previous element?
    // In that case, we'd accidentally null out the just selected here
    // Haven't observed that, but could eliminate below just to be safe
    this.setState({
      highlightedParagraphIndex: null,
      highlightedWordIndex: null,
      highlightedIsSpace: null,
    })
  }

  onFluencyScoreZeroClicked = () => {
    console.log('here i am 0')
    this.setState({fluencyScore: 0})
  }
  

  onFluencyScoreOneClicked = () => {
    console.log('here i am 1')
    this.setState({fluencyScore: 1})

  }

  onFluencyScoreTwoClicked = () => {
    console.log('here i am 2')
    this.setState({fluencyScore: 2})

  }

  onFluencyScoreThreeClicked = () => {
    console.log('here i am 3')
    this.setState({fluencyScore: 3})
  }




  onSubmitClicked = () => {
    updateScoredText(this.state.evaluationTextData, this.props.assessmentID);
    
    if (this.state.fluencyScore != null) {
    updateFluencyScore(this.state.fluencyScore, this.props.assessmentID)
    }
    
    markScored(this.props.assessmentID)
    this.setState({showSubmitAlert: true})

    this.setState({ hasSavedRecently: true })

    setTimeout(() => {
      this.setState({ hasSavedRecently: false });
    }, 7500);



  }


  onSaveClicked = () => {
    updateScoredText(this.state.evaluationTextData, this.props.assessmentID);
    updateFluencyScore(this.state.fluencyScore, this.props.assessmentID)
    this.setState({ hasSavedRecently: true,
                    showSaveAlert: true })

    setTimeout(() => {
      this.setState({ hasSavedRecently: false });
    }, 7500);


  }


  onUnscorableClicked = () => {
    markUnscorable(this.props.assessmentID);
    console.log("Done marking?")
    this.setState({showSubmitAlert: true})
  }


  handleAlertDismiss = () => {
    this.setState({showSubmitAlert: false,
                   showSaveAlert: false
                 })
  }

  render() {


    return (

      <div>
              <InfoBar
          title={ "Grading view"}
          extraInfo={"Your grading will be sent upon submit"}
          withScorer={false}
        />


      <div className={styles.transcriberContainer}>



        <div className={styles.gradingViewLabel}>Grading View</div>

        <div className={styles.nameHeading}>
          {this.props.name}'s Demo
        </div>
        <div className={styles.emailHeading}>
          {this.props.email}
        </div>
        <div className={styles.emailHeading}>
          {this.props.createdAt + " (Pacific)"}
        </div>



        <audio controls ref={"audioPlayer"} className={styles.audioElement}>
          <source src={this.props.recordingURL} />
          <p>Playback not supported</p>
        </audio>
        
        <audio controls ref={"secondAudioPlayer"} className={styles.audioElement}>
          <source src={this.props.compRecordingURL} />
          <p>Playback not supported</p>
        </audio>

        


        <div className={styles.markupContainer}>
          <div className={styles.bookInfo}>
            <span className={styles.bookTitleHeading}>
              {this.props.bookTitle}
            </span>
            <span className={styles.bookLevelHeading}>
              {"Level " + this.props.bookLevel}
            </span>
          </div>


          <FormattedMarkupText
            paragraphs={this.state.evaluationTextData.paragraphs}
            endParagraphIndex={this.state.evaluationTextData.readingEndIndex.paragraphIndex}
            endWordIndex={this.state.evaluationTextData.readingEndIndex.wordIndex}
            isInteractive
            onMouseEnterWord={this._onMouseEnterWord}
            onMouseLeaveWord={this._onMouseLeaveWord}
            bookLevel={this.props.bookLevel}
          />



        </div>

        <style type="text/css">{'.modal-backdrop.in { opacity: 0.7; } '}</style>
        <Modal show={this.state.showReadyForReviewModal} dialogClassName={reportStyles.modalSmall}>
          <Modal.Header>
            <Modal.Title bsClass={[reportStyles.pricingModalTitle, reportStyles.readyModalTitle].join(' ')}>
              Ready for review! 
            </Modal.Title>
          </Modal.Header>
          <Modal.Body bsClass={reportStyles.readyModalBody}>

            <div className={reportStyles.pricingFormWrapper}>
               <i className={["fa", "fa-check", reportStyles.readyCheck, reportStyles.pulse].join(" ")} aria-hidden={"true"} />
            </div>


              <a href={`/transcribe/${this.props.userID}/?seen_update_prior=true`}>
                <Button
                  className={[reportStyles.pricingFormButton, reportStyles.seeYourReportButton].join(' ')}
                  bsStyle={'success'}
                >
                  See report
                </Button>
              </a>

          </Modal.Body>
        </Modal>

      <style type="text/css">{'.modal-backdrop.in { opacity: 0.7; } '}</style>
        <Modal show={this.state.showWakeModal} dialogClassName={reportStyles.modalSmall}>
          <Modal.Header>
            <Modal.Title bsClass={[reportStyles.pricingModalTitle, reportStyles.readyModalTitle].join(' ')}>
              The demo user started :)  
            </Modal.Title>
          </Modal.Header>
          <Modal.Body bsClass={reportStyles.readyModalBody}>

            <div className={reportStyles.pricingFormWrapper}>
               <i className={["fa", "fa-flag", reportStyles.readyCheck, reportStyles.pulse, reportStyles.flag].join(" ")} aria-hidden={"true"} />
            </div>


              <a href={`/transcribe/latest`}>
                <Button
                  className={[reportStyles.pricingFormButton, reportStyles.seeYourReportButton].join(' ')}
                  bsStyle={'primary'}
                >
                  Set up grading
                </Button>
              </a>

          </Modal.Body>
        </Modal>



        <div className={styles.fluencyContainer}>
          <div className={styles.bookInfo}>
            <span className={styles.bookTitleHeading}>
              Fluency Score
            </span>
            <span className={styles.bookLevelHeading}>
              Assign a score using the rubric 
              <OverlayTrigger defaultOverlayShown={true} trigger={['click']}   placement="bottom" overlay={popoverBottom}>
                <i className={["fa", "fa-question-circle", styles.questionIcon].join(" ")} aria-hidden={"true"} />
              </OverlayTrigger>

            </span>
          </div>
        </div> 


        <ButtonGroup className={styles.fluencyButtonGroup}>
          <Button active={this.state.fluencyScore === 0} href="#" onClick={this.onFluencyScoreZeroClicked}><strong>0</strong> - Unsatisfactory</Button>
          <Button active={this.state.fluencyScore === 1} href="#" onClick={this.onFluencyScoreOneClicked}><strong>1</strong> - Limited</Button>
          <Button active={this.state.fluencyScore === 2} href="#" onClick={this.onFluencyScoreTwoClicked}><strong>2</strong> - Satifscatory</Button>
          <Button active={this.state.fluencyScore === 3} href="#" onClick={this.onFluencyScoreThreeClicked}><strong>3</strong> - Excellent</Button>
        </ButtonGroup>




        <h3>Comprehension</h3>

        <br/><br/>

        <FormGroup controlId="formControlsTextarea">
          <ControlLabel>Student Answer</ControlLabel>
          <FormControl componentClass="textarea" className={styles.myTextArea} placeholder="Student answer" />
        </FormGroup>


        <br/>

        <FormGroup controlId="formControlsTextarea">
          <ControlLabel>Your comments</ControlLabel>
          <FormControl componentClass="textarea" className={styles.myTextArea} placeholder="Your comments" />
        </FormGroup>


        <ButtonGroup className={styles.fluencyButtonGroup}>
          <Button active={this.state.fluencyScore === 1} href="#" onClick={this.onFluencyScoreOneClicked}><strong>1</strong> - Limited</Button>
          <Button active={this.state.fluencyScore === 2} href="#" onClick={this.onFluencyScoreTwoClicked}><strong>2</strong> - Satifscatory</Button>
          <Button active={this.state.fluencyScore === 3} href="#" onClick={this.onFluencyScoreThreeClicked}><strong>3</strong> - Excellent</Button>
        </ButtonGroup>





        <Button
          className={styles.submitButton}
          bsStyle={'primary'}
          bsSize={'large'}
          active={this.state.hasSavedRecently}
          onClick={this.onSaveClicked}
        >
          Save edits
        </Button>


        <Button
          className={styles.unscorableButton}
          bsStyle={'success'}
          bsSize={'xsmall'}
          onClick={this.onSubmitClicked}
        >
          Send to user
        </Button>

        <Button
          className={styles.unscorableButton}
          bsStyle={'danger'}
          bsSize={'xsmall'}
          onClick={this.onUnscorableClicked}
        >
          Mark as unscorable
        </Button>

       
       {this.state.showSubmitAlert &&
        <div className={styles.alertSuccess}>
          <Alert bsStyle="success" onDismiss={this.handleAlertDismiss}>
            <strong>Great!</strong> you can see the scored report <a target="_blank" href={`/reports/${this.props.userID}`}>here</a>.
          </Alert>
        </div>
      }

       {this.state.showSaveAlert &&
        <div className={styles.alertSuccess}>
          <Alert bsStyle="info" onDismiss={this.handleAlertDismiss}>
            <strong>Great!</strong> your partner was notified and sent all your edits.
          </Alert>
        </div>
      }

          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>

          <hr/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
  
          <embed src="https://s3-us-west-2.amazonaws.com/readup-now/website/Phonemes_Chart.pdf" width="600" height="575" display="inlineBlock" type='application/pdf'/>
          <iframe width="560" height="315" display="inlineBlock" src="https://www.youtube.com/embed/ulQC7LlpfE8?start=8" frameBorder="0" allowFullScreen></iframe>




      </div>
      </div>
    );
  }
}
