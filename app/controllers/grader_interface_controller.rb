
class GraderInterfaceController < ApplicationController
  layout "grader_interface"

  def setVariables 

      puts 'setVariables working...'
      # Backwards compatability to non-comp users... 
      if @assessment.comp_scores
        @comp_scores = @assessment.comp_scores
      else 
        @comp_scores = nil
      end 

      if @assessment.grader_comments
        @grader_comments = @assessment.grader_comments
      else 
        @grader_comments = nil
      end 

      if @assessment.student_responses
        @student_responses = @assessment.student_responses
      else 
        @student_responses = nil
      end 


      if (@assessment.student_responses === nil)
        @student_responses = { '0' => '',
                               '1' => '',
                               '2' => '',
                               '3' => ''
                             }
      end 

      if (@grader_comments === nil)
        @grader_comments = {   '0' => '',
                               '1' => '',
                               '2' => '',
                               '3' => ''
                             }
      end 

      if (@comp_scores === nil)
        @comp_scores = {       '0' => nil,
                               '1' => nil,
                               '2' => nil,
                               '3' => nil
                             }
      end
  end 


  def index

    if params['user_id'].to_i > 0
      @user = User.find(params['user_id'])
    elsif params['user_id'] == "latest" || params['user_id'] == "waiting" || params['user_id'] == "remote"
      @user = User.last
    end 


    if params['assessment_id'].to_i > 0 
      @student = Student.last
      @assessment = Assessment.find(params['assessment_id'])
    elsif params['user_id'].to_i > 0 || params['user_id'] == 'latest' || params['user_id'] == "waiting" || params['user_id'] == "remote"# Not the email_submit hack 
      @student = @user.teachers.last.classrooms.last.students.last
      @assessment = @student.assessments.last
    end

      setVariables

      created_at = @user.created_at.in_time_zone('Pacific Time (US & Canada)').to_time.strftime('%B %e at %l:%M %p')
      short_created_at = @user.created_at.in_time_zone('Pacific Time (US & Canada)').to_time.strftime('%l:%M %p')



      @grader_interface_props = {
        name: "#{@student.first_name} #{@student.last_name}",
        createdAt: created_at,
        shortCreatedAt: short_created_at,
        email: "#{@user.email}",
        # bookTitle: title,
        # bookLevel: level,
        recordingURL: "https://s3-us-west-2.amazonaws.com/readup-now/fake-assessments/#{ENV['RAILS_ENV']}/#{@user.id}/recording.webm",
        scoredText: @assessment.scored_text,
        userID: @user.id,
        assessmentID: @assessment.id,
        seenUpdatePrior: params["seen_update_prior"] == "true",
        whenCreated: (@assessment.updated_at.to_f*1000).to_i, # convert into ms since 1970 for equality with Rails date
        whenFirstSaved: (@assessment.saved_at .to_f*1000).to_i,
        userCountPrior: User.count,
        fluencyScorePrior: @assessment.fluency_score,

        graderCommentsPrior: @grader_comments,
        studentResponsesPrior: @student_responses,
        compScoresPrior: @comp_scores,


        studentID: @student.id,
        assessmentBrand: @assessment.brand,
        isLiveDemo: @assessment.is_live_demo,
        bookKey: @assessment.book_key,
        env: ENV['RAILS_ENV'],
        scored: @assessment.scored,
        waiting: params['user_id'] == "waiting",
        isPartner: params['partner'] == 'true',
        isRemote: params['user_id'] == "remote",
        completed: @assessment.completed,
        totalTimeReading: (@assessment.total_time_reading),
        scoredSpelling: @assessment.scored_spelling,
        isVideoChat: params["live"] != nil ,
        isProctor: params['proctor'] != nil,
      }
      
  end


end