var req;
var spellCheckURL = "extensions/spellcheck/spellcheckext.php";
var addToDictionaryURL = "extensions/spellcheck/addToDictionaryProxy.php";

//	document.write('<script type="text/javascript" src="http://buttercup.spellingcow.com/spell/scayt"></script>');

var wordBoundaryRegEx = "'*[^a-z'_0-9]'*";
function loadXMLDoc(url,postData,async)// set async to false for synchronous 
{
	// branch for native XMLHttpRequest object
	if (window.XMLHttpRequest) {
		req = new XMLHttpRequest();
		req.open("POST", url, async);
		req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		req.send(postData);
	// branch for IE/Windows ActiveX version
	}
	else if (window.ActiveXObject) {
		req = new ActiveXObject("Microsoft.XMLHTTP");
		if (req) {
			req.open("POST", url, async);
			req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			req.send(postData);
		}
	}
	return req;
}
// takes the xml from the spellcheckext service and turns it into an associative array
// the key is the misspelt word and the value is an array of suggestions
function process_spellcheck_response( req)
{
	try
	{
		// originally this was Array(), but then the word filter got tagged as misspelt
		// because there is a filter(var) function in every Array
		var suggestedWords = Object();
		if (!((req.responseXML != null) && req.responseXML.documentElement))
		{
			throw "Error -- process_spellcheck_response -- response is not defined " + req.responseText;
		}
		var response = req.responseXML.documentElement;
		var suggestions = response.getElementsByTagName('suggestion');
		for(var i = 0 ; i < suggestions.length; i++)
		{
			var word = suggestions[i].getElementsByTagName('word')[0].firstChild.data;
			var suggestedWordsXML = suggestions[i].getElementsByTagName('suggest');
			// Build into flat array
			suggestedWordsArray = Array();
			for(var j=0; j< suggestedWordsXML.length; j++)
			{
				suggestedWordsArray[suggestedWordsArray.length] = suggestedWordsXML[j].firstChild.data;
			}
			suggestedWords[word] = suggestedWordsArray;
		}
	}
	catch ( e )
	{
		throw "Error in process_spellcheck_response -- " + e.message + ' ' + e.toString() ;
	}
	return suggestedWords;
}
var g_suggestedWords;
// originalString is from the textbox
// this function replaces misspelled words from the textbox with html that lets the user pick a suggestion
// or add the word to the dictionary, etc
function spellcheck(originalString, suggestedWords)
{
	// this function goes through all the words in the originalString,
	// looks to see if there is a suggestion for that word, and if so,
	// replaces it with some html
	
	g_suggestedWords = suggestedWords;
	
	// check for [[ ]], but not [[[ ]]]
		// it's not perfect, but should catch most stuff
//	var tokenizer = /(\{.*?\})|(\&lt;.*?\&gt;)|(\[\[.*?\]\])|(\[.*?\])|(\b.+?\b)/;

	// I decided that we did want to spellcheck stuff in between <> and () etc
		// so we use this simple tokenizer instead
	var tokenizer = /\b(.+?)\b/;
	// 1 is {}
	// 2 is <>
	// 3 is [[ ]]
	// 4 is [ ]
	// 5 is a word
	var the_str = originalString;
	var arr = tokenizer.exec(the_str, "i");
	var rightContext = RegExp.rightContext;
	
	var i = 0;
	while (arr != null) {
		i++;
		
		var word = arr[1];
//		alert("next word is " + word);
		// readies for next time
		arr = tokenizer.exec(rightContext);
		// we only need to search to the right of the word
		// that we just found
		// originally the string was searched from the beginning each time
		rightContext = RegExp.rightContext;
		
		if (suggestedWords[word])
		{
			originalString = makeWordClickable(word, i, originalString)
		}
	}
	// reset for next time someone does a spell check
	g_lengthAlreadySearched = 0;
	return "<div style='bgcolor:#0000FF' onmousedown='hideSuggestions()'>" + originalString + "</div>";
}

