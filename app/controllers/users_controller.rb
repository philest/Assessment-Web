class UsersController < ApplicationController
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  @mixpanel_homepage_key = ENV['MIXPANEL_HOMEPAGE']

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

  # POST /users
  # POST /users.json
  def create
    @user = User.new(user_params)
    @user.name = user_params[:first_name] + ' ' + user_params[:last_name]

    respond_to do |format|
      if @user.save
        # format.html { redirect_to @user, notice: 'User was successfully created.' }
        # format.json { render :show, status: :created, location: @user }
        # partial signup complete, now redirect to finish
        session[:user_id] = @user.id
        
        format.html do
          redirect_to '/auth/complete_signup'
        end
        
      else
        format.html { render :new }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /users/1
  # PATCH/PUT /users/1.json
  def update
    respond_to do |format|
      if @user.update(user_params)
        format.html { redirect_to @user, notice: 'User was successfully updated.' }
        format.json { render :show, status: :ok, location: @user }
      else
        format.html { render :edit }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
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
    render 'static_pages/signup/index'
  end


  private
    # Use callbacks to share common setup or constraints between actions.
    def set_user
      @user = User.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def user_params
      params.require(:user).permit(:email, :phone, :password, :password_confirmation, :default_locale, :default_signature, :default_propic, :name, :first_name, :last_name)
    end
end
