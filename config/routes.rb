Rails.application.routes.draw do

  resources :schools

  root 'homepage#index'

  get 'hello', to: 'hello_world#index'


  # static pages

  # get 'app', to: 'homepage#app'
  # get 'class', to: 'homepage#class'
  # get 'start', to: 'homepage#start'
  # get 'go', to: 'homepage#go'
  # get 'doc', to: 'homepage#doc'
  # get 'read', to: 'homepage#read'


  get 'mobile_halt', to: "homepage#mobile_halt"
  get 'error', to: 'homepage#error'
  get 'privacy', to: 'homepage#privacy'
  get 'terms', to: 'homepage#terms'
  get 'team', to: 'homepage#team'
  get 'instructions', to: 'homepage#instructions'
  get 'case_study', to: 'homepage#case_study'
  get 'join', to: 'homepage#join'
  get 'product_lead', to: 'homepage#product_lead'
  get 'developer', to: 'homepage#developer'
  get 'pilots', to: 'homepage#pilots'
  get 'schools', to: 'homepage#schools'
  get 'illustrator', to: 'homepage#illustrator'
  get 'design', to: 'homepage#design'
  get 'success', to: 'homepage#signup_success'
  get 'library', to: 'homepage#library'

  get 'token', to: 'video#token' 
  get 'room_events', to: 'video#room_events'
  post 'room_events', to: 'video#room_events'
  get 'list_active_rooms', to: 'video#list_active_rooms'


  # user stuff including auth

  resources :users
  resources :assessments
  resources :students

  get 'auth/get_user_count', to: 'registration#get_user_count'
  get 'auth/get_last_student_id', to: 'registration#get_last_student_id'
  get 'auth/get_last_assessment_id', to: 'registration#get_last_assessment_id'
  get 'auth/get_is_live_demo', to: 'registration#get_is_live_demo'


  get 'auth/user_exists', to: 'users#exists'
  get 'auth/complete_signup', to: 'users#show_complete_signup'

  post 'auth/add_school', to: 'registration#add_school'
  post 'auth/create_classroom', to: 'registration#create_classroom'
  post 'auth/create_demo_classroom', to: 'registration#create_demo_classroom'
  post 'auth/phil_setup_demo', to: 'registration#phil_setup_demo'

  get 'auth/search_school', to: 'registration#search_school'



  get 'student_dashboard', to: 'student_dashboard#index'
  get 'student_dashboard/', to: 'student_dashboard#index' # with added route info tacked on with hash, i.e. student_dashboard/#/story/:story_id/page/:page_id, handled by ReactRouter
  get 'student_dashboard/assessment', to: 'student_dashboard#create_assessment'
  post 'student_dashboard/assessment', to: 'student_dashboard#confirm_assessment_completion'

  get 'demo', to: redirect('/student_dashboard/#/story/nick')

  get 'fp', to: redirect('/student_dashboard/#/story/nick')
  get 'nick', to: redirect('/student_dashboard/#/story/nick')



  # The student testing the program... 

  get 'brian', to: redirect('/student_dashboard/#/story/step/demo/false/page/0/brian%20turner')




  get 'firefly', to: redirect('/student_dashboard/#/story/demo')
  get 'test', to: redirect('/student_dashboard/#/story/demo')

  get 'step', to: redirect('/student_dashboard/#/story/step')


  get 'step5', to: redirect('/student_dashboard/#/story/step5')


  get 'grade', to: redirect('/grade/waiting')
  get 'remote', to: redirect('/grade/remote')


  get 'fp-report', to: redirect('reports/direct-sample?brand=FP')


  get 'step-demo', to: redirect('reports/direct-sample?brand=STEP')
  get 'fp-demo', to: redirect('reports/direct-sample?brand=FP')


  get 'grade/:user_id', to: 'grader_interface#index'
  get 'reports/demo/show', to: 'reports#index'
  get 'reports/:user_id', to: 'reports#index'
  get 'reports/email_submit', to: 'reports#email_submit'



  # process audio
  post '/audio_process/save_file', to: 'audio_process#save_file'
  post '/audio_process/save_link', to: 'audio_process#save_link'
  get 'aws_presign', to: 'audio_process#aws_presign'

  get '/audio_process', to: 'audio_process#index'


  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