var g_lengthAlreadySearched = 0;
function makeWordClickable(word, i, originalString) {
	// alert("word = " + word + " i = " + i + " originalString = " + originalString);
	var end = "([^a-z0-9_<])";
	var begin = "([^a-z0-9_>])";
	// we add the checks for > and < to make sure we haven't already changed that word.
	var regex = new RegExp("^" + word + end + "|" + begin + word + end +
	"|" + begin + word + "$|^(" + word + ")$", "i");
	// 1 is end delimiter of word at beginning of string
	// 2 is start of word in the middle
	// 3 is end of word in middle
	// 4 start of word at the end
	// 5 word - where the word is the only thing in the box
	
	// similar to above, we only need to search words to the right of where we already searched
	// but we need to modify the original string, not a copy of it
	var alreadySearched =originalString.substring(0, g_lengthAlreadySearched);
	var toBeSearched = originalString.substring(g_lengthAlreadySearched);
//	alert ("alreadySearched = " + alreadySearched);
//	alert("toBeSearched = " + toBeSearched);
	var regexArray = regex.exec(toBeSearched);
	// update length of the string already searched
	// we could do slightly better and also update g_lengthAlreadySearched to account for the
	// html we add, but this is pretty good, with speed improvements of 3x compared with
	// searching the whole string every time
	g_lengthAlreadySearched += regexArray.index;
	if (regexArray == null) {
		alert("internal error, regexArray was null");
	}
	else {
		// if firefox doesn't match, it is null, but IE is "", so we have to check for both
		if (regexArray[1] != null && regexArray[1] != "") {
			// match at the beginning of the textbox
			toBeSearched = toBeSearched.replace(regex, formatSuggestion(i, word) + regexArray[1] );
		}
		else if (regexArray[2] != null && regexArray[2] != "") {
			if (regexArray[3] == null || regexArray[3] == "")
				alert ("internal error, regexArray[3] was null");
			toBeSearched = toBeSearched.replace(regex, regexArray[2] + formatSuggestion(i, word) + regexArray[3] );
		}
		else if (regexArray[4] != null && regexArray[4] != "") {
			toBeSearched = toBeSearched.replace(regex, regexArray[4] + formatSuggestion(i, word));
		}
		else if (regexArray[5] != null && regexArray[5] != "")
			toBeSearched = toBeSearched.replace(regex, formatSuggestion(i, word));
		else {
			alert("internal error, nothing matched");
			alert("regexArray[0] = " + regexArray[0]);
		}
	}
//			alert ("now alreadySearched = " + alreadySearched );
//			alert ("now toBeSearched = " + toBeSearched);
	return alreadySearched + toBeSearched;
}

// This maps a word to all Misspelt objects in the document that used that word
// This is used when a user adds a word to a dictionary so it can update all occurences
var g_wordToObjArrays = Array();
var badWords = Array();
function formatSuggestion(uniqId, badWord)
{
	var newId = badWords.length;
	badWords[newId] = badWord;
	lowerCaseBadWord = badWord.toLowerCase();
	if (!g_wordToObjArrays[lowerCaseBadWord])
	{
		g_wordToObjArrays[lowerCaseBadWord] = Array();
	}
	g_wordToObjArrays[lowerCaseBadWord][g_wordToObjArrays[lowerCaseBadWord].length] = uniqId;
	
	return "<span class='MisspeltWord' id='" + uniqId + "' onclick=javascript:showSuggestions(\"" + newId + "\",this);>"+ badWord +"</span>";
}

var g_suggestionPopup = null;
var g_parentOfSuggestion = null;
function hideSuggestions()
{
	if (g_suggestionPopup && g_parentOfSuggestion)
	{
		g_parentOfSuggestion.removeChild(g_suggestionPopup);
		g_parentOfSuggestion = null; 
		g_suggestionPopup = null;
	}
}

