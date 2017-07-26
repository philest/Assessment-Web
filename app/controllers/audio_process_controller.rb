class AudioProcessController < ApplicationController
  before_action :set_s3_direct_post

  def index
    render 'audio'
  end

  # #
  # def save_file
  #   audio = params[:audio]
  #   save_path = Rails.root.join("public/")
  #   save_path_complete = save_path + audio.original_filename

  #   audio.rewind

  #   # Open and write the file to file system.
  #   File.open(save_path_complete, 'wb') do |f|
  #     f.write audio.read
  #   end

  #   audio.rewind

  #   AudioProcessWorker.perform_async(save_path, save_path_complete, audio.original_filename)

  #   redirect_to action: 'index', status: 200
  # end

  #
  # def save_link
  #   puts params[:awsRes]
  #   redirect_to action: 'index', status: 201
  # end

  def aws_presign
    if @s3_direct_post
      render json: { fields: @s3_direct_post.fields, url: @s3_direct_post.url }
    else
      render status: 404, json: {
        error: "You're not logged in or you didn't supply an assessment_id!",
        assId: params["assessment_id"],
        stu_id: session[:student_id]
      }
    end
  end

  private

  def set_s3_direct_post
    puts "#{params["assessment_id"]}\n\n\n\n\n\n\n\n"
    if session[:student_id] && params["assessment_id"]
      @s3_direct_post = S3_BUCKET.presigned_post(
        key: "assessments/#{session[:student_id]}/#{params["assessment_id"]}/${filename}",
        success_action_status: '201',
        acl: 'public-read',
      )
    else
      @s3_direct_post = false
    end
  end
end
