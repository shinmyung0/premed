//Use subscribe here instead!
Meteor.subscribe("items");

Template.suggestionListView.helpers({
	items: function() {
		console.log(Session.get("items"));
		return Session.get("items");
	}
});

Template.suggestionListView.onCreated(function(){
	Meteor.call('getItems', function(err, itemList){
		Session.set("items", itemList);
	});
});

Template.suggestionListView.events ( {
	'submit .modal-dialog': function(event) {
		event.preventDefault();
		// console.log(event);

		var id = event.target.name;
		console.log(id);
		var subject = $('#'+id+" .subject").val();
		console.log(subject);

		// var subject = $('#subject').val();
		// var message = $('#message').val();
		// var image = $('#image').val();
		// var link = $('#link').val();
		// var display = $('#display').attr('checked');;
		// console.log(subject);

		Meteor.call('setItems', function(err, success) {
			if (success) {
				alert("Content updated! ;)");
			} else {
				alert("Failed to update content ):");
			}
		});
	}
});