function showSuggestions(badWordId, link)
{
	var badWord = badWords[badWordId];
	var left = link.offsetLeft + g_spellCheckDiv.offsetLeft - g_spellCheckDiv.scrollLeft;
	var top = link.offsetTop + link.offsetHeight + 5 + g_spellCheckDiv.offsetTop - g_spellCheckDiv.scrollTop;

	var suggestions = document.createElement('span');
	for(var i=0; i<g_suggestedWords[badWord].length; i++)
	{	
		createSuggestionSpan(new Function ("changeWord('" + link.id + "', \"" + g_suggestedWords[badWord][i] + "\")"),
			g_suggestedWords[badWord][i],suggestions,
			new Function ("changeAll('" + link.id + "', \"" + g_suggestedWords[badWord][i] + "\")")
		);
	}
	
// the UI for this sucks so I disabled it - DG
//			createSuggestionSpan( new Function ("editWord('" + link.id + "');"), "edit...", suggestions); 
	createSuggestionSpan(new Function("addToDictionary('" +link.id + "',\"" + badWord + "\");") , "Add&nbsp;word&nbsp;to dictionary", suggestions, null);
	
	var div = document.createElement('div');
	div.style.position = 'absolute'; 
	div.style.left = left +'px';
	div.style.top = top + 'px';
	div.style.border = '1px solid black';
	div.style.backgroundColor = '#ccFFcc';
	div.style.zIndex=99999999;
	
	div.appendChild(suggestions); 
	
	g_spellCheckDivContainer.appendChild(div);
	g_suggestionPopup = div;
	g_parentOfSuggestion = g_spellCheckDivContainer; 
}

function getElementsByClassName(oElm, strTagName, strClassName) {
	var arrElements = (strTagName == "*" && oElm.all)? oElm.all : oElm.getElementsByTagName(strTagName);
	var arrReturnElements = new Array();
	strClassName = strClassName.replace(/\-/g, "\\-");
	var oRegExp = new RegExp("(^|\\s)" + strClassName + "(\\s|$)");
	var oElement;
	for(var i=0; i<arrElements.length; i++){
		oElement = arrElements[i];		
		if(oRegExp.test(oElement.className)){
			arrReturnElements.push(oElement);
		}
	}
	return (arrReturnElements)
}

// there is some potential for speed improvements here
// instead of getting all the elements in the page and then looking to see if
// they are of the right class, we could use g_wordToObjArrays, but
// then there are some case issues (if we are to replace doggs with dogs,
// should we also replace Doggs?  if so, with Dogs or dogs?  I don't know,
// so now we don't replace words that only differ by case)
function changeAll(id, newWord) {
	// we want to get the original badWord this way instead of having it passed in
	// in case the user changes an individual word
	var badWord = document.getElementById(id).innerHTML;
	// calling changeWord handles stopping the suggestions
	changeWord(id, newWord);
	// we need to get the word that was just clicked on
	// it may not be "bad" anymore, if it was corrected once already
	var words = getElementsByClassName(document, "*", "MisspeltWord");
	for (var i = 0; i < words.length; i++) {
		if (words[i].innerHTML == badWord) {
			words[i].innerHTML = newWord;
			words[i].className = "CorrectedWord";
		}
	}
}

