import PropTypes from 'prop-types';
import React from 'react';
import axios from 'axios'

import styles from './styles.css'

import { Button, ButtonGroup, Alert, OverlayTrigger, Popover, Modal, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'

import FormattedMarkupText from '../sharedComponents/FormattedMarkupText'
import { newSampleEvaluationText, stepMarkup } from '../sharedComponents/stepMarkup'
import { updateStudent, updateAssessment, updateScoredText, markScored, markUnscorable, updateFluencyScore, getFluencyScore, getAssessmentData} from '../ReportsInterface/emailHelpers'

import NavigationBar from '../StudentDashboard/components/NavigationBar'
import InfoBar from '../ReportsInterface/components/InfoBar'
import questionCSS from '../ReportsInterface/components/Metric/styles.css'
import reportStyles from '../ReportsInterface/styles.css'
import {getUserCount, getAssessmentSavedTimestamp} from '../ReportsInterface/emailHelpers.js'
import { playSoundAsync } from '../StudentDashboard/audioPlayer'
import { fireflyBook, fpBook, library } from '../StudentDashboard/state.js'



import {
  PromptOptions,
} from '../StudentDashboard/types'


let book
let rubric
let numQuestions
let currAudioPlayer

const backupShowQArr = {
  0: false,
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
}


let initShowQArr = {
  0: false,
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
}

let trueInitShowQArr = {
  0: true,
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
  6: true,
}


     

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



export default class GraderInterface extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired, // this is passed from the Rails view
    studentID: PropTypes.number,
    bookKey: PropTypes.string,
    waiting: PropTypes.bool,
    isRemote: PropTypes.bool,
  };


  constructor(props, _railsContext) {
    super(props);
    this.state = {

      evaluationTextData: (this.props.bookKey === 'step' && !this.props.scoredText) ? stepMarkup : JSON.parse(this.props.scoredText),
      highlightedParagraphIndex: null,
      highlightedWordIndex: null,
      highlightedIsSpace: null,
      showSubmitAlert: false,
      showSaveAlert: false,
      hasSavedRecently: false,
      hasSeenAlert: this.props.seenUpdatePrior,
      showReadyForReviewModal: false,
      showWakeModal: false,
      lastSaved: this.props.whenFirstSaved,
      prevLastSaved: this.props.whenFirstSaved,
      userCountCurrent: this.props.userCountPrior,
      compScores: this.props.compScoresPrior,
      fluencyScore: this.props.fluencyScorePrior,
      assessmentBrand: this.props.assessmentBrand,
      isLiveDemo: this.props.isLiveDemo,
      graderComments: this.props.graderCommentsPrior,
      showQArr: this.props.scored ? trueInitShowQArr : initShowQArr,
      showCompletedModal: false,
      hasSeenCompletedModal: this.props.completed,
      showPromptAlert: false,
      showChecklistModal: false,
    }
        this.tick = this.tick.bind(this);


  }

  componentWillMount() {
    document.addEventListener("keydown", this._handleKeyDown);

    if (this.props.bookKey) {
      book = library[this.props.bookKey]
    }
    else {
      book = fireflyBook
    }

    rubric = book.rubric
    numQuestions = book.numQuestions



    // But first, reset the state...
    console.log('resetting state: ', this.state.showQArr)
    console.log('backupShowQArr: ', backupShowQArr)
    this.setState({ showQArr: backupShowQArr })
    console.log('just reset state: ', this.state.showQArr)




    // check all of s3 fully once
    for(let q = 0; q <= numQuestions; q++) {
      if (!this.state.showQArr[String(q)] && !this.props.scored) {
        this.checkS3(q, true)
      }
    }



  }


  componentDidMount() {
    this.interval = setInterval(this.tick, 10000);
     currAudioPlayer = this.refs.audioPlayer0

  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this._handleKeyDown);
    clearInterval(this.interval)

  }


  closeReportReadyModal = () => {

    this.setState({ showReadyForReviewModal: false })
  }

  closeChecklistModal = () => {
    this.setState({ showChecklistModal: false })
  }

  showChecklistModal = () => {
    this.setState({ showChecklistModal: true })
  }

  closeCompletedModal = () => {

    this.setState({ showCompletedModal: false,
                  })
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




        this.setState({ showWakeModal: true })
      } else {
          console.log("don't trigger wake modal...")
      }


      let ass = getAssessmentData(this.props.assessmentID)

        ass.then( (assessment) => {
          console.log('assessment: ', assessment)

          if (assessment.completed && !this.state.showCompletedModal && !this.state.hasSeenCompletedModal) {
            console.log("time to show the completed modal...")
            playSoundAsync('/audio/complete.mp3')
            this.setState({ showCompletedModal: true, hasSeenCompletedModal: true})
        } else {
            console.log("don't trigger completed modal...")
        }

      }).catch(function(err) {
        console.log(err)
      })

      // if ( && !this.state.showWakeModal) {
      //   console.log("time to show the wake modal...")
      //   playSoundAsync('/audio/complete.mp3')
      //   this.setState({ showWakeModal: true})
      // } else {
      //     console.log("don't trigger wake modal...")
      // }




    // check status of each file 

    for(let q = 0; q <= numQuestions; q++) {
      if (!this.state.showQArr[String(q)] && !this.props.scored) {
        this.checkS3(q, false)
        break 
      }
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

      // TODO ASAP: BRING BACK PAUSING AND ARROW KEYING 

    if (event.code === 'Space' && event.ctrlKey) {


      if (currAudioPlayer.paused) {
        currAudioPlayer.play()
      }
      else {
        currAudioPlayer.pause()
      }
      
      event.preventDefault();



    }
    else if (event.code === 'ArrowLeft' && event.ctrlKey) {
      if (currAudioPlayer.currentTime < 2) {
        currAudioPlayer.currentTime = 0;
      }
      else {
        currAudioPlayer.currentTime -= 2;
      }
    }
    else if (event.code === 'ArrowRight' && event.ctrlKey) {
      if (currAudioPlayer.currentTime > currAudioPlayer.duration - 2) {
        currAudioPlayer.currentTime = currAudioPlayer.duration
      }
      else {
        currAudioPlayer.currentTime += 2;
      }

    }
    else if (event.code === 'Digit0' && event.ctrlKey) {
      currAudioPlayer = this.refs.audioPlayer0
    }    
    else if (event.code === 'Digit1' && event.ctrlKey) {
      currAudioPlayer = this.refs.audioPlayer1
    }
    else if (event.code === 'Digit2' && event.ctrlKey) {
      currAudioPlayer = this.refs.audioPlayer2
    }
    else if (event.code === 'Digit3' && event.ctrlKey) {
      currAudioPlayer = this.refs.audioPlayer3
    }
    else if (event.code === 'Digit4' && event.ctrlKey) {
      currAudioPlayer = this.refs.audioPlayer4
    }
    else if (event.code === 'Digit5' && event.ctrlKey) {
      currAudioPlayer = this.refs.audioPlayer5
    }
    else if (event.code === 'Digit6' && event.ctrlKey) {
      currAudioPlayer = this.refs.audioPlayer6
    }

    // grading keys
    // first ensure we have selected indices
    if (this.state.highlightedParagraphIndex == null || this.state.highlightedWordIndex == null) {
      return
    }

    var evaluationTextData = this.state.evaluationTextData


    // toggleMSV
    if (event.code === 'KeyM' && event.shiftKey) {
      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].mTypeError = !evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].mTypeError
    }
    if (event.code === 'KeyS' && event.shiftKey) {
      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].sTypeError = !evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].sTypeError
    }
    if (event.code === 'KeyV' && event.shiftKey) {
      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].vTypeError = !evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].vTypeError
    }



    // grading keys
    if (event.code === 'KeyA') {

      const addText = window.prompt('Enter the added word')

      evaluationTextData.paragraphs[this.state.highlightedParagraphIndex].words[this.state.highlightedWordIndex].addAfterWord = addText


      this.setState({evaluationTextData: evaluationTextData})
    }
    else if (event.code === 'KeyS' && !this.state.highlightedIsSpace && !event.shiftKey ) {

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


  onPrompt1Clicked = () => {
    const params = { prompt_status: PromptOptions.tellSomeMore }
    updateStudent(params, this.props.studentID)
    this.setState({ showPromptAlert: true })
    setTimeout(() => {
      this.setState({ showPromptAlert: false });
    }, 2500);

  }

  onPrompt2Clicked = () => {
    const params = { prompt_status: PromptOptions.whatInStory }
    updateStudent(params, this.props.studentID)
    this.setState({ showPromptAlert: true })
    setTimeout(() => {
      this.setState({ showPromptAlert: false });
    }, 2500); 

  }

  onPrompt3Clicked = () => {
    const params = { prompt_status: PromptOptions.whyImportant }
    updateStudent(params, this.props.studentID)
    this.setState({ showPromptAlert: true })
    setTimeout(() => {
      this.setState({ showPromptAlert: false });
    }, 2500);

  }

  onPrompt4Clicked = () => {
    const params = { prompt_status: PromptOptions.whyThinkThat }
    updateStudent(params, this.props.studentID)
    this.setState({ showPromptAlert: true })
    setTimeout(() => {
      this.setState({ showPromptAlert: false });
    }, 2500);

  }

  onPrompt5Clicked = () => {
    const params = { prompt_status: PromptOptions.repeatQuestion }
    updateStudent(params, this.props.studentID)
    this.setState({ showPromptAlert: true })
    setTimeout(() => {
      this.setState({ showPromptAlert: false });
    }, 2500);

  }

  onPrompt6Clicked = () => {
    const params = { prompt_status: PromptOptions.noPromptNeeded }
    updateStudent(params, this.props.studentID)
    this.setState({ showPromptAlert: true })
    setTimeout(() => {
      this.setState({ showPromptAlert: false });
    }, 2500);

  }


  onIsLiveDemoClicked = () => {
    this.setState({ isLiveDemo: true })
    updateAssessment( {
                       is_live_demo: true,
                      },
                       this.props.assessmentID,
                    )
  }

  onIsNotLiveDemoClicked = () => {
    this.setState({ isLiveDemo: false })
    updateAssessment( {
                       is_live_demo: false,
                      },
                       this.props.assessmentID,
                    )
  }


  onFPclicked = () => {
    this.setState({ assessmentBrand: 'FP' })
    updateAssessment( {
                       brand: 'FP',
                      },
                       this.props.assessmentID,
                    )
  }

  onSTEPclicked = () => {
    this.setState({ assessmentBrand: 'STEP' })
    updateAssessment( {
                       brand: 'STEP',
                      },
                       this.props.assessmentID,
                    )
  }


  onFluencyScoreClicked = (id) => {
    console.log('id is: ', id)
    this.setState({fluencyScore: id})
  }



  onCompScoreClicked = (score, questionNum) => {
    console.log('score is: ', score)

    let graderComments = this.state.graderComments
    graderComments[String(questionNum)] = book.questions[String(questionNum + 1)].rubric[score]
    let compScores = this.state.compScores
    compScores[String(questionNum)] = score

    this.setState({ graderComments: graderComments,
                    compScores: compScores })

  }



  onPreviewClicked = () => {
    this.onSaveClicked()

    setTimeout( () => { window.open(`/reports/${this.props.userID}`, '_blank') }, 1500)
  }


  onSubmitClicked = () => {

    this.onSaveClicked()

    markScored(this.props.assessmentID)
    this.setState({showSubmitAlert: true,
                   showSaveAlert: false,
                   showChecklistModal: false,
                  })

  }


  onSaveClicked = () => {
    updateScoredText(this.state.evaluationTextData, this.props.assessmentID);

    if (this.state.fluencyScore != null) {
      updateFluencyScore(this.state.fluencyScore, this.props.assessmentID)
    }

    let studentResponses = { 0: this.studentResponsesInput1.value,
                             1: this.studentResponsesInput2.value,
                             2: this.studentResponsesInput3.value,
                            }
    let graderComments = { 0: this.graderCommentsInput1.value,
                           1: this.graderCommentsInput2.value,
                           2: this.graderCommentsInput3.value,
                            }


     if (numQuestions >= 4) {
      studentResponses["3"] = this.studentResponsesInput4.value
      graderComments["3"] = this.graderCommentsInput4.value
     }

     if (numQuestions >= 5) {
      studentResponses["4"] = this.studentResponsesInput5.value
      graderComments["4"] = this.graderCommentsInput5.value
     }
                        
     if (numQuestions >= 6) {
      studentResponses["5"] = this.studentResponsesInput6.value
      graderComments["5"] = this.graderCommentsInput6.value
     }
            
    let compScores = this.state.compScores

    updateAssessment( {
                       student_responses: studentResponses,
                       grader_comments: graderComments,
                       comp_scores: compScores,
                      },
                       this.props.assessmentID,
                    )

    this.setState({ hasSavedRecently: true,
                    showSaveAlert: true })

    setTimeout(() => {
      this.setState({ hasSavedRecently: false });
    }, 20000);


  }


  onUnscorableClicked = () => {
    markUnscorable(this.props.assessmentID);
    console.log("Done marking?")
    this.setState({showSubmitAlert: true})
  }


  handleAlertDismiss = () => {
    this.setState({showSubmitAlert: false,
                   showSaveAlert: false,
                   showPromptAlert: false,
                 })
  }


  onExitClicked = () => {
    window.location.href = '/'
  }


  checkS3 = (qNum, isOnPageLoad) => {

    let url

    if (qNum === 0) {
      url = `https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/${this.props.env}/${this.props.userID}/recording.webm`
    }
    else {
      url = `https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/${this.props.env}/${this.props.userID}/comp/question${qNum}.webm`
    }

    axios.get(url)
    .then(res => {
      console.log(res);
      console.log("yay!");
      console.log('found s3 for question: ', qNum)

      if (!isOnPageLoad) {
        console.log("starting to play sound...");
        playSoundAsync('/audio/complete.mp3')
      }

      let showQArr = this.state.showQArr
      showQArr[String(qNum)] = true 
      this.setState({showQArr: showQArr}) 
 
    }).catch(error => {
      console.log(error)
      console.log("couldn't find ", qNum)

      // Reset state if not found...
      let showQArr = this.state.showQArr
      showQArr[String(qNum)] = false 
      this.setState({showQArr: showQArr}) 

    })

  }


  renderCompAudioPlayer = (q) => {

    let url
    let waitingOn
    let label

    if (q === 0) {
      url = `https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/${this.props.env}/${this.props.userID}/recording.webm`
      waitingOn = `audio of their oral reading...`
      label = 'Oral reading'
    }
    else {
      url = `https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/${this.props.env}/${this.props.userID}/comp/question${q}.webm`
      waitingOn = `audio response to Q${q}...`
      label = `Response to Q${q}`

    }

      if (this.state.showQArr[String(q)]) {
        return ( 
          <div style={{marginBottom: 20, marginTop: 20}} key={q}>
            <h5>{label}</h5>
            <audio controls ref={"audioPlayer"+String(q)} className={styles.audioElement}>
              <source src={url} />
              <p>Playback not supported</p>
            </audio>
          </div>
        )
      }
      else {

          if (this.state.hasSeenCompletedModal) {
            return (<p key={q}> User ended before submitting {`audio response to Q${q}.`} Don't grade it.</p>)
          }
          else {
            return (<p key={q}> Still waiting for {waitingOn} <i className={'fa fa-spinner fa-pulse'} /></p>)
          }


      }

  }



  renderCompAudioPlayers = () => {

    if (this.props.userID <= 156 ) {  // backwards compatibility
      return  (
        <audio controls ref={"audioPlayer1"} className={styles.audioElement}>
          <source src={`https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/${this.props.env}/${this.props.userID}/comp/recording.webm`} />
          <p>Playback not supported</p>
        </audio>
      )
    } 

    let audioPlayers = []

    for(let q = 0; q <= numQuestions; q++){
      

    let url
    let waitingOn
    let label

    if (q === 0) {
      url = `https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/${this.props.env}/${this.props.userID}/recording.webm`
      waitingOn = `audio of their oral reading...`
      label = 'Oral reading'
    }
    else {
      url = `https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/${this.props.env}/${this.props.userID}/comp/question${q}.webm`
      waitingOn = `audio response to Q${q}...`
      label = `Response to Q${q}`

    }



      if (this.state.showQArr[String(q)]) {
        audioPlayers.push (
          <div style={{marginBottom: 20, marginTop: 20}} key={q}>
            <h5>{label}</h5>
            <audio controls ref={"audioPlayer"+String(q)} className={styles.audioElement}>
              <source src={url} />
              <p>Playback not supported</p>
            </audio>
          </div>
        )
      }
      else {


          if (this.state.hasSeenCompletedModal) {

            audioPlayers.push (
              <p key={q}> User ended before submitting {`audio response to Q${q}.`} Don't grade it.</p>
            )
          }
          else {
            audioPlayers.push (
              <p key={q}> Still waiting for {waitingOn} <i className={'fa fa-spinner fa-pulse'} /></p>
            )
          }
      }

    }

    return audioPlayers
  }


  renderNavigationBar = (isWaiting) => {
    let navProps

      navProps = {
        showPauseButton: false,
        onReport: false,
        onExitClicked: this.onExitClicked,
        onReplayClicked: this.onReplayClicked,
        onGrading: true,
        onReader: false,
        onPreviewClicked: this.onPreviewClicked,
        onSaveClicked: this.onSaveClicked,
        showChecklistModal: this.showChecklistModal,
        hideMenuItems: isWaiting,

    }

    return <NavigationBar {...navProps} />
  }

  handleGraderCommentChange = (event, id) => {
    let graderComments = this.state.graderComments
    graderComments[String(id)] = event.target.value
    this.setState({ graderComments: graderComments })
  }


  renderScoringButtonsComp = (qNum) => {
    let buttonArr = []
    let pointsPossible = book.questions[String(qNum)].points

    for (let i = 0; i <= pointsPossible; i++) {
      buttonArr.push(
        <Button key={i} active={this.state.compScores[qNum - 1] === i} href="#" onClick={() => this.onCompScoreClicked(i, qNum - 1)}><strong>{i}</strong> {i === 0 ? ' - Missed' : ' - Correct'}</Button>
      )
    }

    return (
      <ButtonGroup className={[styles.fluencyButtonGroup, styles.promptButtonGroup].join(' ')}>
        { buttonArr }
      </ButtonGroup>
    )

  }

  renderCompQuestions1 = () => {
    let q = 1
    let questionsArr = []



      questionsArr.push(
          <div key={q} >
            <br/><br/>

            <h4>{`Question ${q}`}</h4> 

            <h5 style={{width: 650, fontWeight: 100, fontStyle: 'italic'}}>{ book.questions[String(q)].title + ' ' + book.questions[(q)].subtitle }</h5>

            {this.renderCompAudioPlayer(q)}

            <br/>
            <br/>


            <FormGroup controlId="studentResponse">
              <ControlLabel>Student Response</ControlLabel>
              <FormControl className={styles.tallTextArea} componentClass="textarea" className={styles.myTextArea} defaultValue={this.props.studentResponsesPrior[q - 1]} inputRef={ref => { this.studentResponsesInput1 = ref; }} placeholder="Student response" />
            </FormGroup>


            <h5 className={styles.compScoreHeading}>
              Comp Score
            </h5>

            {this.renderScoringButtonsComp(q)}

            <br/>
            <br/>
            
            <FormGroup controlId="graderComments">
              <ControlLabel>Your comments</ControlLabel>
              <FormControl value={this.state.graderComments[String(q - 1)]} onChange={(event) => this.handleGraderCommentChange(event, q - 1)} componentClass="textarea" className={styles.myTextArea}  inputRef={ref => { this.graderCommentsInput1 = ref; }} placeholder="Your comments" />
            </FormGroup>




            <br/><br/><br/>
          </div>
      ) 
    return questionsArr[0]
  }


  renderCompQuestions2 = () => {
    let q = 2
    let questionsArr = []

    let handleChangeFunc


      questionsArr.push(
          <div key={q} >
            <br/><br/>

            <h4>{`Question ${q}`}</h4> 

            <h5 style={{width: 650, fontWeight: 100, fontStyle: 'italic'}}>{ book.questions[String(q)].title + ' ' + book.questions[(q)].subtitle }</h5>

            {this.renderCompAudioPlayer(q)}

            <br/>
            <br/>


            <FormGroup controlId="studentResponse">
              <ControlLabel>Student Response</ControlLabel>
              <FormControl className={styles.tallTextArea} componentClass="textarea" className={styles.myTextArea} defaultValue={this.props.studentResponsesPrior[q - 1]} inputRef={ref => { this.studentResponsesInput2 = ref; }} placeholder="Student response" />
            </FormGroup>


            <h5 className={styles.compScoreHeading}>
              Comp Score
            </h5>

            {this.renderScoringButtonsComp(q)}

            <br/>
            <br/>
            
            <FormGroup controlId="graderComments">
              <ControlLabel>Your comments</ControlLabel>
              <FormControl value={this.state.graderComments[String(q - 1)]} onChange={(event) => this.handleGraderCommentChange(event, q - 1)} componentClass="textarea" className={styles.myTextArea}  inputRef={ref => { this.graderCommentsInput2 = ref; }} placeholder="Your comments" />
            </FormGroup>



            <br/><br/><br/>
          </div>
      ) 
    return questionsArr[0]
  }

 renderCompQuestions3 = () => {
    let q = 3
    let questionsArr = []

    let handleChangeFunc


      questionsArr.push(
          <div key={q} >
            <br/><br/>

            <h4>{`Question ${q}`}</h4> 

            <h5 style={{width: 650, fontWeight: 100, fontStyle: 'italic'}}>{ book.questions[String(q)].title + ' ' + book.questions[(q)].subtitle }</h5>

            {this.renderCompAudioPlayer(q)}

            <br/>
            <br/>


            <FormGroup controlId="studentResponse">
              <ControlLabel>Student Response</ControlLabel>
              <FormControl className={styles.tallTextArea} componentClass="textarea" className={styles.myTextArea} defaultValue={this.props.studentResponsesPrior[q - 1]} inputRef={ref => { this.studentResponsesInput3 = ref; }} placeholder="Student response" />
            </FormGroup>


            <h5 className={styles.compScoreHeading}>
              Comp Score
            </h5>

            {this.renderScoringButtonsComp(q)}

            <br/>
            <br/>
            
            <FormGroup controlId="graderComments">
              <ControlLabel>Your comments</ControlLabel>
              <FormControl value={this.state.graderComments[String(q - 1)]} onChange={(event) => this.handleGraderCommentChange(event, q - 1)} componentClass="textarea" className={styles.myTextArea}  inputRef={ref => { this.graderCommentsInput3 = ref; }} placeholder="Your comments" />
            </FormGroup>



            <br/><br/><br/>
          </div>
      ) 
    return questionsArr[0]
  }

renderCompQuestions4 = () => {
    let q = 4
    let questionsArr = []

    let handleChangeFunc


      questionsArr.push(
          <div key={q} >
            <br/><br/>

            <h4>{`Question ${q}`}</h4> 

            <h5 style={{width: 650, fontWeight: 100, fontStyle: 'italic'}}>{ book.questions[String(q)].title + ' ' + book.questions[(q)].subtitle }</h5>

            {this.renderCompAudioPlayer(q)}

            <br/>
            <br/>


            <FormGroup controlId="studentResponse">
              <ControlLabel>Student Response</ControlLabel>
              <FormControl className={styles.tallTextArea} componentClass="textarea" className={styles.myTextArea} defaultValue={this.props.studentResponsesPrior[q - 1]} inputRef={ref => { this.studentResponsesInput4 = ref; }} placeholder="Student response" />
            </FormGroup>


            <h5 className={styles.compScoreHeading}>
              Comp Score
            </h5>

            {this.renderScoringButtonsComp(q)}

            <br/>
            <br/>
            
            <FormGroup controlId="graderComments">
              <ControlLabel>Your comments</ControlLabel>
              <FormControl value={this.state.graderComments[String(q - 1)]} onChange={(event) => this.handleGraderCommentChange(event, q - 1)} componentClass="textarea" className={styles.myTextArea}  inputRef={ref => { this.graderCommentsInput4 = ref; }} placeholder="Your comments" />
            </FormGroup>



            <br/><br/><br/>
          </div>
      ) 
    return questionsArr[0]
  }

renderCompQuestions5 = () => {
    let q = 5
    let questionsArr = []


      questionsArr.push(
          <div key={q} >
            <br/><br/>

            <h4>{`Question ${q}`}</h4> 

            <h5 style={{width: 650, fontWeight: 100, fontStyle: 'italic'}}>{ book.questions[String(q)].title + ' ' + book.questions[(q)].subtitle }</h5>

            {this.renderCompAudioPlayer(q)}

            <br/>
            <br/>


            <FormGroup controlId="studentResponse">
              <ControlLabel>Student Response</ControlLabel>
              <FormControl className={styles.tallTextArea} componentClass="textarea" className={styles.myTextArea} defaultValue={this.props.studentResponsesPrior[q - 1]} inputRef={ref => { this.studentResponsesInput5 = ref; }} placeholder="Student response" />
            </FormGroup>


            <h5 className={styles.compScoreHeading}>
              Comp Score
            </h5>

            {this.renderScoringButtonsComp(q)}

            <br/>
            <br/>
            
            <FormGroup controlId="graderComments">
              <ControlLabel>Your comments</ControlLabel>
              <FormControl value={this.state.graderComments[String(q - 1)]} onChange={(event) => this.handleGraderCommentChange(event, q - 1)} componentClass="textarea" className={styles.myTextArea}  inputRef={ref => { this.graderCommentsInput5 = ref; }} placeholder="Your comments" />
            </FormGroup>

            <br/><br/><br/>
          </div>
      ) 
    return questionsArr[0]
  }


renderCompQuestions6 = () => {
    let q = 6
    let questionsArr = []


      questionsArr.push(
          <div key={q} >
            <br/><br/>

            <h4>{`Question ${q}`}</h4> 

            <h5 style={{width: 650, fontWeight: 100, fontStyle: 'italic'}}>{ book.questions[String(q)].title + ' ' + book.questions[(q)].subtitle }</h5>

            {this.renderCompAudioPlayer(q)}

            <br/>
            <br/>


            <FormGroup controlId="studentResponse">
              <ControlLabel>Student Response</ControlLabel>
              <FormControl className={styles.tallTextArea} componentClass="textarea" className={styles.myTextArea} defaultValue={this.props.studentResponsesPrior[q - 1]} inputRef={ref => { this.studentResponsesInput6 = ref; }} placeholder="Student response" />
            </FormGroup>


            <h5 className={styles.compScoreHeading}>
              Comp Score
            </h5>

            {this.renderScoringButtonsComp(q)}

            <br/>
            <br/>
            
            <FormGroup controlId="graderComments">
              <ControlLabel>Your comments</ControlLabel>
              <FormControl value={this.state.graderComments[String(q - 1)]} onChange={(event) => this.handleGraderCommentChange(event, q - 1)} componentClass="textarea" className={styles.myTextArea}  inputRef={ref => { this.graderCommentsInput6 = ref; }} placeholder="Your comments" />
            </FormGroup>

            <br/><br/><br/>
          </div>
      ) 
    return questionsArr[0]
  }







  render() {

    if (this.props.waiting) {
      return (
        <div className={styles.waitingInfo}>

                { this.renderNavigationBar(true) }

        <h2 className={styles.waitingInfoHeader}>Waiting until user starts demo... <i className={'fa fa-spinner fa-pulse'} /></h2>
        <h4 className={styles.waitingInfoSubHeader}> This can take up to 10 minutes </h4>
          <style type="text/css">{'.modal-backdrop.in { opacity: 0.7; } '}</style>
            <Modal show={this.state.showWakeModal} dialogClassName={reportStyles.modalSmall}>
              <Modal.Header>
                <Modal.Title bsClass={[reportStyles.pricingModalTitle, reportStyles.readyModalTitle].join(' ')}>
                  They started reading :)  
                </Modal.Title>
              </Modal.Header>
              <Modal.Body bsClass={reportStyles.readyModalBody}>

                <div className={reportStyles.pricingFormWrapper}>
                   <i className={["fa", "fa-flag", reportStyles.readyCheck, reportStyles.pulse, reportStyles.flag].join(" ")} aria-hidden={"true"} />
                </div>


                  <a href={`/grade/latest?partner=true`}>
                    <Button
                      className={[reportStyles.pricingFormButton, reportStyles.seeYourReportButton].join(' ')}
                      bsStyle={'primary'}
                    >
                      Set up grading
                    </Button>
                  </a>

              </Modal.Body>
            </Modal>


        </div>
      )
    }

    if (this.props.isRemote) {
      return (
        <div>
          { this.renderNavigationBar(true) }

          <div className={[styles.graderContainer, styles.mobileContainer].join(' ')}>
            <div className={styles.nameHeading}>
              { "Demo from " + this.props.shortCreatedAt + " (PST)"}
            </div>


            <h4>Prompts</h4>
            <ButtonGroup className={[styles.fluencyButtonGroup, styles.promptButtonGroup].join(' ')}>
              <Button href="#" onClick={this.onPrompt1Clicked}>Tell some more</Button>
              <Button href="#" onClick={this.onPrompt2Clicked}>What in the story makes you think that?</Button>
              <Button href="#" onClick={this.onPrompt3Clicked}>Why is that important?</Button>
              <Button href="#" onClick={this.onPrompt4Clicked}>Why do you think that?</Button>
              <Button href="#" onClick={this.onPrompt5Clicked}>Repeat the question</Button>
              <Button href="#" onClick={this.onPrompt6Clicked}><strong>No prompt needed</strong></Button>
            </ButtonGroup>



          </div>


          {this.state.showPromptAlert &&
            <div className={styles.alertSuccess}>
              <Alert bsStyle="info" onDismiss={this.handleAlertDismiss}>
                <strong>Great!</strong> Your prompt was sent successfully.
              </Alert>
            </div>
          }



       </div>

      )

    }

    return (

      <div>

        { this.renderNavigationBar(false) }

      <div className={styles.graderContainer}>


        <div className={styles.headingContainer}>
          <div className={styles.nameHeading}>
            { "Demo from " + this.props.shortCreatedAt + " (PST)"}
          </div>
          { this.props.scored &&
          <div className={styles.emailHeading}>
            {this.props.email}
          </div>
          }
          <div className={styles.emailHeading}>
            {this.props.createdAt + " (Pacific)"}
          </div>
        </div>

        <br/><br/>
        
        {!this.props.isPartner &&
        <div className={styles.philControls}>
          <div className={[styles.compPromptContainer, styles.block]}>
            <h4>Prompts</h4>
            <ButtonGroup className={[styles.fluencyButtonGroup, styles.promptButtonGroup].join(' ')}>
              <Button href="#" onClick={this.onPrompt1Clicked}>Tell some more</Button>
              <Button href="#" onClick={this.onPrompt2Clicked}>What in the story makes you think that?</Button>
              <Button href="#" onClick={this.onPrompt3Clicked}>Why is that important?</Button>
              <Button href="#" onClick={this.onPrompt4Clicked}>Why do you think that?</Button>
              <Button href="#" onClick={this.onPrompt5Clicked}>Repeat the question</Button>
              <Button href="#" onClick={this.onPrompt6Clicked}><strong>No prompt needed</strong></Button>
            </ButtonGroup>

          </div>

          <div className={styles.compPromptContainer}>
            <h4>Asessment Brand?</h4>
            <ButtonGroup className={[styles.fluencyButtonGroup, styles.promptButtonGroup].join(' ')}>
              <Button active={this.state.assessmentBrand === 'FP'} href="#" onClick={this.onFPclicked}>F&P</Button>
              <Button active={this.state.assessmentBrand === 'STEP'} href="#" onClick={this.onSTEPclicked}>STEP</Button>
            </ButtonGroup>
          </div>


          <div className={styles.compPromptContainer}>
            <h4>Scoring live?</h4>
            <ButtonGroup className={[styles.fluencyButtonGroup, styles.promptButtonGroup].join(' ')}>
              <Button active={this.state.isLiveDemo} href="#" onClick={this.onIsLiveDemoClicked}>Yes, live</Button>
              <Button active={!this.state.isLiveDemo} href="#" onClick={this.onIsNotLiveDemoClicked}>No, not live</Button>
            </ButtonGroup>
          </div>
        </div>

        }

        {   
            this.renderCompAudioPlayers()
        }   


        <div style={{opacity: (this.state.showQArr[String(0)] || !this.props.isPartner) ? 1 : 0.4 }} className={styles.markupContainer}>
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
            isSample={false}
            showMSV={this.props.bookKey !== 'firefly'}
            bookKey={this.props.bookKey}
          />



        </div>

        <style type="text/css">{'.modal-backdrop.in { opacity: 0.7; } '}</style>
        <Modal show={this.state.showReadyForReviewModal} onHide={this.closeReportReadyModal} dialogClassName={reportStyles.modalSmall}>
          <Modal.Header closeButton>
            <Modal.Title bsClass={[reportStyles.pricingModalTitle, reportStyles.readyModalTitle].join(' ')}>
              Ready for review! 
            </Modal.Title>
          </Modal.Header>
          <Modal.Body bsClass={reportStyles.readyModalBody}>

            <div className={reportStyles.pricingFormWrapper}>
               <i className={["fa", "fa-check", reportStyles.readyCheck, reportStyles.pulse].join(" ")} aria-hidden={"true"} />
            </div>


              <a href={`/grade/${this.props.userID}/?seen_update_prior=true`}>
                <Button
                  className={[reportStyles.pricingFormButton, reportStyles.seeYourReportButton].join(' ')}
                  bsStyle={'success'}
                >
                  See report
                </Button>
              </a>

          </Modal.Body>
        </Modal>

        <Modal show={this.state.showCompletedModal} onHide={this.closeCompletedModal} dialogClassName={reportStyles.modalSmall}>
          <Modal.Header closeButton>
            <Modal.Title bsClass={[reportStyles.pricingModalTitle, reportStyles.readyModalTitle].join(' ')}>
              The user ended their demo
            </Modal.Title>
          </Modal.Header>
          <Modal.Body bsClass={reportStyles.readyModalBody}>

            <div className={reportStyles.pricingFormWrapper}>
               <i className={["fa", "fa-check", reportStyles.readyCheck, reportStyles.pulse].join(" ")} style={{color: '#f0ad4e'}}aria-hidden={"true"} />
            </div>


                <Button
                  className={[reportStyles.pricingFormButton, reportStyles.seeYourReportButton].join(' ')}
                  bsStyle={'warning'}
                  onClick={this.closeCompletedModal}
                >
                  Dismiss
                </Button>

          </Modal.Body>
        </Modal>




      <style type="text/css">{'.modal-backdrop.in { opacity: 0.7; } '}</style>
        <Modal show={this.state.showWakeModal} dialogClassName={reportStyles.modalSmall}>
          <Modal.Header>
            <Modal.Title bsClass={[reportStyles.pricingModalTitle, reportStyles.readyModalTitle].join(' ')}>
              They started reading :)  
            </Modal.Title>
          </Modal.Header>
          <Modal.Body bsClass={reportStyles.readyModalBody}>

            <div className={reportStyles.pricingFormWrapper}>
               <i className={["fa", "fa-flag", reportStyles.readyCheck, reportStyles.pulse, reportStyles.flag].join(" ")} aria-hidden={"true"} />
            </div>


              <a href={`/grade/latest`}>
                <Button
                  className={[reportStyles.pricingFormButton, reportStyles.seeYourReportButton].join(' ')}
                  bsStyle={'primary'}
                >
                  Set up grading
                </Button>
              </a>

          </Modal.Body>
        </Modal>


       <style type="text/css">{'.modal-backdrop.in { opacity: 0.7; } '}</style>
        <Modal show={this.state.showChecklistModal} onHide={this.closeChecklistModal} dialogClassName={reportStyles.modalMedium}>
          <Modal.Header closeButton>
            <Modal.Title bsClass={[reportStyles.pricingModalTitle, reportStyles.readyModalTitle].join(' ')}>
              First review this checklist!
            </Modal.Title>
          </Modal.Header>
          <Modal.Body bsClass={reportStyles.readyModalBody}>

            <div style={{marginTop: 10, marginBottom: 30}}className={reportStyles.pricingFormWrapper}>

              <h4>Did you?...</h4>
              <ul>
              <li>Score the oral reading for Additions, Deletions, Substitutions, and Ending early?</li>
              <li>
              <ul>
              <li>use the proper &ldquo;/sc&rdquo; edit for a self correct?</li>
              <li>phonetically spell-out nonsense words? &nbsp;&nbsp;&nbsp;</li>
              </ul>
              </li>
              <li>Score each edit with any MSV cues used?&nbsp;</li>
              <li>Give a fluency score?&nbsp;</li>
              <li>Score each answered comprehension question?&nbsp;</li>
              <li>
              <ul>
              <li>Write out the student response?&nbsp;</li>
              <li>Mark it as Missed or Correct?</li>
              <li>(optional) tweak the comment to add one specific detail?&nbsp;</li>
              </ul>
              </li>
              <li>Wait until you got the yellow &ldquo;completed&rdquo; alert?</li>
              <li>Preview the report and see that everything looks right?&nbsp;</li>
              </ul>

            </div>


                <Button
                  className={[reportStyles.pricingFormButton, reportStyles.seeYourReportButton].join(' ')}
                  bsStyle={'success'}
                  onClick={this.onSubmitClicked}
                >
                  Yes, send it! 
                </Button>

          </Modal.Body>
        </Modal>



        <div style={{opacity: (this.state.showQArr[String(0)] || !this.props.isPartner) ? 1 : 0.4 }} className={styles.fluencyContainer}>
          <div className={styles.bookInfo}>
            <h3 >
              Fluency Score
            </h3>
            <span style={{marginLeft: 0}} className={styles.bookLevelHeading}>
              Assign a score using the rubric 
              <OverlayTrigger defaultOverlayShown={false} trigger={['click']} rootClose placement="bottom" overlay={popoverBottom}>
                <i className={["fa", "fa-question-circle", styles.questionIcon].join(" ")} aria-hidden={"true"} />
              </OverlayTrigger>

            </span>
          </div>
        </div> 


        <ButtonGroup style={{opacity: (this.state.showQArr[String(0)] || !this.props.isPartner) ? 1 : 0.4 }} className={styles.fluencyButtonGroup}>
          <Button active={this.state.fluencyScore === 0} href="#" onClick={() => this.onFluencyScoreClicked(0)}><strong>0</strong> - Unsatisfactory</Button>
          <Button active={this.state.fluencyScore === 1} href="#" onClick={() => this.onFluencyScoreClicked(1)}><strong>1</strong> - Partial</Button>
          <Button active={this.state.fluencyScore === 2} href="#" onClick={() => this.onFluencyScoreClicked(2)}><strong>2</strong> - Good</Button>
          <Button active={this.state.fluencyScore === 3} href="#" onClick={() => this.onFluencyScoreClicked(3)}><strong>3</strong> - Excellent</Button>
        </ButtonGroup>




        <h3 style={{opacity: (this.state.showQArr[String(1)]) ? 1 : 0.4 }} >Comprehension</h3>

        <br/><br/>

        { numQuestions >= 1 &&

          <div style={{opacity: (this.state.showQArr[String(1)]) ? 1 : 0.4 }}>
            { this.renderCompQuestions1() }
          </div>
        }

        { numQuestions >= 2 &&

          <div style={{opacity: (this.state.showQArr[String(2)]) ? 1 : 0.4 }}>
            { this.renderCompQuestions2() }
          </div>
        }


        { numQuestions >= 3 &&

          <div style={{opacity: (this.state.showQArr[String(3)]) ? 1 : 0.4 }}>
            { this.renderCompQuestions3() }
          </div>
        }

        { numQuestions >= 4 &&

          <div style={{opacity: (this.state.showQArr[String(4)]) ? 1 : 0.4 }}>
            { this.renderCompQuestions4() }
          </div>
        }


        { numQuestions >= 5 &&

          <div style={{opacity: (this.state.showQArr[String(5)]) ? 1 : 0.4 }}>
            { this.renderCompQuestions5() }
          </div>
        }

        { numQuestions >= 6 &&

          <div style={{opacity: (this.state.showQArr[String(6)]) ? 1 : 0.4 }}>
            { this.renderCompQuestions6() }
          </div>
        }


        <br/><br/>
        <br/><br/>

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
          bsSize={'small'}
          onClick={this.showChecklistModal}
        >
          Send to user
        </Button>


       
       {this.state.showSubmitAlert &&
        <div className={styles.alertSuccess}>
          <Alert bsStyle="success" onDismiss={this.handleAlertDismiss}>
            <strong>Great!</strong> We successfully sent the scored report. You can see it <a target="_blank" href={`/reports/${this.props.userID}`}>here</a>.
          </Alert>
        </div>
      }

       {this.state.showSaveAlert &&
        <div className={styles.alertSuccess}>
          <Alert bsStyle="info" onDismiss={this.handleAlertDismiss}>
            <strong>Great!</strong> Your edits were saved successfully.
          </Alert>
        </div>
      }

      {this.state.showPromptAlert &&
        <div className={styles.alertSuccess}>
          <Alert bsStyle="info" onDismiss={this.handleAlertDismiss}>
            <strong>Great!</strong> Your prompt was sent successfully.
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
