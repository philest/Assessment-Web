

class RegistrationController < ApplicationController

  def create_classroom

    classroom_options = {
      classroom_name: params["classroom_name"],
      user_id: params["user_id"].to_i,
      school_id: params["school_id"].to_i,
      grade: params["classroom_grade"].to_i,
      teacher_signature: params["signature"],
      student_list: params["student_names"]
    }

    puts 'classroom options:'
    puts classroom_options

    if Classroom.create_with_teacher_and_students(classroom_options)
    	head :ok
    else
      head 404
    end

  end
end