function createSuggestionSpan(onclickFunction, innerHtmlValue, parentNode, allFunction)
{
	var divBackgroundColor = "#ccFFcc";
	var divHighlightColor = "#FF0000";
	
	span = document.createElement('span');
	span.onclick = onclickFunction
	span.className = "suggestDiv";
	span.onmouseover = new Function("this.className = 'suggestDiv-hover';" );
	span.onmouseout = new Function("this.className = 'suggestDiv';" );
	span.innerHTML = innerHtmlValue
	span.name=innerHtmlValue;
	parentNode.appendChild(span);
	
	if (allFunction != null) {
		var dividerSpan = document.createElement('span');
		dividerSpan.innerHTML = "&nbsp;||&nbsp;";
		// this check is for IE, which gets rid of spacing in innerHTML
		// firefox doesn't have an innerText
//		if (dividerSpan.innerText)
//			dividerSpan.innerText = " || ";
		dividerSpan.className = "suggestDiv";
		dividerSpan.style.cursor = "auto";
		parentNode.appendChild(dividerSpan);
		
		var allSpan = document.createElement('span');
		allSpan.onclick = allFunction
		allSpan.className = "suggestDiv";
		allSpan.onmouseover = new Function("this.className = 'suggestDiv-hover';" );
		allSpan.onmouseout = new Function("this.className = 'suggestDiv';" );
		allSpan.innerHTML = "All";
		
		parentNode.appendChild(allSpan);
	}
	
	parentNode.appendChild(document.createElement('br'));	
}
function highlight(obj,color)
{
	obj.style.backgroundColor = color;
}
function changeWord(id,newWord)
{
	hideSuggestions();
	obj = document.getElementById(id);
	obj.innerHTML = newWord;
	obj.className = "CorrectedWord";
}
function addToDictionary(id, word)
{
	hideSuggestions();
	// We are going to use GET, not post
	loadXMLDoc(addToDictionaryURL, "word="+word, "" ,true); //calling it synchronously
	obj = document.getElementById(id);
	obj.className = "CorrectedWord"; 
	lowerCaseWord = word.toLowerCase();
	for(k in g_wordToObjArrays[lowerCaseWord])
	{
		document.getElementById(g_wordToObjArrays[lowerCaseWord][k]).className = "CorrectedWord";	
	}
}

function editWord(id)
{
	hideSuggestions();
	var editObject = document.getElementById(id);
	
	var span = document.createElement('span');
	
	var input = document.createElement('input');
	input.type = 'text';
	input.style.width = "80px";
	input.value = editObject.innerHTML;
	//input.setAttribute('onchange','changeWord("' + id +'",this.value);');  
	input.onchange = Function ('changeWord("' + id +'",this.value);');  //IE doesn't support setAttribute

	span.appendChild(input);

	var container = editObject.parentNode;
	container.insertBefore(span,editObject);
	
	// Keep it around, when the editBox is changed we update the value here.
	// That way the code to "ReturnToEdit" doesn't have to change
	editObject.style.visibility = "hidden";	
	editObject.style.height = 0;
	editObject.style.width = 0;

	input.focus();
}

function escapeForSpellCheck(str)
{
	var checkSpelling = str;

	// ignore braces
//			var regex = /\{.*?\}/g;
//			checkSpelling = checkSpelling.replace(regex," ");
	
	// ignore brackets
//			var regex = /\[.*?\]/g;
//			checkSpelling = checkSpelling.replace(regex," ");
	
	//Ignore HTML tags
	var regex = /<.*?>/g;
	checkSpelling = checkSpelling.replace(regex," ");

	var regex = new RegExp(wordBoundaryRegEx,"gi");
	checkSpelling = checkSpelling.replace(regex," ");
	
	regex = /[\n\r]/gi;
	checkSpelling = checkSpelling.replace(regex," ");

	checkSpelling = escape(checkSpelling);

	return checkSpelling;
}

function unescapeForSpellCheck(str, isIE)
{
	var checkSpelling = str;

	// IE's innerHTML blows away line endings so we have to add them back here
	// it also, for some reason adds an extra line on top
		// the second regex handles that
	// IE also adds a space to the end of some lines, but I am just going to leave that there
	if (isIE) {
		var regex = /<BR>/gi;
		checkSpelling = checkSpelling.replace(regex,"\n");
		
		var regex = /^.*?\n/;
		if (checkSpelling.match(regex))
		checkSpelling = checkSpelling.replace(regex,"");
	}
	
	// Get rid of all the DHTML that we added.
	var regex = /<.*?>/gi;
	checkSpelling = checkSpelling.replace(regex,"");
	
	regex = /&lt;/gi;
	checkSpelling = checkSpelling.replace(regex,"<");

	regex = /&gt;/gi;
	checkSpelling = checkSpelling.replace(regex,">");

	regex = /&amp;/gi;
	checkSpelling = checkSpelling.replace(regex,"&");

	return checkSpelling;
}

