<?php
/*
Plugin Name: Media Insert from Themes Dir
Description: This plugin allows you to insert a picture of the theme directory. After activated, available immediately from the "Media Insert".
Plugin URI: http://wordpress.org/extend/plugins/media-insert-from-themes-dir/
Version: 1.1
Author: gqevu6bsiz
Author URI: http://gqevu6bsiz.chicappa.jp/?utm_source=use_plugin&utm_medium=list&utm_content=miftd&utm_campaign=1_1
Text Domain: miftd
Domain Path: /languages
*/

/*  Copyright 2012 gqevu6bsiz (email : gqevu6bsiz@gmail.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as
	published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/



class Media_Insert_from_Themes_Dir
{

	var $Ver,
		$Name,
		$Dir,
		$Url,
		$Site,
		$AuthorUrl,
		$ltd,
		$ltd_p,
		$PluginSlug,
		$Nonces,
		$Schema;


	function __construct() {
		$this->Ver = '1.1';
		$this->Name = 'Media Insert from Themes Dir';
		$this->Dir = plugin_dir_path( __FILE__ );
		$this->Url = plugin_dir_url( __FILE__ );
		$this->Site = 'http://gqevu6bsiz.chicappa.jp/';
		$this->AuthorUrl = 'http://gqevu6bsiz.chicappa.jp/';
		$this->ltd = 'miftd';
		$this->ltd_p = $this->ltd . '_plugin';
		$this->PluginSlug = dirname( plugin_basename( __FILE__ ) );
		$this->Nonces = array( "value" => $this->ltd . '_value' , "field" => $this->ltd . '_field' );
		$this->Schema = is_ssl() ? 'https://' : 'http://';
		
		$this->PluginSetup();
		add_action( 'admin_init' , array( $this , 'FilterStart' ) );
	}





	// PluginSetup
	function PluginSetup() {
		// load text domain
		load_plugin_textdomain( $this->ltd , false , $this->PluginSlug . '/languages' );
		load_plugin_textdomain( $this->ltd_p , false , $this->PluginSlug . '/languages' );

		// plugin links
		add_filter( 'plugin_action_links' , array( $this , 'plugin_action_links' ) , 10 , 2 );
		
		add_action( 'wp_ajax_get_theme_dir_files' , array( $this , 'get_theme_dir_files' ) );
	}

	// PluginSetup
	function plugin_action_links( $links , $file ) {
		if( plugin_basename(__FILE__) == $file ) {
			$support_link = '<a href="http://wordpress.org/support/plugin/' . $this->PluginSlug . '" target="_blank">' . __( 'Support Forums' ) . '</a>';
			array_unshift( $links , $support_link );
		}
		return $links;
	}



	// SetList
	function get_theme_dir_files() {

		check_admin_referer( $this->Nonces["value"] , $this->Nonces["field"] );

		$load_dir = "";
		if( !empty( $_POST["dir"] ) ) {
			$load_dir = strip_tags( $_POST["dir"] );
		}
		
		if( empty( $load_dir ) )
			wp_send_json_error( __( 'Not possible to read the theme directory.' , $this->ltd ) );
		
		$AllPath = $this->path_list( $load_dir );

		if( empty( $AllPath ) ) {
			
			wp_send_json_error( __( 'Files and directories can not be found.' , $this->ltd ) );
			
		} else {
			
			$path_list = $this->theme_dir_files_format( $AllPath );
			
			wp_send_json_success( $path_list );
			
		}
		
		wp_die();
	}

	// SetList
	function path_list( $load_dir ) {

		$extensions = array( 'png' , 'jpg' , 'gif' );
		$SearchDir = get_stylesheet_directory() . $load_dir;
		$AllPath = scandir( $SearchDir );
		
		$Path_list = array();
		foreach( $AllPath as $k => $path ) {
			if ( '.' == $path or '..' == $path )
				continue;

			if( $load_dir == '/' ) {
				$current_path = $load_dir . $path;
			} else {
				$current_path = $load_dir . '/' . $path;
			}

			if ( is_dir( $SearchDir . '/' . $path ) ) {

				if( $path == 'CVS' )
					continue;

					if( $load_dir == '/' ) {
						$current_path = $load_dir . $path;
					} else {
						$current_path = $load_dir . '/' . $path;
					}
					$Path_list["dir"][$path] = $current_path;

			} elseif ( ! $extensions || preg_match( '/\.'.implode( '|', $extensions ).'$/', $path ) ) {

				$Path_list["file"][$path] = $current_path;

			}
		}
		
		if( !empty( $Path_list["file"] ) ) {
			natcasesort($Path_list["file"]);
		}
		if( !empty( $Path_list["dir"] ) ) {
			natcasesort($Path_list["dir"]);
		}

		return $Path_list;

	}

	// SetList
	function theme_dir_files_format( $AllPath ) {

		$path_list = array();
		
		if( !empty( $AllPath["file"] ) ) {
			foreach( $AllPath["file"] as $file_name => $file_path ) {
				$path_list[] = array( "type" => "file" , "filename" => $file_name , "filepath" => $file_path , "path" => str_replace( $file_name , '' , $file_path ) , "url" => get_stylesheet_directory_uri() . $file_path );
			}
		}
		
		if( !empty( $AllPath["dir"] ) ) {
			foreach( $AllPath["dir"] as $dir_name => $dir_path ) {
				$path_list[] = array( "type" => "dir" , "dirname" => $dir_name , "dirpath" => $dir_path , "path" => str_replace( $dir_name , '' , $dir_path ) , "url" => get_stylesheet_directory_uri() . $dir_path );
			}
		}

		return $path_list;
	}



	// FilterStart
	function FilterStart() {
		add_action( 'media_view_strings' , array( $this , 'media_view_strings' ) );
		add_action( 'print_media_templates' , array( $this , 'print_media_templates') );
	}

	// FilterStart
	function media_view_strings( $strings ) {
		$strings["InsertfromThemesDirectory"] = __( 'Insert from Themes Directory' , $this->ltd );
		return $strings;
	}

	// FilterStart
	function print_media_templates() {

		$current_theme = wp_get_theme();

		wp_enqueue_style( $this->PluginSlug , $this->Url . $this->PluginSlug . '.css' );
		wp_enqueue_script( $this->PluginSlug , $this->Url . $this->PluginSlug . '.js' , array( 'jquery' , 'media-upload' ) , $this->Ver , true );
		$Localize = array( "nonces" => array( "field" => $this->Nonces["field"] , "v" => wp_create_nonce( $this->Nonces["value"] ) ) );
		wp_localize_script( $this->PluginSlug , $this->ltd . '_local' , $Localize );

?>

<script type="text/html" id="tmpl-theme-dir-title">
<h3>
	<?php _e( 'Current Theme' ); ?> : <?php echo $current_theme->display( 'Name' ); ?>
	<span class="description">/wp-content/themes/<?php echo $current_theme->get_stylesheet(); ?>/</span>
</h3>
</script>

<script type="text/html" id="tmpl-theme-dir-file">
<div class="theme-dir-file-preview">
	<# if ( data.path.type == "file" ) { #>
		<div class="thumbnail">
			<div class="centerd">
				<img src="{{ data.path.url }}" id="{{ data.path.path }}_%-%_{{ data.path.filename }}" draggable="false" />
			</div>
		</div>
		<a class="check" href="#" title="<?php _e('Deselect'); ?>"><div class="media-modal-icon"></div></a>
	<# } else { #>
		<div class="icon"><br /></div>
		<div class="dir-name">
			<a href="#" id="{{ data.path.path }}_%-%_{{ data.path.dirname }}" title="{{ data.path.dirpath }}">{{ data.path.dirpath }}</a>
		</div>
	<# } #>
</div>
</script>

<script type="text/html" id="tmpl-theme-dir-file-details">
<h3><?php _e('Attachment Details'); ?></h3>
<div class="theme-dir-file-info">
	<div class="thumbnail">
		<img src="{{ data.file.url }}" draggable="false" />
	</div>
	<div class="detalis">
		<div class="filename">{{ data.file.fileName }}</div>
		<div class="dimensions">{{ data.file.width }} &times; {{ data.file.height }}</div>
	</div>
</div>

<?php if ( ! apply_filters( 'disable_captions', '' ) ) : ?>
	<label class="setting caption">
		<span><?php _e('Caption'); ?></span>
		<textarea data-setting="caption" />
	</label>
<?php endif; ?>

<label class="setting alt-text">
	<span><?php _e('Alt Text'); ?></span>
	<input type="text" data-setting="alt" />
</label>

<div class="clear"></div>
<h3><?php _e('Attachment Display Settings'); ?></h3>
<label class="setting">
	<span><?php _e('Alignment'); ?></span>
	<select class="alignment" data-setting="align">
		<option value="left">
			<?php esc_attr_e('Left'); ?>
		</option>
		<option value="center">
			<?php esc_attr_e('Center'); ?>
		</option>
		<option value="right">
			<?php esc_attr_e('Right'); ?>
		</option>
		<option value="none" selected>
			<?php esc_attr_e('None'); ?>
		</option>
	</select>
</label>
<div class="setting">
	<label>
		<span><?php _e('Link To'); ?></span>
		<select class="link-to" data-setting="link">
			<option value="custom">
				<?php esc_attr_e('Custom URL'); ?>
			</option>
			<option value="file">
				<?php esc_attr_e('Media File'); ?>
			</option>
			<option value="none">
				<?php esc_attr_e('None'); ?>
			</option>
		</select>
	</label>
	<input type="text" class="link-to-custom" data-setting="linkUrl" />
</div>
</script>

<script type="text/html" id="tmpl-theme-dir-plugin">
<p class="donate_nag">
	<strong>
		<a href="<?php echo $this->AuthorUrl ?>please-donation/?utm_source=use_plugin&utm_medium=donate&utm_content=<?php echo $this->ltd; ?>&utm_campaign=<?php echo str_replace( '.' , '_' , $this->Ver );?>">
			<?php _e( 'Thank you for considering donate.' , $this->ltd_p ); ?>
		</a>
	</strong>
</p>
<p class="developer">
	<img src="<?php echo $this->Schema; ?>www.gravatar.com/avatar/7e05137c5a859aa987a809190b979ed4?s=16" width="16" />
	<span>
		Plugin developer : <a href="<?php echo $this->AuthorUrl; ?>?utm_source=use_plugin&utm_medium=footer&utm_content=<?php echo $this->ltd; ?>&utm_campaign=<?php echo str_replace( '.' , '_' , $this->Ver ); ?>" target="_blank">gqevu6bsiz</a>
	</span>
</p>
</script>
<?php

	}

}
$miftd = new Media_Insert_from_Themes_Dir();


