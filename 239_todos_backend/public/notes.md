
the Modal:
When 'Mark as Complete' is hit on the modal box, it does not reflect properly
under the nav bar.
The 'Mark as Complete' button is still clickable even if the the task is already
marked as complete.
Modal Mark as Complete doesnt go to the bottom

update month/year in item partial

the server:
bad response from server, is displayed with alert box. (the sample app doesnt do that)
  get '/' do
    send_file File.expand_path('index.html', settings.public_folder)
  end
Todo id does not exist error not checked, because user can only delete todo that exists (visible
  from the gui)

i am doing this:
error: function(jqxhr){
  alert(jqxhr.responseText + ", bad attributes.");
}

edited the fullstop below..
put '/todos/:id' do
  todo = Todo.find_by(id: params[:id])

  if todo && todo.update_attributes(extract_todo_params)
    status 201
    json todo
  else
    halt 400, 'Todo cannot be updated'
  end
end

you can still edit completed items, saving them after modal edit, keeps them as completed

Todos order maintained

dates are sorted

says no due dates for default, then server doesn't accept empty slots


Better to have started with the side bar

title minimum 3 chars

edited template for ndd

when you add or update todo, it redirects to the main page. requirements doesn't
specifically say anything otherwise. same convention as add todos 


CDN sources:
all at the bottom
handlebars from CDN


Animate the modal form
disable mark as complete button, when adding a new todo  