function callSpellChecker(obj)
{	
	var str = obj.value;
	var postData = escapeForSpellCheck(str);	
	var spellCheckResponse; 
	
	spellCheckResponse = loadXMLDoc(spellCheckURL, "document=" + postData,false); //calling it synchronously
	if (!((spellCheckResponse.responseXML != null) && spellCheckResponse.responseXML.documentElement))
		throw ("problem with loadXMLDoc: " + spellCheckResponse.responseText)
	
	try {
		var regex = /&/gi;
		str = str.replace(regex,"&amp;");

		var regex = /<(.*?)>/gi;
		str = str.replace(regex,"&lt;$1&gt;");

		var regex = /</gi;
		str = str.replace(regex,"&lt;");

		var regex = />/gi;
		str = str.replace(regex,"&gt;");

		var suggestedWords = process_spellcheck_response(spellCheckResponse);
		var suggestedText =  spellcheck(str, suggestedWords);

		var regex = /\n/gi;
		suggestedText = suggestedText.replace(regex,"<br />\n");
	} catch ( e ) {
		throw "Error processing spell check -- " + e.toString() ;
	}
	
	return suggestedText;
}

function findPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		curleft = obj.offsetLeft
		curtop = obj.offsetTop
		var id;
		// Grogan, Sep 1 06: stops at "content"
		// because otherwise positioning doesn't work
		// the total offsets are from the top left corner of the page
		// but style.top and style.left are measured from the content div
		// I dont know why
		while ((obj = obj.offsetParent) && obj.id != "content") {
			curleft += obj.offsetLeft
			id = obj.id;
			curtop += obj.offsetTop
			
		}
	}
	return [curleft,curtop];
}

function doSpellCheck(sourceObj)
{
	try
	{
		//Spell check div will be inside this one
		var spellCheckDivContainer = sourceObj.ownerDocument.createElement('div');
		var targetDiv = sourceObj.ownerDocument.createElement('div');
		var topAndLeft = findPos(sourceObj);
		targetDiv.className = 'spellCheckDiv';
		targetDiv.style.top = topAndLeft[1] + 'px' ;
		targetDiv.style.left = topAndLeft[0] + 'px';
		targetDiv.style.width = (sourceObj.offsetWidth - 6) + 'px';
		targetDiv.style.height = (sourceObj.offsetHeight - 6 ) + 'px';
		targetDiv.style.position = "absolute";		
		//targetDiv.style.backgroundColor = "#ccccff";
		//targetDiv.style.border = "1px solid";
		targetDiv.style.overflow = "auto";

		sourceObj.style.visibility = "hidden";
		targetDiv.style.visibility = ""; 
		
		try {
			var spellCheckerHTML = callSpellChecker(sourceObj) ;
		}
		catch (e)  { 
			throw 'Error calling callSpellChecker --  ' + e.toString(); 
		}
		targetDiv.innerHTML = "<div class='spellCheckPre'>" + spellCheckerHTML + "</div>";
		
		spellCheckDivContainer.appendChild(targetDiv); // place spellCheck div inside this container
		sourceObj.parentNode.appendChild(spellCheckDivContainer);

		g_spellCheckDivContainer = spellCheckDivContainer;
		g_spellCheckDiv = targetDiv;
	}
	catch(e)
	{
		alert("There was a problem calling the spell checker" + " -- " + e.toString());
		doReturnToEdit(sourceObj);
		//Propogate the error up further
		throw e;
	}
}
function doReturnToEdit(sourceObj)
{
	var targetDiv = g_spellCheckDiv;
	hideSuggestions();
	sourceObj.style.visibility = "";
	targetDiv.style.visibility = "hidden"; 
	targetDiv.style.width=0; 
	targetDiv.style.height=0;
	targetDiv.parentNode.removeChild(targetDiv);
	var isIE = targetDiv.outerHTML ? 1 : 0;
	sourceObj.value = unescapeForSpellCheck(targetDiv.innerHTML, isIE);
}
