$(function () {
  "use strict";

  Parse.initialize("Dos6tBKZV6elTbWJd6dLVJEMhgvFVM15X3Bc1ZWp", "fPUetc9GCDy3Fp4y9hi5WJteLfwv61vIXxDnYE2R");

  var app = app || {};

  var Memo = Parse.Object.extend({
    className: "Memo",
    defaults: {
      "title": "",
      "content": ""
    },
    validate: function (attributes) {
      if (attributes.content === "" || attributes.title === "") {
        return "title and content must be not empty.";
      }
    }
  });

  var MemoList = Parse.Collection.extend({
    model: Memo
  });

  var ListView = Backbone.View.extend({
    events: {
      "tap #logoutbtn": "onLogout"
    },
    initialize: function () {
      _.bindAll(this);
      this.$list = $("#memolist");
      this.listenTo(this.collection, "add", this.onAdd);
      this.listenTo(this.collection, "change", this.onChange);
      this.listenTo(this.collection, "remove", this.refresh);
    },
    init: function () {
      var _this = this;
      this.collection.fetch({
        success: function () {
          _this.render();
        }
      });
    },
    render: function () {
      this.collection.each(function (item) {
        this.addItemView(item);
      }, this);
      this.refresh();
      return this;
    },
    addItemView: function (item) {
      this.$list.append(new ItemView({model: item}).render().el);
    },
    onAdd: function (item) {
      this.addItemView(item);
      this.refresh();
    },
    onChange: function () {
      this.$list.empty();
      this.render();
    },
    refresh: function () {
      this.$list.listview("refresh");
    },
    onLogout: function () {
      Parse.User.logOut();
    }
  });

  var ItemView = Backbone.View.extend({
    tagName: "li",
    tmpl: _.template($("#tmpl-itemview").html()),
    events: {
      "tap .view": "onView"
    },
    initialize: function () {
      _.bindAll(this);
      this.listenTo(this.model, "destroy", this.onDestroy);
    },
    onView: function () {
      app.router.navigate("view/" + this.model.id, {trigger: true});
    },
    onDestroy: function () {
      this.remove();
    },
    render: function () {
      this.$el.html(this.tmpl(this.model.toJSON()));
      return this;
    }
  });

  var ShowView = Backbone.View.extend({
    events: {
      "tap #view-editbtn": "onEdit",
      "tap #view-delbtn": "onDelete"
    },
    initialize: function () {
      _.bindAll(this);
      this.$title = $("#view-title");
      this.$content = $("#view-content");
    },
    render: function () {
      this.$title.html(this.model.get("title"));
      this.$content.html(this.model.get("content"));
      return this;
    },
    onEdit: function () {
      app.router.navigate("edit/" + this.model.id, {trigger: true});
    },
    onDelete: function () {
      this.model.destroy();
      app.router.navigate("", {trigger: true});
    }
  });

  var AddView = Backbone.View.extend({
    events: {
      "tap #save-addbtn": "onSave"
    },
    initialize: function () {
      this.$title = $("#add-title");
      this.$content = $("#add-content");
    },
    render: function () {
      this.$title.val(this.model.get("title"));
      this.$content.val(this.model.get("content"));
      return this;
    },
    onSave: function () {
      var _this = this;
      this.model.set({title: this.$title.val(), content: this.$content.val()});
      this.model.setACL(new Parse.ACL(Parse.User.current()));
      this.model.save(null, {
        success: function () {
          _this.collection.add(_this.model);
        }
      });
      app.router.navigate("", {trigger: true});
    }
  });

  var EditView = AddView.extend({
    events: {
      "tap #save-editbtn": "onSave"
    },
    initialize: function () {
      this.$title = $("#edit-title");
      this.$content = $("#edit-content");
    },
    onSave: function () {
      var _this = this;
      this.model.save({title: this.$title.val(), content: this.$content.val()});
      app.router.navigate("", {trigger: true});
    }
  });

  var AboutView = Backbone.View.extend({

  });

  var LoginView = Backbone.View.extend({
    events: {
      "tap #loginbtn": "onLogin",
      "tap #login-signupbtn": "toSignup"
    },
    initialize: function () {
      _.bindAll(this);
      this.$username = $("#login-username");
      this.$paswword = $("#login-password");
      this.$message = $("#login-message");
      this.$loginbtn = $("#loginbtn");
    },
    onLogin: function () {
      var _this = this;
      Parse.User.logIn(this.$username.val(), this.$paswword.val(), {
        success: function (user) {
          app.router.navigate("", {trigger: true});
        },
        error: function (user, error) {
          _this.$message.html("Invalid username or password. Please try again.").show();
          _this.$loginbtn.removeAttr("disabled");
        }
      });
    },
    toSignup: function () {
      app.router.navigate("signup", {trigger: true})
    }
  });

  var SignupView = Backbone.View.extend({
    events: {
      "tap #signupbtn": "onSignup",
      "tap #signup-loginbtn": "toLogin"
    },
    initialize: function () {
      _.bindAll(this);
      this.$username = $("#signup-username");
      this.$paswword = $("#signup-password");
      this.$message = $("#signup-message");
      this.$signupbtn = $("#signupbtn");
    },
    onSignup: function () {
      var _this = this;
      var user = new Parse.User();
      user.set({username: this.$username.val(), password: this.$paswword.val()});
      user.signUp(null, {
        success: function (user) {
          app.router.navigate("", {trigger: true});
        },
        error: function (user, error) {
          _this.$message.html(error.message).show();
          _this.$signupbtn.removeAttr("disabled");
        }
      });
    },
    toLogin: function () {
      app.router.navigate("login", {trigger: true})
    }
  });

  var AppRouter = Backbone.Router.extend({
    routes: {
      "": "home",
      "add": "add",
      "view/:id": "show",
      "edit/:id": "edit",
      "info-dialog": "about",
      "login": "login",
      "signup": "signup"
    },
    initialize: function () {
      _.bindAll(this);

      $("a[data-rel='back']").on('tap', function (event) {
        window.history.back();
        return false;
      });

      this.firstPage = true;

      this.collection = new MemoList();

      this.listView = new ListView({el: $("#index"), collection: this.collection});
      this.listView.$el.on('pagebeforeshow', this.checkLogin);

      this.showView = new ShowView({el: $("#view")});

      this.addView = new AddView({el: $("#add"), collection: this.collection});

      this.editView = new EditView({el: $("#edit"), collection: this.collection});

      this.aboutView = new AboutView({el: $("#info-dialog")});

      this.loginView = new LoginView({el: $("#login")});

      this.signupView = new SignupView({el: $("#signup")});

    },
    home: function () {
      var currentUser = Parse.User.current();
      if (currentUser) {
        if (this.firstPage) {
          this.firstPage = false;
          this.listView.init();
        }
        this.changePage(this.listView);
      }
    },
    checkLogin: function () {
      var currentUser = Parse.User.current();
      if (!currentUser) {
          this.navigate("login", {trigger: true})
      }
    },
    login: function () {
      this.changePage(this.loginView);
    },
    signup: function () {
      this.changePage(this.signupView);
    },
    show: function (id) {
      this.showView.model = this.collection.get(id);
      this.changePage(this.showView.render());
    },
    add: function () {
      this.addView.model = new Memo(null, {collection: this.collection});
      this.changePage(this.addView.render());
    },
    edit: function (id) {
      this.editView.model = this.collection.get(id);
      this.changePage(this.editView.render());
    },
    about: function () {
      this.showDialog(this.aboutView);
    },
    changePage: function (view) {
      $.mobile.changePage(view.$el, {changeHash: false});
    },
    showDialog: function (view) {
      $.mobile.changePage(view.$el, {changeHash: false, role: "dialog"});
    }
  });

  app.router = new AppRouter();

  Backbone.history.start();

}());
