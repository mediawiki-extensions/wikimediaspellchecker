  var inspellcheck = 0;
	var spellcheckImagePath =  wgScriptPath + "/extensions/spellcheck/images";
  function checkSpelling() {
    if( inspellcheck ) {
      document.getElementById('button_spell').src = spellcheckImagePath + "/button_spell.png";
      document.getElementById('wpSave').style.visibility = '';
      document.getElementById('wpPreview').style.visibility = '';
      doReturnToEdit(document.getElementById('editform').elements['wpTextbox1']);
      inspellcheck = 0;
    } else {
      document.getElementById('button_spell').src = spellcheckImagePath + '/button_spell_done.png';
      document.getElementById('wpSave').style.visibility = 'hidden';
      document.getElementById('wpPreview').style.visibility = 'hidden';
      doSpellCheck(document.getElementById('editform').elements['wpTextbox1']);
      inspellcheck = 1;
    }
  }
  
	// modeled after mwInsertEditButton
  function insertSpellButton() {
  	var parent = document.getElementById('toolbar');
  	if (!parent) return false;
		var image = document.createElement("img");
	  image.width = 23;
	  image.height = 22;
	  image.src = spellcheckImagePath + "/button_spell.png";
	  image.border = 0;
	  image.alt = "spellcheck";
	  image.title = "spellcheck";
	  image.style.cursor = "pointer";
	  image.onclick = checkSpelling;
		image.id = "button_spell";
	  parent.appendChild(image);
	}

addOnloadHook(insertSpellButton);
