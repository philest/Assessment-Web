class UsersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  @mixpanel_homepage_key = ENV['MIXPANEL_TOKEN']

  ### Normal autogenerated resource routes (CRUD)

  # GET /users
  # GET /users.json
  def index
    @users = User.all
  end

  # GET /users/1
  # GET /users/1.json
  def show
  end

  # GET /users/new
  def new
    @user = User.new
  end

  # GET /users/1/edit
  def edit
  end

  # GET /users/1/get_all_students
  def get_all_students
    @user = User.find(params[:id])
    all_students = @user.teachers.first.classrooms.first.students.to_json

    render json: all_students
  end 

  # GET /users/1/get_all_assessments
  def get_all_assessments
    @user = User.find(params[:id])
    all_students = @user.teachers.first.classrooms.first.students
    all_assessments = [] 

    
    all_students.each do |student| 
      all_assessments.push student.assessments.last 
    end

    render json: all_assessments
  end 

  # POST /users
  # POST /users.json
  def create
    puts user_params
    @user = User.new(user_params)
    @user.name = user_params[:first_name] + ' ' + user_params[:last_name]

    respond_to do |format|
      if @user.save
        # format.html { redirect_to @user, notice: 'User was successfully created.' }
        # format.json { render :show, status: :created, location: @user }
        # partial signup complete, now redirect to finish
        session[:user_id] = @user.id

        # TODO: location ?? what is this option...
        format.json { render json: @user , status: :ok, location: @user }

      else
        render json: @user.errors, status: :unprocessable_entity
      end
    end
  end

  # PATCH/PUT /users/1
  # PATCH/PUT /users/1.json
  def update

    # TODO PHIL: Fix this hack to avoid user_params 
    if email = params["params"]["email"]
      res = @user.update!(email: email, password: "12345678") 
    else
      @user.update_attributes(user_params)
    end

    render json: @user , status: :ok, location: @user




    # TODO PHIL: Make this work so can stick to rails convention
    # respond_to do |format|
    #   if @user.update(user_params)
    #     format.html { redirect_to @user, notice: 'User was successfully updated.' }
    #     format.json { render :show, status: :ok, location: @user }
    #   else
    #     format.html { render :edit }
    #     format.json { render json: @user.errors, status: :unprocessable_entity }
    #   end
    # end
  end

  # DELETE /users/1
  # DELETE /users/1.json
  def destroy
    @user.destroy
    respond_to do |format|
      format.html { redirect_to users_url, notice: 'User was successfully destroyed.' }
      format.json { head :no_content }
    end
  end


  ### Custom routes

  def exists

    if params[:email].nil? or params[:email].empty?
      return head 404
    end

    if !User.where(email: params[:email]).exists?
      return head 404
    end

    head 200
  end

  def show_complete_signup
    render 'homepage/signup/index'
  end


  private
    # Use callbacks to share common setup or constraints between actions.
    def set_user
      @user = User.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def user_params

      # TODO PHIL: Fix this hack to stop requiring users param
      # params.permit(
      #   :user,
      #   :authenticity_token,
      #   :email,
      #   :phone,
      #   :password,
      #   :password_confirmation,
      #   :default_locale,
      #   :default_signature,
      #   :default_propic,
      #   :name,
      #   :first_name,
      #   :last_name,
      #   :params,
      #   :headers,
      #   :id,
      # )

      params.permit!


      # params.require(:user).permit(
      #   :authenticity_token,
      #   :email,
      #   :phone,
      #   :password,
      #   :password_confirmation,
      #   :default_locale,
      #   :default_signature,
      #   :default_propic,
      #   :name,
      #   :first_name,
      #   :last_name,
      # )
    end
end
