<?php
/*
 * Created on Sep 7, 2006
 */

# only want this code to execute when the php is called as a service
# not when the above extension functions are included
if( !defined( 'MEDIAWIKI' ) ) {
 # have to define MEDIAWIKI in order for the include of LocalSettings to work
  $mycwd = getcwd();
  chdir("../..");
  require_once( 'includes/WebStart.php' );
  require_once( "includes/Wiki.php" );
  chdir($mycwd);
  # define( 'MEDIAWIKI', true );
  # include_once("../../LocalSettings.php");
  header('Content-Type: text/xml');

  if( isset($_POST["word"]) )
    $word = $_POST["word"];
#  error_log("words is " . $word . ".");
  if( get_magic_quotes_gpc() )
    $word = stripslashes( $word );
  
    # myLog(" **- user: " . $wgUser->getName());
    # myLog(" **- language: " . $wgUser->getOption( 'language' ));


  $spellcheckext_language = "" . $wgUser->getOption( 'language' );
  $pspell_config = pspell_config_create($spellcheckext_language);
  global $personalDictionaryLocation, $pspell_data_dir, $pspell_dict_dir;
  pspell_config_personal($pspell_config, 
                         $personalDictionaryLocation
                         . "_" . $spellcheckext_language
     );
  if (strcmp($pspell_data_dir, "") != 0 )
  	pspell_config_data_dir($pspell_config, $pspell_data_dir);
  if (strcmp($pspell_dict_dir, "") != 0 )
  	pspell_config_dict_dir($pspell_config, $pspell_dict_dir);
  $pspell_link = pspell_new_config($pspell_config);
  
  // $word might have to be checked more carefully since it comes from the user.
  // I am counting on pspell to sanitize it
  $ret = "add return value is " . pspell_add_to_personal($pspell_link, $word);
  $ret .= " save retval is " . pspell_save_wordlist($pspell_link);
  
  $xmlFile =  "<spellcheck>" . $ret . "</spellcheck>";
  error_log($xmlFile);
  print $xmlFile;
}
?>
