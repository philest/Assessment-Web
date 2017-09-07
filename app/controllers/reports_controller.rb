# TODO stuff this in a config/pony instead 
require 'pony'
Pony.options = {
  :via => :smtp,
  :via_options => {
    :address => 'smtp.sendgrid.net',
    :port => '587',
    :domain => 'heroku.com',
    :user_name => ENV['SENDGRID_USERNAME'],
    :password => ENV['SENDGRID_PASSWORD'],
    :authentication => :plain,
    :enable_starttls_auto => true
  }
}

require 'twilio-ruby'





class ReportsController < ApplicationController
  skip_before_action :verify_authenticity_token
  layout "reports"

  def index

    if params['user_id'] == "sample" || params['user_id'] == "direct-sample"

      @user = User.last
      @student = @user.teachers.last.classrooms.last.students.last
      @assessment = @student.assessments.last
      is_direct_sample = (params['user_id'] == "direct-sample")

      @reports_interface_props = {
        name: "Sarah Jones",
        email: "testemail@gmail.com",
        bookTitle: "No More Magic",
        bookLevel: "R",
        recordingURL: "https://s3-us-west-2.amazonaws.com/readup-now/website/homepage/sofia.wav",
        scoredText: "Fake!",
        userID: @user.id,
        assessmentID: @assessment.id, 
        whenCreated: (@assessment.updated_at.to_f*1000).to_i, # convert into ms since 1970 for equality with Rails date
        whenCreatedDate: @assessment.updated_at.to_s,
        isSample: true,
        isDirectSample: is_direct_sample, 
        isScoredPrior: @assessment.scored,
        isUnscorable: false,

        scorerProfilePicURL: "/images/lakia.png",
        scorerSignature: "Lakia Kenan, M.Ed",
        scorerResumeURL: "https://dcps.dc.gov/page/lakia-kenan",
        scorerJobTitle: "Reading Specialist",
        scorerEducation: "M.Ed in Reading Education (Trinity)",
        scorerExperience: "9 years at Orr Elementary",
        scorerEmail: "lakia@readupnow.com",
        scorerFirstName: "Lakia",
        scorerLastName: "Kenan",
        scorerFullName: "Lakia Kenan",

        reviewerSignature: "Ashley Brantley, M.A.",
        reviewerProfilePicURL: "/images/ashley.png"

      }

    elsif params['user_id'].to_i > 0 # Not the email_submit hack 

      @user = User.find(params['user_id'])
      @student = @user.teachers.last.classrooms.last.students.last
      @assessment = @student.assessments.last

      @reports_interface_props = {
        name: "#{@student.first_name} #{@student.last_name}",
        email: "#{@user.email}",
        bookTitle: "Firefly Night",
        bookLevel: "E",
        recordingURL: @assessment.book_key,
        scoredText: @assessment.scored_text,
        userID: @user.id,
        assessmentID: @assessment.id, 
        whenCreated: (@assessment.updated_at.to_f*1000).to_i, # convert into ms since 1970 for equality with Rails date
        whenCreatedDate: @assessment.updated_at.to_s,
        isSample: false,
        isDirectSample: false, 
        isScoredPrior: @assessment.scored,
        isUnscorable: @assessment.unscorable,

        scorerProfilePicURL: "/images/peter.png",
        scorerSignature: "Peter Krason, M.A.",
        scorerResumeURL: "https://www.linkedin.com/in/peter-krason-a6726189/",
        scorerJobTitle: "Reading Specialist",
        scorerEducation: "M.A. in Reading Instruction (DePaul)",
        scorerExperience: "7 years at Chicago Ridge",
        scorerEmail: "peter@readupnow.com",
        scorerFirstName: "Peter",
        scorerLastName: "Krason",
        scorerFullName: "Peter Krason",

        reviewerSignature: "Maria Contreras, M.Ed",
        reviewerProfilePicURL: "/images/maria-small.png"

      }
    end


        # BYE FOR NOW MARIA
        # scorerProfilePicURL: "/images/maria.png",
        # scorerSignature: "Maria Contreras, M.Ed",
        # scorerJobTitle: "Reading Specialist",
        # scorerEducation: "M.Ed in Reading Education (CUNY)",
        # scorerExperience: "14 years at Loma Park Elementary",
        # scorerEmail: "maria@readupnow.com",
        # scorerFirstName: "Maria",
        # scorerLastName: "Contreras",
        # scorerFullName: "Maria Contreras"
 


    puts "inside index controller..."
    puts params 




    # In case a scored text update
    if params["get_scored_text"]
      puts "okay, getting scored text..."
      render json: Assessment.last.scored_text
    end 

    # In case an email submit 
   if params["message"] && (ENV['RAILS_ENV'] == 'production')
      puts "Pony is sending this message....\n\n" + params["message"]

      Pony.mail(to: 'philesterman@gmail.com',
                 subject: "#{params["subject"]}",
                 body: "#{params["message"]}",
                 from: 'noreply@yoursammybird.com')



      account_sid = ENV['TWILIO_ACCOUNT_SID'] # Your Account SID from www.twilio.com/console
      auth_token = ENV['TWILIO_AUTH_TOKEN'] # Your Auth Token from www.twilio.com/console


      @client = Twilio::REST::Client.new account_sid, auth_token
      message = @client.messages.create(
          body: "#{params["message"]}",
          to: "+15612125831",    # Replace with your phone number
          from: "+12033035711")  # Replace with your Twilio number

      puts message.sid

      # Think it might skip the previous 
      # call = @client.calls.create(
      #     :url => "http://demo.twilio.com/docs/voice.xml",
      #     :to => "+15612125831",
      #     :from => "+12033035711")
      # puts call.to

    end



  end

  # TODO for some reason this route is never entered
  def email_submit
    puts "\n\ninside the email_submit controller\n\n"
    puts params["message"]
    puts params["recipient"]

    logger.info("THIS IS A TEST")

    # puts params[:params]
    # TODO mail this shitttt 
  end 


end