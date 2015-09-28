# Craig's Spell Check Dialog
jQuery plugin to provide a spell check dialog

##Usage
      <div id="mycontent" contenteditable style="height:300px; border: solid black 2px; padding:3px;">Some conteent</div>  
	  <button id="spellcheckbutton">Check for errors</button>
	
	$(function(){
		var spellchecker = $(document).cscd({
			//either specify your server URL
			spellcheckURL : "http://localhost/SpellCheck/api/CheckWords",
			//or you can use client side spellchecking with Typo.js
			//CSCD will automatically look for <langaugetype>.aff and .dic files in specified directory
			//ex. en_CA.aff/en_CA.dic
			//make sure you can serve .aff and .dic files as text/plain from your web server
			dictionaryPath : "./Dictionary/",
		});
		$('#spellcheckbutton').click(function(){
			spellchecker.cscd(
				//execute spellcheck function
				'SpellCheck',
				//html content to check
				$('#mycontent').html(),
				//callback function
				function(data){
					$('#mycontent').html(data);
				}
			);
		});
	});
	
##On the Server Side - if needed
You will need a function that accepts an array of strings and returns a Dictionary&lt;string, string[]>.
The array of strings passed in is a unique list of words.
In the dictionay passed back the key string is the misspelled word, value array of strings are the suggestions.
In .Net it would look like this.

		public Dictionary<string, string[]> Post([FromBody]string[] words)
		
If you are not using .Net the request body will look similar to this

    =wordtocheck1&=wordtocheck2&=wordtocheck3&=wordtocheck4

and your response body should look similar to this 

    {"typo1":["sug1", "sug2"],"typo2":["sug1","sug2"]}
