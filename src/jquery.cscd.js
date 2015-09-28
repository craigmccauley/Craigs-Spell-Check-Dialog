// jQuery CSCD - Craig's Spell Check Dialog
// Requires jQuery & Bootstrap 3 & a red squiggle gif
// Client side spellchecking requires Typo.js https://github.com/cfinke/Typo.js

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

	"use strict";

	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).

	// Create the defaults once
	var pluginName = "cscd",
		defaults = {
			language: 'en-CA',
			dictionaryPath: null,
            spellcheckURL: null,
			suggestionFontSize : '2em',
			buttonWidth : '95px',
			noSuggestionsText : '(No Suggestions)'
	};

	// The actual plugin constructor
	function Plugin ( element, options ) {
		this.element = element;
		// jQuery has an extend method which merges the contents of two or
		// more objects, storing the result in the first object. The first object
		// is generally empty as we don't want to alter the default options for
		// future instances of the plugin
		this.typojs = null;
		this.setContentCallback = null;
		this.settings = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend(Plugin.prototype, {
		init: function () {
			var self = this;
			
			//add modal html to DOM
			$('body').append('<div id="cscdModal" class="modal" tabindex="-1" role="dialog" aria-labelledby="" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"> <div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title"><span class="glyphicon glyphicon-check" aria-hidden="true"></span> Spell Check</h4> </div><div class="modal-body"><div class="row"><div class="col-xs-9"><h4>Not in Dictionary:</h4></div></div><div class="row"><div class="col-xs-9"><div id="cscdContent" class="form-control"></div></div><div class="col-xs-3"><button id="cscdIgnoreOne" type="button" class="btn btn-lg btn-default dialog-button">Ignore</button><button id="cscdIgnoreAll" type="button" class="btn btn-lg btn-default dialog-button">Ig. All</button></div></div><div class="row"><div class="col-xs-9"><h4>Change To:</h4></div></div><div class="row"><div class="col-xs-9"><input id="cscdReplacementWord" type="text" class="form-control"/><select id="cscdSuggestionList" class="form-control" size="4" ></select></div><div class="col-xs-3"><button id="cdcsChangeOne" type="button" class="btn btn-lg btn-default dialog-button change-button">Change</button><button id="cscdChangeAll" type="button" class="btn btn-lg btn-default dialog-button">Chg. All</button><button id="cscdUndo" type="button" class="btn btn-lg btn-default dialog-button">Undo</button></div></div><div class="row"><div class="col-xs-3 col-xs-offset-9"><button type="button" class="btn btn-lg btn-default dialog-button" data-dismiss="modal">Cancel</button></div></div></div></div></div></div>');
			
			//suggestion selection change
			$('#cscdSuggestionList').change(function(){
				$('#cscdReplacementWord').val($(this).find('option:selected').text());
			});
			
			//ignore click
			$('#cscdIgnoreOne').click(function(){
				self.ProcessNextTypo();
			});
			
			//ignore all click
			$('#cscdIgnoreAll').click(function(){
				var $currentWord = $('#cscdContent .misspelled-active');
				var ignoreStart = false;
				$('#cscdContent .misspelled').each(function(){
					if($(this).html() === $currentWord.html()){
						if(ignoreStart){
							$(this).addClass('ignore-all');
						} else if($(this).hasClass('misspelled-active')){
							ignoreStart = true;
							$(this).addClass('ignore-all');
						}
					}
				});
				self.ProcessNextTypo();
			});
						
			//all change one events
			$('#cdcsChangeOne').click(function(){self.ChangeOne()});
			$('#cscdReplacementWord').keypress(function(event){
				if(event.keyCode == 13){
					self.ChangeOne();
				}
			});
			$('#cscdSuggestionList').dblclick(function(){
				if($(this).find('option:selected').text() !== self.settings.noSuggestionsText){
					$('#cscdReplacementWord').val($(this).find('option:selected').text());
					self.ChangeOne();
				}
			});
			
			//change all click
			$('#cscdChangeAll').click(function(){
				//execute change
				var $currentWord = $('#cscdContent .misspelled-active');
				var changeStart = false;
				$('#cscdContent .misspelled').each(function(){
					if($(this).html() === $currentWord.html()){
						if(changeStart){
							$(this).addClass('change-all');
							$(this).html($('#cscdReplacementWord').val());
						} else if($(this).hasClass('misspelled-active')){
							changeStart = true;
							$(this).addClass('change-all');
						}
					}
				});			
				$currentWord.html($('#cscdReplacementWord').val());
				self.ProcessNextTypo();
			});
			
			//undo click - doesn't work yet...
			$('#cscdUndo').click(function(){
				var $activeWord = $('#cscdContent .misspelled-active');
				
				var $nextWord = null;
				var $typos = $('#cscdContent .misspelled');
				var usePrev = false;
				$($typos.get().reverse()).each(function(){
					var $currentWord = $(this);
					if(usePrev){
						if(!$currentWord.hasClass('ignore-all') && !$currentWord.hasClass('change-all')){
							$nextWord = $currentWord;
							$nextWord.html($nextWord.data('orig'));
							return false;
						} else if($currentWord.hasClass('ignore-all')){
							var $ignoredWords = $('#cscdContent .ignore-all').filter(function(){ 
								return $(this).html() === $currentWord.html(); 
							});
							$nextWord = $ignoredWords.first();
							$ignoredWords.each(function(){
								$(this).removeClass('ignore-all');
							});
							return false;
						} else if($currentWord.hasClass('change-all')){
							var $changedWords = $('#cscdContent .change-all').filter(function(){ 
								return $(this).html() === $currentWord.html(); 
							});
							$nextWord = $changedWords.first();
							$changedWords.each(function(){
								$(this).html($(this).data('orig'));
								$(this).removeClass('change-all');
							});
							return false;
						}
					} else if($activeWord.is($currentWord)){
						usePrev = true;
					}
				});
				self.ProcessWord($nextWord);
			});
			
			//dictionary init for javascript dictionary
			//pull down aff, dic and custom word files
            if(self.settings.dictionaryPath != null){
                var partialpath = self.settings.dictionaryPath + self.settings.language.replace("-", "_");
                var affPath = partialpath + ".aff";
                var dicPath = partialpath + ".dic";
                var customPath = partialpath + "_Custom.txt";
			    $.when($.ajax(affPath), $.ajax(dicPath), $.ajax(customPath)).done(function(aff, dic, custom){
                    if(aff[1] != "success" || dic[1] != "success"){
                        //dictionary files failed to load
                        alert("Dictionary Files failed to load, spellcheck unvailable.");
                        return false;
                    }
                    //actual dictionary init
				    self.typojs = new Typo(self.settings.language, aff[0], dic[0]);
                    if(custom[1] == "success"){
                        //insert custom words into dictionary
                        $.each(custom[0].split("\n"), function(){
                            var customWord = this.trim();
                            if (!(customWord in self.typojs.dictionaryTable) || typeof self.typojs.dictionaryTable[customWord] != 'object') {
				                self.typojs.dictionaryTable[customWord] = [];
				                self.typojs.dictionaryTable[customWord].push([]);
			                }
                        });
                    }
			    });
			}
		},
		SpellCheck : function(content, setContentCallback){
			var self = this;
			self.setContentCallback = setContentCallback;
			//TODO blocking div
		
			//show modal
			$('#cscdModal').modal('show');
			
			//get individual words
			var $tempDiv = $('<div />').html(content);			
			var words = [];
			//regex that gets all words from a string
			var wordRegularExpression = new RegExp(/(\w+)/g);
			var findWords = function(node){
				switch(node.nodeType){
					case 1: 
						$(node).contents().each(function(){ findWords(this);});
						break;
					case 3:
						var nodeValue = node.nodeValue;
						var match = wordRegularExpression.exec(nodeValue);
						while (match != null) {
							words.push(match[1]);
							match = wordRegularExpression.exec(nodeValue);
						}
						break;
				}
			};
			$tempDiv.contents().each(function(){ findWords(this); });
			//find all distinct words
			var distinctWords = eliminateDuplicates(words);
			
            //set up checking complete function
            var spellcheckingFunction  = function(suggestions){                
			    //replace words with suggestions
			    var replaceWords = function(node){
				    switch(node.nodeType){
					    case 1:
						    $(node).contents().each(function(){ replaceWords(this);});
						    break;
					    case 3:
						    var nodeValue = node.nodeValue;
						    $(node).replaceWith(nodeValue.replace(wordRegularExpression, 
							    function(str, p1, offset, s){
								    return GetTypo(p1, suggestions);
							    }
						    ));	
						    break;
				    }
			    };
			    $tempDiv.contents().each(function(){ replaceWords(this); });			
			    $('#cscdContent').html($tempDiv.html());
			    //setup first word			
			    var $firstWord = $('#cscdContent .misspelled:first');
			    if($firstWord.length != 0){
				    self.ProcessWord($firstWord);
			    } else {
				    self.SpellCheckComplete();
			    }
            };

            //use client side spellcheck by default
            if(self.settings.dictionaryPath != null){
			    var suggestions = [];
			    $.each(distinctWords, function(){
				    if(!self.typojs.check(this)){
					    suggestions[this] = self.typojs.suggest(this);
				    }
			    });
                spellcheckingFunction(suggestions);
            } else if (self.settings.spellcheckURL != null){
                //otherwise try serverside spellcheck
                $.ajax({
				    type:"POST",
				    url: self.settings.spellcheckURL,
				    dataType: "json",
				    data: $.param({ '': distinctWords }, true),
				    processData: false,
				    error: function(XMLHttpRequest, textStatus, errorThrown) {
					    alert('error');
				    },
				    success: function(suggestions) {	
					    spellcheckingFunction(suggestions);
				    }
			    });
            } else {
                //error no spellcheck providers defined
            }			
		},
		ProcessWord : function($currentWordSpan) {
			var self = this;
			//remove existing active words if there are any (there shouldn't be)
			$('#cscdContent .misspelled.misspelled-active').removeClass('misspelled-active');
			//make my word active
			$currentWordSpan.addClass('misspelled-active');
			var $contentDiv = $('#cscdContent');
			//scroll to word
			$contentDiv.scrollTo($contentDiv.scrollTop() + $currentWordSpan.position().top - $contentDiv.height()/2 + $currentWordSpan.height()/2);
			
			//enable/disable undo button
			if($currentWordSpan.get(0) == $('#cscdContent .misspelled').first().get(0)){
				$('#cscdUndo').prop('disabled', true);
			} else {
				$('#cscdUndo').prop('disabled', false);
			}
								
			//populate suggestions and replacement
			var $suggestionList = $('#cscdSuggestionList');
			$suggestionList.html('');
			var suggestions = $currentWordSpan.data('suggestions').split(',');
			var $replacementWord = $('#cscdReplacementWord');
			if(suggestions.length > 0 && suggestions[0] !== ""){
				$replacementWord.val(suggestions[0]);
				$.each(suggestions, function(index, value){
					$suggestionList.append($('<option/>').html(value));
				});
			} else {
				$replacementWord.val($currentWordSpan.html());
				$suggestionList.append($('<option/>').html(self.settings.noSuggestionsText));
			}
			//select first item
			$suggestionList.find('option:first').prop('selected', true);
			//selects text in control
			$replacementWord.select();
			//focuses control
			$replacementWord.focus();
		},
		ChangeOne : function(){
			var self = this;
			//execute change
			var $currentWord = $('#cscdContent .misspelled-active');
			$currentWord.html($('#cscdReplacementWord').val());
			
			self.ProcessNextTypo();
		},
		ProcessNextTypo : function (){
			var self = this;
			//find next typo
			var $typos = $('#cscdContent .misspelled');
			var useNext = false;
			var $nextWord = null;
			$typos.each(function(){
				if(useNext && !$(this).hasClass('ignore-all') && !$(this).hasClass('change-all')){
					$nextWord = $(this);
					return false;
				} else {
					if($(this).hasClass('misspelled-active')){
						useNext = true;
					}
				}
			});
			
			//process or exit
			if($nextWord !== null){
				self.ProcessWord($nextWord);
			} else {
				self.SpellCheckComplete();
			}
		},
		SpellCheckComplete : function(){
			var self = this;
			$('#cscdContent .misspelled.misspelled-active').removeClass('misspelled-active');
			$('#cscdContent .misspelled').each(function(){
				$(this).replaceWith($(this).html());
			});
			//TODO: change to a friendlier alert
			alert('Complete!');
			self.setContentCallback($('#cscdContent').html());
			$('#cscdModal').modal('hide');
		}
	});

	//plugin wrapper taken from CRTE
    $.fn[pluginName] = function (options) {
        var args = arguments,
		response;

        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    response = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }
            });
            return response !== undefined ? response : this;
        }
    };
	
	$.fn.scrollTo = function( target, options, callback ){
		if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
			var settings = $.extend({
				scrollTarget  : target,
				offsetTop     : 50,
				duration      : 500,
				easing        : 'swing'
			}, options);
		return this.each(function(){
			var scrollPane = $(this);
			var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
			var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
			scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
				if (typeof callback == 'function') { callback.call(this); }
			});
		});
	};
	
	var eliminateDuplicates = function (arr) {
		var i,
			len=arr.length,
			out=[],
			obj={};

		for (i=0;i<len;i++) {
			obj[arr[i]]=0;
		}
		for (i in obj) {
			out.push(i);
		}
		return out;
	};
		
	var GetTypo = function(word, typos){
		if(typos[word] == null){
			return word;
		} else {
			return "<span class='misspelled' data-orig='" + word + "' data-suggestions='" + typos[word] + "'>" + word + "</span>";
		}
	}

	
})( jQuery, window, document );
