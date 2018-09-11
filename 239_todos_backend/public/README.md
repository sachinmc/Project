###Settings:
* The route on the backend for home directory /, was pointing to index.erb, to work with index.html, the following lines of code were updated on the sinatra backend:

```
get '/' do
  send_file File.expand_path('index.html', settings.public_folder)
end
```

* All external libraries are sourced from CDNs.

---

###Feature implementations:
* All app features implemented, all UI features implemented (except animate modal).
* The dates on the sidebar is sorted based on date values, with 'No Due Date' at the top.
* Marked as complete items always appear at the bottom of the list.
* The todo page has all items listed the way they were added.
* All todo counts are dynamic and consistently displayed.
* All front end rendering is post backend update.

---

###Requirements and Assumptions:
* As per API documentation and behavior, it does not accept empty characters for title, day, month or year. However, the project requires that the default value for todo items without a month or year is 'No Due Date'. To satisfy this requirement and to perform a successful POST, month and year dummy values were assigned when none were provided by the user.

* Failed CRUD operations are captured. The operations fail for bad attributes, this happens only if the title is not present (user is prompted with bad attribute message) and not for the dates fields since the latter will hold dummy values to reflect the default 'No Due Date' status of todo items.

* As per requirement, when adding a new item, it selects the "All Todos" group from the nav area. No specific mention when updating an item, therefore followed suit with selecting the "All Todos" group from nav area after updating todo.

---

###the Sample Project:
* Within the sample project, when 'Mark as Complete' is hit on the modal box, it does not
push the marked as completed item to the bottom of the list. The submitted project has this implemented correctly.

---
