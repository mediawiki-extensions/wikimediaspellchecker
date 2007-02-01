Changes in 0.1 (feb 1, 2007):
  * now supports newer mw versions instead of just old ones
  * fixed background color of edit box in spellcheck mode
  * simpler installation - no changes are needed to core mw code
  * updated documentation

Partial list of changes from scijax in initial svn upload (sep 2006):

  * spellcheck button now shows up in the column of buttons instead of next to the last button
  * spellcheck div shows up approximately in the right place instead of way over to the side
  * words that appear at the beginning of the textbox and the end of the textbox are no longer ignored
  * the word 'filter' and other words that are also functions of javascript Arrays are spellchecked correctly
  * fixed return to edit mode in IE (used to get rid of new lines)
  * improved reporting of ajax errors
  * instead of searching the entire text box every time a misspelt word is found, only search the part that hasn't been searched yet - huge speed improvement for large wiki entries

  * New Replace All feature
  * added a service that allows existing Add Word To Dictionary feature to actually do something
  * some servers need the data and dict aspell directories specified in php, there are now settings for these variables in LocalSettings.php

  * words with underscores are no longer broken up