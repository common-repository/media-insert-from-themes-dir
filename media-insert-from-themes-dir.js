(function($){

	var media = wp.media, l10n;
	l10n = media.view.l10n = typeof _wpMediaViewsL10n === 'undefined' ? {} : _wpMediaViewsL10n;



	/**
	 * wp.media.view.MediaFrame.Post
	 */
	var currentMediaFramePost = media.view.MediaFrame.Post;
	media.view.MediaFrame.Post = currentMediaFramePost.extend({
		initialize: function() {
			currentMediaFramePost.prototype.initialize.apply( this, arguments );
		},

		createStates: function() {
			this.states.add( new media.controller.ThemeDir() );
			currentMediaFramePost.prototype.createStates.apply( this, arguments );
		},

		bindHandlers: function() {
			this.on( 'toolbar:create:theme-dir-toolbar', this.themeDirToolbar, this );
			this.on( 'content:render:theme-dir', this.themeDirCotent, this );

			currentMediaFramePost.prototype.bindHandlers.apply( this, arguments );
		},

		themeDirCotent: function() {
			var view = new media.view.ThemeDir({
				controller: this,
				model:      this.state()
			}).render();

			this.content.set( view );
		},

		themeDirToolbar: function( toolbar ) {
			toolbar.view = new media.view.Toolbar.themeDir({
				controller: this
			});
		},

	});





	/**
	 * ========================================================================
	 * CONTROLLERS
	 * ========================================================================
	 */



	// wp.media.controller.ThemeDir
	// -------------------------
	media.controller.ThemeDir = media.controller.State.extend({
		defaults: {
			id:      'theme-dir',
			menu:    'default',
			content: 'theme-dir',
			toolbar: 'theme-dir-toolbar',
			sidebar: 'settings',

			title:    l10n.InsertfromThemesDirectory,
			priority: 130
		},

		initialize: function() {
			var Model = new Backbone.Model( {
				fileSelected:       false,
				fileName:           '',
				filePath:           '',
				url:                '',
				searchDir:          '/',
				
				link:               '',
				linkUrl:            '',
				align:              'none',
				alt:                '',
				caption:            '',
				height:             '',
				width:              '',
			} );

			this.props = Model;
			this.props.on( 'change:fileSelected', this.refresh, this );
		},

		refresh: function() {
			this.frame.toolbar.get().refresh();
		},

	});




	/**
	 * ========================================================================
	 * VIEWS
	 * ========================================================================
	 */




	// wp.media.view.Toolbar.ThemeDir
	// ---------------------------
	media.view.Toolbar.themeDir = media.view.Toolbar.Select.extend({
		initialize: function() {
			_.defaults( this.options, {
				text: l10n.insertIntoPost,
				requires: false
			});

			media.view.Toolbar.Select.prototype.initialize.apply( this, arguments );
			this.secondaryRender();
		},

		refresh: function() {
			var fileSelected = this.controller.state().props.get('fileSelected');
			this.get('select').model.set( 'disabled', ! fileSelected );

			media.view.Toolbar.Select.prototype.refresh.apply( this, arguments );
		},

		secondaryRender: function() {

			var renderFile = new media.view.ThemeDirDonateNag().render().el;
			this.$el.children(".media-toolbar-secondary").append( renderFile );

		},
	});




	/**
	 * media.view.ThemeDir
	 */
	media.view.ThemeDir = media.View.extend({

		className: 'theme-dir',
		
		initialize: function() {

			this.refresh();

			this.headTitle = new media.view.ThemeDirTitle({
				controller: this.controller,
				model:      this.model.props
			}).render();
			this.views.set([ this.headTitle ]);

			this.rootDir = new media.view.ThemeDirRoot({
				controller: this.controller,
				model:      this.model.props
			}).render();
			this.views.add([ this.rootDir ]);
			
			this.createSidebar();

			this.model.props.on( 'change:fileName', this.toggleFile, this );
			this.model.props.on( 'change:link', this.updateLinkTo, this );

		},

		refresh: function() {
			model = this.model.props;
			model.set('fileName', '');
			model.set('filePath', '');
			model.set('url', '');
			model.set('searchDir', '/');
			model.set('fileSelected', false);

			model.set('link', '');
			model.set('linkUrl', '');
			model.set('align', 'none');
			model.set('alt', '');
			model.set('caption', '');
			model.set('width', '');
			model.set('height', '');
		},

		createSidebar: function() {
			var options = this.options,
				selection = options.selection,
				sidebar = this.sidebar = new media.view.Sidebar({
					controller: this.controller
				});

			this.views.add( sidebar );
		},

		toggleFile: function() {
			var fileName = this.model.props.get('fileName');
			var fileSelected = this.model.props.get('fileSelected');
			var sidebar = this.sidebar;
			var current = this;

			if( fileSelected && fileName ) {

				var image = new Image();
				var deferred = $.Deferred();
				var imageUrl = this.model.props.get('url');
				image.onload = function() {

					deferred.resolve();
					current.model.props.set('width', image.width);
					current.model.props.set('height', image.height);

					sidebar.set( 'details', new media.view.ThemeDirFileDetails({
						controller: current.controller,
						model:      current.model.props,
						priority:   80
					}) );

				}
				image.onerror = deferred.reject;
				image.src = imageUrl;

			} else {
				sidebar.unset( 'details' );
			}
		},

		updateLinkTo: function() {
			var linkTo = this.model.props.get('link');
			var $input = this.sidebar.$('.link-to-custom');
			
			if( linkTo === 'none' || linkTo === 'file' ) {
				$input.hide();
				return;
			} else {
				$input.show();
				$input.val('http://');
			}
		},

	});




	/**
	 * media.view.ThemeDirTitle
	 */
	media.view.ThemeDirTitle = media.View.extend({
		className: 'theme-dir-title',
		template:  media.template('theme-dir-title'),
	});




	/**
	 * media.view.ThemeDirRoot
	 */
	media.view.ThemeDirRoot = media.View.extend({

		tagName:   'div',
		className: 'theme-dir-all-files',

		events: {
			'click li.type-file .theme-dir-file-preview':      'toggleSelection',
			'click li.type-dir .dir-name a':                   'dirOpen',
		},

		initialize: function() {
			
			this.get_path = new media.view.ThemeDirFiles({
				controller: this.controller,
				model:      this.model,
			}).render();
			this.views.add([ this.get_path ]);

		},

		dirOpen: function( event ) {
			
			var ToElement = $(event.target).parent().parent().parent();

			$(event.target).parent().parent().addClass('selected');
			$(event.target).replaceWith("<b>"+event.target.text+"</b>");

			this.model.set('searchDir' , event.target.title );

			this.get_path = new media.view.ThemeDirFiles({
				controller: this.controller,
				model:      this.model,
			}).render().el;
			ToElement.append( this.get_path );
			
			return false;
		},

		toggleSelection: function( event ) {
			var clickClass = $(event.target).attr('class');
			var imgTag = "";
			var targetID = "";
			var SepalateTag = '_%-%_';
			var SelectedClass = 'details';
			var LI = "";
			
			if( !clickClass ) {
				imgTag = $(event.target);
				LI = $(event.target).parent().parent().parent().parent();
			} else if( clickClass == 'thumbnail' ) {
				imgTag = $(event.target).children(".centerd").children("img");
				LI = $(event.target).parent().parent();
			} else if( clickClass == 'centerd' ) {
				imgTag = $(event.target).children("img");
				LI = $(event.target).parent().parent().parent();
			} else if( clickClass == 'media-modal-icon' ) {
				LI = $(event.target).parent().parent().parent();
			} else if( clickClass == 'check' ) {
				LI = $(event.target).parent().parent();
			}
			
			if( LI.hasClass( SelectedClass )) {

				this.unSelected( SelectedClass );

			} else {

				this.unSelected( SelectedClass );
				LI.addClass( SelectedClass );
				
				var File = imgTag.attr("id").split( SepalateTag );
				this.model.set( 'url' , imgTag.attr("src") );
				this.model.set( 'fileSelected' , true );
				this.model.set( 'filePath' , File[0] );
				this.model.set( 'fileName' , File[1] );

			}
			
			return false;
		},

		unSelected: function( SelectedClass ) {
			var fileTag = $("li.theme-dir-file.type-file.details" , ".theme-dir-all-files");
			fileTag.removeClass( SelectedClass );
			this.model.set( 'url' ,'' );
			this.model.set( 'fileSelected' , false );
			this.model.set( 'filePath' , '' );
			this.model.set( 'fileName' , '' );
		},

	});





	/**
	 * media.view.ThemeDirFiles
	 */
	media.view.ThemeDirFiles = media.view.Settings.extend({

		tagName:   'ul',
		className: 'theme-dir-files',

		initialize: function() {
			this.views.add( new media.view.Spinner().render() );
			this.filesload();
		},

		filesload: function() {
			var action = 'get_theme_dir_files';
			var dir = this.model.get('searchDir');
			var current = this;
			
			var fileload = $.post( ajaxurl, { action: action, dir: dir, miftd_field: miftd_local.nonces.v } );
			fileload.done(function( data ) {
				current.$el.children(".spinner").remove();
				
				if( data.success ) {

					var files = data.data;

					_.each( files, function( path ) {

						if( path.type == 'file' && path.filename == null )
							return;
						if( path.type == 'dir' && path.dirname == null )
							return;

						var renderFile = new media.view.ThemeDirPath({
							model: current.model,
							controller: current.controller,
							path: path
						}).render().el;
						current.$el.append( renderFile );

					}, this);

				} else {

					var error = 'No file.';
					if( data.data ) {
						error = data.data;
					}
					current.$el.append( $("<li/>", { 'class': 'errorText' , 'text': error } ) );

				}
				
			});
		},

	});




	/**
	 * media.view.ThemeDirPath
	 */
	media.view.ThemeDirPath = media.view.Settings.extend({

		tagName:   'li',
		className: 'theme-dir-file',
		template:  media.template('theme-dir-file'),

		initialize: function() {
			this.$el.addClass( 'type-' + this.options.path.type );
		},

	});




	/**
	 * wp.media.view.ThemeDirFile.Details
	 */
	media.view.ThemeDirFileDetails = media.view.Settings.extend({

		tagName:   'div',
		className: 'theme-dir-file-details',
		template:  media.template('theme-dir-file-details'),
		
		initialize: function() {
			media.view.Settings.AttachmentDisplay.prototype.initialize.apply( this, arguments );
			var fineName = this.model.get( 'fileName' );
			var filePath = this.model.get( 'filePath' );
			var url = this.model.get( 'url' );
			var width = this.model.get( 'width' );
			var height = this.model.get( 'height' );
			this.options.file = {
				fileName: fineName,
				filePath: filePath,
				pathFile: filePath + fineName,
				url: url,
				width: width,
				height: height,
			};
		},

	});




	/**
	 * wp.media.view.Spinner
	 */
	media.view.Spinner = media.View.extend({
		tagName:   'span',
		className: 'spinner',
	});




	/**
	 * media.view.ThemeDirDonateNag
	 */
	media.view.ThemeDirDonateNag = media.View.extend({
		tagName:   'div',
		className: 'theme-dir-plugin-about',
		template:  media.template('theme-dir-plugin'),
	});




	/**
	 * ========================================================================
	 * EDITOR
	 * ========================================================================
	 */




	/**
	 * wp.media.editor.add
	 */

	media.editor.add('content').state('theme-dir').on( 'select', function( id, options) {

		var file = this.props.toJSON();

		_.defaults( file, {
			title:   file.fileName,
			linkUrl: '',
			align:   'none',
			link:    'none'
		});

		if ( 'none' === file.link )
			file.linkUrl = '';
		else if ( 'file' === file.link )
			file.linkUrl = file.url;
			
		media.editor.insert( wp.media.string.image( file ) );

	});




}(jQuery));
