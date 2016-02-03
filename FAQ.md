Q: Why doesn't adding words to the custom dictionary work?

  * Make sure the extensions/spellcheck/added\_words.txt file is writable by the webserver user.  You can always use chmod 666 added\_words.txt as a sledgehammer.


Q: Does this support mediawiki version 1.6.x ?

  * I don't know.  I bet the 1.5.2 version does.  Please let me know and I'll update the docs.


Q: Adding words with numbers to the custom dictionary doesn't work.  Why not?

  * aspell doesn't support words with numbers in them by default.  I don't see any way to set the validate-words flag through the php api.


Q: Are there any known issues?

  * You can't add words with an underscore or digits to the dictionary
  * Tab handling is funky

Q: Why would I use this extension instead of a browser-based spellchecker or an online service?

  * each wiki can have its own custom dictionary
  * you have no outside internet access
  * users of your wiki are required to use older browsers