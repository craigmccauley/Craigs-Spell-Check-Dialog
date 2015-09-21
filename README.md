# Craig's Spell Check Dialog
jQuery plugin to provide a spell check dialog

##Usage
      <div id="mycontent" contenteditable style="height:300px; border: solid black 2px; padding:3px;">Some conteent</div>  
	  <button id="spellcheckbutton">Check for errors</button>
	
	$(function(){
		var spellchecker = $(document).cscd({
			spellcheckURL : "http://localhost/SpellCheck/api/CheckWords"
		});
		$('#spellcheckbutton').click(function(){
			spellchecker.cscd(
				'SpellCheck',
				$('#mycontent').html(),
				function(data){
					$('#mycontent').html(data);
				}
			);
		});
	});
	
##On the Server Side
You will need a function that accepts an array of strings and returns a Dictionary&lt;string, string[]>.
The array of strings passed in is a unique list of words.
In the dictionay passed back the key string is the misspelled word, value array of strings are the suggestions.
In .Net it would look like this.

		public Dictionary<string, string[]> Post([FromBody]string[] words)
		
If you are not using .Net the request body will look similar to this

    =wordtocheck1&=wordtocheck2&=wordtocheck3&=wordtocheck4

and your response body should look similar to this 

    {"typo1":["sug1", "sug2"],"typo2":["sug1","sug2"]}
