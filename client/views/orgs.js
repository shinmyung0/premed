// check if user is logged in



// check if button is clicked

// function that computes where a button is clicked,
// if clicked, change the view
// {{#if ButtonChecked true}}
//	{{UI.insert()}}


// syntax for a list
// Template.orgs.helpers({
//     categories: function(){
//         return ["facebook", "news", "tv", "tweets"]
//     }
// });

// Template.orgs.onCreated(function(){
// 	Meteor.call('getClubs', function(err, itemList){
// 		console.log("Here is the list being passed in");
// 		console.log(itemList);
// 		Session.set("items", itemList);
// 	});
// });

Template.orgs.onCreated(function(){
	Meteor.call('getClubs', function(err, itemList){
		Session.set("clubs", itemList);
	});
});


Template.orgs.events({
    "change #category-select": function (event, template) {
        var org = $(event.currentTarget).val();
        console.log("org : " + org);
        // additional code to do what you want with the category
    },

   	"click #renderForm": function(event, template) {
   		template.$(".test").toggle();	
   	},

   	"click #test2": function(event, template) {
   		template.$(".contents").toggle();	
   	},

   	'submit #suggestion-form': function(event) {
		event.preventDefault();

		var name = $('#name').val();
		var email = $('#email').val();
		var subject = $('#subject').val();
		var message = $('#message').val();
		var image = $('#image').val();
		var link = $('#link').val();
		

		Meteor.call('insertClubSuggestion', name, email, subject, message, link, image, function(err, success) {
			if (success) {
				alert("You've added content! ;)");
			} else {
				alert("Failed to add content ):");
			}
		});
	}
});

Template.orgs.helpers({

	'loginCheck #loginCheck': function(event) {
	var user = Meteor.userId();
	if (user) {
		return true;
	} else {
		return false;
		}
	},
	
	clubs: function() {
		return Session.get("clubs");
	},
	// clubs: function() {
	// 	return Clubs.find().fetch();
	// },

	'rendered': function() {
		return true;
	}
});
