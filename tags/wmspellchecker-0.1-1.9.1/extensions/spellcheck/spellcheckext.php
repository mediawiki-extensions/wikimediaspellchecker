<?php
# Example WikiMedia extension
# with WikiMedia's extension mechanism it is possible to define
# new tags of the form
# <TAGNAME> some text </TAGNAME>
# the function registered by the extension gets the text between the
# tags as input and can transform it into arbitrary HTML code.
# Note: The output is not interpreted as WikiText but directly
#       included in the HTML output. So Wiki markup is not supported.
# To activate the extension, include it from your LocalSettings.php
# with: include("extensions/YourExtensionName.php");

$wgExtensionFunctions[] = "wfServerSpellcheckExtension";

$wgExtensionCredits['other'][] = array(
					     'name' => 'SCIJAX Spell Check Improved',
					     'author' => '<nowiki>http://code.google.com/p/wikimediaspellchecker/</nowiki>',
					     'version' => 'v1.0'
					     );

function wfServerSpellcheckExtension() {
  global $wgHooks;
#  $wgHooks['EditPageToolbar'][] = 'addSpellTool';
  $wgHooks['BeforePageDisplay'][] = 'addSpellCss';
}

function addSpellCss(&$out) {
  global $wgScriptPath;
  $out->addScript("\n" . '<link rel="stylesheet" type="text/css" href="' .
    $wgScriptPath . '/extensions/spellcheck/spellcheck.css"' . " />");
  $out->addScript("\n         <script type='text/javascript' src='" .
    $wgScriptPath . '/extensions/spellcheck/addspellcheck.js' . "'></script>");
  $out->addScript("\n         <script type='text/javascript' src='" .
    $wgScriptPath . '/extensions/spellcheck/spellcheck.js' . "'></script>");
}

function addSpellTool( &$toolbar ) {
  global $wgStylePath, $wgOut;

  $toolbar.="
  var inspellcheck = 0;
  function checkSpelling() {
    if( inspellcheck ) {
      document.getElementById('button_spell').src = '".$wgStylePath."/common/images/button_spell.png';
      document.getElementById('wpSave').style.visibility = '';
      document.getElementById('wpPreview').style.visibility = '';
      doReturnToEdit(document.getElementById('editform').elements['wpTextbox1']);
      inspellcheck = 0;
    } else {
      document.getElementById('button_spell').src = '".$wgStylePath."/common/images/button_spell_done.png';
      document.getElementById('wpSave').style.visibility = 'hidden';
      document.getElementById('wpPreview').style.visibility = 'hidden';
      doSpellCheck(document.getElementById('editform').elements['wpTextbox1']);
      inspellcheck = 1;
    }
  }
  document.writeln(\"<a href='javascript:checkSpelling()'>".
  "<img id='button_spell' class='toolbutton' width='23' height='22' title='spellcheck' alt='Spelling' ".
  "src='".$wgStylePath."/common/images/button_spell.png' /></a>\");";
  $wgOut->addHTML( "<script language='javascript' src='extensions/spellcheck/spellcheck.js'></script>\n" );
}

# only want this code to execute when the php is called as a service
# not when the above extension functions are included
if( !defined( 'MEDIAWIKI' ) ) {
 # have to define MEDIAWIKI in order for the include of LocalSettings to work
  define( 'MEDIAWIKI', true );
	include_once("../../LocalSettings.php");
  header('Content-Type: text/xml');
  
  if( isset($_POST["document"]) )
    $document = $_POST["document"];
#    error_log(print_r($_POST, true));
  if( get_magic_quotes_gpc() )
    $document = stripslashes( $document );
  $words = split( " ", $document );
  $pspell_config = pspell_config_create("en");
  global $personalDictionaryLocation, $pspell_data_dir, $pspell_dict_dir;
  pspell_config_personal($pspell_config, $personalDictionaryLocation);
  if (strcmp($pspell_data_dir, "") != 0 ) {
  	pspell_config_data_dir($pspell_config, $pspell_data_dir);
  	error_log("setting the spellcheck data dir to " . $pspell_data_dir);
  }
  if (strcmp($pspell_dict_dir, "") != 0 )
  	pspell_config_dict_dir($pspell_config, $pspell_dict_dir);
  $pspell_link = pspell_new_config($pspell_config);

  $words = array_unique($words);
  $ret = "";
  foreach( $words as $word ) {
    if( !is_numeric( $word ) && !pspell_check( $pspell_link, $word ) ) {
      $suggestions = pspell_suggest($pspell_link, "$word");
      $formattedSuggestion = '';
      foreach( $suggestions as $suggestion )
	$formattedSuggestion .= "<suggest>$suggestion</suggest>";

      $ret .= "<suggestion><word>$word</word>" . $formattedSuggestion . "</suggestion>";
    }
  }

  $xmlFile =  "<spellcheck>" . $ret . "</spellcheck>";
#error_log($xmlFile);
  print $xmlFile;
}
?>
