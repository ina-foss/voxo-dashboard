var oT = {};(function(){(function($){$.fn.htmlClean=function(options){return this.each(function(){if(this.value){this.value=$.htmlClean(this.value,options)}else{this.innerHTML=$.htmlClean(this.innerHTML,options)}})};$.htmlClean=function(html,options){options=$.extend({},$.htmlClean.defaults,options);options.allowEmpty=tagAllowEmpty.concat(options.allowEmpty);var tagsRE=/(<(\/)?(\w+:)?([\w]+)([^>]*)>)|<!--(.*?--)>/gi;var attrsRE=/([\w\-]+)\s*=\s*(".*?"|'.*?'|[^\s>\/]*)/gi;var tagMatch;var root=new Element();var stack=[root];var container=root;if(options.bodyOnly){if(tagMatch=/<body[^>]*>((\n|.)*)<\/body>/i.exec(html)){html=tagMatch[1]}}html=html.concat("<xxx>");var lastIndex;while(tagMatch=tagsRE.exec(html)){var tag=tagMatch[6]?new Tag("--",null,tagMatch[6],options):new Tag(tagMatch[4],tagMatch[2],tagMatch[5],options);var text=html.substring(lastIndex,tagMatch.index);if(text.length>0){var child=container.children[container.children.length-1];if(container.children.length>0&&isText(child=container.children[container.children.length-1])){container.children[container.children.length-1]=child.concat(text)}else{container.children.push(text)}}lastIndex=tagsRE.lastIndex;if(tag.isClosing){if(popToTagName(stack,[tag.name])){stack.pop();container=stack[stack.length-1]}}else{var element=new Element(tag);var attrMatch;while(attrMatch=attrsRE.exec(tag.rawAttributes)){if(attrMatch[1].toLowerCase()=="style"&&options.replaceStyles){var renderParent=!tag.isInline;for(var i=0;i<options.replaceStyles.length;i++){if(options.replaceStyles[i][0].test(attrMatch[2])){if(!renderParent){tag.render=false;renderParent=true}container.children.push(element);stack.push(element);container=element;tag=new Tag(options.replaceStyles[i][1],"","",options);element=new Element(tag)}}}if(tag.allowedAttributes!=null&&(tag.allowedAttributes.length==0||$.inArray(attrMatch[1],tag.allowedAttributes)>-1)){element.attributes.push(new Attribute(attrMatch[1],attrMatch[2]))}}$.each(tag.requiredAttributes,function(){var name=this.toString();if(!element.hasAttribute(name)){element.attributes.push(new Attribute(name,""))}});for(var repIndex=0;repIndex<options.replace.length;repIndex++){for(var tagIndex=0;tagIndex<options.replace[repIndex][0].length;tagIndex++){var byName=typeof(options.replace[repIndex][0][tagIndex])=="string";if((byName&&options.replace[repIndex][0][tagIndex]==tag.name)||(!byName&&options.replace[repIndex][0][tagIndex].test(tagMatch))){tag.rename(options.replace[repIndex][1]);repIndex=options.replace.length;break}}}var add=true;if(!container.isRoot){if(container.tag.isInline&&!tag.isInline){if(add=popToContainer(stack)){container=stack[stack.length-1]}}else{if(container.tag.disallowNest&&tag.disallowNest&&!tag.requiredParent){add=false}else{if(tag.requiredParent){if(add=popToTagName(stack,tag.requiredParent)){container=stack[stack.length-1]}}}}}if(add){container.children.push(element);if(tag.toProtect){var tagMatch2;while(tagMatch2=tagsRE.exec(html)){var tag2=new Tag(tagMatch2[4],tagMatch2[1],tagMatch2[5],options);if(tag2.isClosing&&tag2.name==tag.name){element.children.push(RegExp.leftContext.substring(lastIndex));lastIndex=tagsRE.lastIndex;break}}}else{if(!tag.isSelfClosing&&!tag.isNonClosing){stack.push(element);container=element}}}}}return $.htmlClean.trim(render(root,options).join(""))};$.htmlClean.defaults={bodyOnly:true,allowedTags:[],removeTags:["basefont","center","dir","font","frame","frameset","iframe","isindex","menu","noframes","s","strike","u"],removeTagsAndContent:[],allowedAttributes:[],removeAttrs:[],allowedClasses:[],format:false,formatIndent:0,replace:[[["b","big"],"strong"],[["i"],"em"]],replaceStyles:[[/font-weight:\s*bold/i,"strong"],[/font-style:\s*italic/i,"em"],[/vertical-align:\s*super/i,"sup"],[/vertical-align:\s*sub/i,"sub"]],allowComments:false,allowEmpty:[]};function applyFormat(element,options,output,indent){if(element.tag.format&&output.length>0){output.push("\n");for(var i=0;i<indent;i++){output.push("\t")}}}function render(element,options){var output=[],empty=element.attributes.length==0,indent=0;if(element.tag.isComment){if(options.allowComments){output.push("<!--");output.push(element.tag.rawAttributes);output.push(">");if(options.format){applyFormat(element,options,output,indent-1)}}}else{var renderChildren=(options.removeTagsAndContent.length==0||$.inArray(element.tag.name,options.removeTagsAndContent)==-1);var renderTag=renderChildren&&element.tag.render&&(options.allowedTags.length==0||$.inArray(element.tag.name,options.allowedTags)>-1)&&(options.removeTags.length==0||$.inArray(element.tag.name,options.removeTags)==-1);if(!element.isRoot&&renderTag){output.push("<");output.push(element.tag.name);$.each(element.attributes,function(){if($.inArray(this.name,options.removeAttrs)==-1){var m=RegExp(/^(['"]?)(.*?)['"]?$/).exec(this.value);var value=m[2];var valueQuote=m[1]||"'";if(this.name=="class"&&options.allowedClasses.length>0){value=$.grep(value.split(" "),function(c){return $.grep(options.allowedClasses,function(a){return a==c||(a[0]==c&&(a.length==1||$.inArray(element.tag.name,a[1])>-1))}).length>0}).join(" ")}if(value!=null&&(value.length>0||$.inArray(this.name,element.tag.requiredAttributes)>-1)){output.push(" ");output.push(this.name);output.push("=");output.push(valueQuote);output.push(value);output.push(valueQuote)}}})}if(element.tag.isSelfClosing){if(renderTag){output.push(" />")}empty=false}else{if(element.tag.isNonClosing){empty=false}else{if(renderChildren){if(!element.isRoot&&renderTag){output.push(">")}indent=options.formatIndent++;if(element.tag.toProtect){outputChildren=$.htmlClean.trim(element.children.join("")).replace(/<br>/ig,"\n");output.push(outputChildren);empty=outputChildren.length==0}else{var outputChildren=[];for(var i=0;i<element.children.length;i++){var child=element.children[i];var text=$.htmlClean.trim(textClean(isText(child)?child:child.childrenToString()));if(isInline(child)){if(i>0&&text.length>0&&(startsWithWhitespace(child)||endsWithWhitespace(element.children[i-1]))){outputChildren.push(" ")}}if(isText(child)){if(text.length>0){outputChildren.push(text)}}else{if(i!=element.children.length-1||child.tag.name!="br"){if(options.format){applyFormat(child,options,outputChildren,indent)}outputChildren=outputChildren.concat(render(child,options))}}}options.formatIndent--;if(outputChildren.length>0){if(options.format&&outputChildren[0]!="\n"){applyFormat(element,options,output,indent)}output=output.concat(outputChildren);empty=false}}if(!element.isRoot&&renderTag){if(options.format){applyFormat(element,options,output,indent-1)}output.push("</");output.push(element.tag.name);output.push(">")}}}}if(!element.tag.allowEmpty&&empty){return[]}}return output}function popToTagName(stack,tagNameArray){return pop(stack,function(element){return $.inArray(element.tag.nameOriginal,tagNameArray)>-1})}function popToContainer(stack){return pop(stack,function(element){return element.isRoot||!element.tag.isInline})}function pop(stack,test,index){index=index||1;var element=stack[stack.length-index];if(test(element)){return true}else{if(stack.length-index>0&&pop(stack,test,index+1)){stack.pop();return true}}return false}function Element(tag){if(tag){this.tag=tag;this.isRoot=false}else{this.tag=new Tag("root");this.isRoot=true}this.attributes=[];this.children=[];this.hasAttribute=function(name){for(var i=0;i<this.attributes.length;i++){if(this.attributes[i].name==name){return true}}return false};this.childrenToString=function(){return this.children.join("")};return this}function Attribute(name,value){this.name=name;this.value=value;return this}function Tag(name,close,rawAttributes,options){this.name=name.toLowerCase();this.nameOriginal=this.name;this.render=true;this.init=function(){if(this.name=="--"){this.isComment=true;this.isSelfClosing=true;this.format=true}else{this.isComment=false;this.isSelfClosing=$.inArray(this.name,tagSelfClosing)>-1;this.isNonClosing=$.inArray(this.name,tagNonClosing)>-1;this.isClosing=(close!=undefined&&close.length>0);this.isInline=$.inArray(this.name,tagInline)>-1;this.disallowNest=$.inArray(this.name,tagDisallowNest)>-1;this.requiredParent=tagRequiredParent[$.inArray(this.name,tagRequiredParent)+1];this.allowEmpty=options&&$.inArray(this.name,options.allowEmpty)>-1;this.toProtect=$.inArray(this.name,tagProtect)>-1;this.format=$.inArray(this.name,tagFormat)>-1||!this.isInline}this.rawAttributes=rawAttributes;this.requiredAttributes=tagAttributesRequired[$.inArray(this.name,tagAttributesRequired)+1];if(options){if(!options.tagAttributesCache){options.tagAttributesCache=[]}if($.inArray(this.name,options.tagAttributesCache)==-1){var cacheItem=tagAttributes[$.inArray(this.name,tagAttributes)+1].slice(0);for(var i=0;i<options.allowedAttributes.length;i++){var attrName=options.allowedAttributes[i][0];if((options.allowedAttributes[i].length==1||$.inArray(this.name,options.allowedAttributes[i][1])>-1)&&$.inArray(attrName,cacheItem)==-1){cacheItem.push(attrName)}}options.tagAttributesCache.push(this.name);options.tagAttributesCache.push(cacheItem)}this.allowedAttributes=options.tagAttributesCache[$.inArray(this.name,options.tagAttributesCache)+1]}};this.init();this.rename=function(newName){this.name=newName;this.init()};return this}function startsWithWhitespace(item){while(isElement(item)&&item.children.length>0){item=item.children[0]}if(!isText(item)){return false}var text=textClean(item);return text.length>0&&$.htmlClean.isWhitespace(text.charAt(0))}function endsWithWhitespace(item){while(isElement(item)&&item.children.length>0){item=item.children[item.children.length-1]}if(!isText(item)){return false}var text=textClean(item);return text.length>0&&$.htmlClean.isWhitespace(text.charAt(text.length-1))}function isText(item){return item.constructor==String}function isInline(item){return isText(item)||item.tag.isInline}function isElement(item){return item.constructor==Element}function textClean(text){return text.replace(/&nbsp;|\n/g," ").replace(/\s\s+/g," ")}$.htmlClean.trim=function(text){return $.htmlClean.trimStart($.htmlClean.trimEnd(text))};$.htmlClean.trimStart=function(text){return text.substring($.htmlClean.trimStartIndex(text))};$.htmlClean.trimStartIndex=function(text){for(var start=0;start<text.length-1&&$.htmlClean.isWhitespace(text.charAt(start));start++){}return start};$.htmlClean.trimEnd=function(text){return text.substring(0,$.htmlClean.trimEndIndex(text))};$.htmlClean.trimEndIndex=function(text){for(var end=text.length-1;end>=0&&$.htmlClean.isWhitespace(text.charAt(end));end--){}return end+1};$.htmlClean.isWhitespace=function(c){return $.inArray(c,whitespace)!=-1};var tagInline=["a","abbr","acronym","address","b","big","br","button","caption","cite","code","del","em","font","hr","i","input","img","ins","label","legend","map","q","s","samp","select","option","param","small","span","strike","strong","sub","sup","tt","u","var"];var tagFormat=["address","button","caption","code","input","label","legend","select","option","param"];var tagDisallowNest=["h1","h2","h3","h4","h5","h6","p","th","td","object"];var tagAllowEmpty=["th","td"];var tagRequiredParent=[null,"li",["ul","ol"],"dt",["dl"],"dd",["dl"],"td",["tr"],"th",["tr"],"tr",["table","thead","tbody","tfoot"],"thead",["table"],"tbody",["table"],"tfoot",["table"],"param",["object"]];var tagProtect=["script","style","pre","code"];var tagSelfClosing=["area","base","br","col","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"];var tagNonClosing=["!doctype","?xml"];var tagAttributes=[["class"],"?xml",[],"!doctype",[],"a",["accesskey","class","href","name","title","rel","rev","type","tabindex"],"abbr",["class","title"],"acronym",["class","title"],"blockquote",["cite","class"],"button",["class","disabled","name","type","value"],"del",["cite","class","datetime"],"form",["accept","action","class","enctype","method","name"],"iframe",["class","height","name","sandbox","seamless","src","srcdoc","width"],"input",["accept","accesskey","alt","checked","class","disabled","ismap","maxlength","name","size","readonly","src","tabindex","type","usemap","value"],"img",["alt","class","height","src","width"],"ins",["cite","class","datetime"],"label",["accesskey","class","for"],"legend",["accesskey","class"],"link",["href","rel","type"],"meta",["content","http-equiv","name","scheme","charset"],"map",["name"],"optgroup",["class","disabled","label"],"option",["class","disabled","label","selected","value"],"q",["class","cite"],"script",["src","type"],"select",["class","disabled","multiple","name","size","tabindex"],"style",["type"],"table",["class","summary"],"th",["class","colspan","rowspan"],"td",["class","colspan","rowspan"],"textarea",["accesskey","class","cols","disabled","name","readonly","rows","tabindex"],"param",["name","value"],"embed",["height","src","type","width"]];var tagAttributesRequired=[[],"img",["alt"]];var whitespace=[" "," ","\t","\n","\r","\f"]})(jQuery);;/*
 * to-markdown - an HTML to Markdown converter
 *
 * Copyright 2011, Dom Christie
 * Licenced under the MIT licence
 *
 */

var toMarkdown = function(string) {
  
  var ELEMENTS = [
    {
      patterns: 'p',
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '\n\n' + innerHTML + '\n' : '';
      }
    },
    {
      patterns: 'br',
      type: 'void',
      replacement: '\n'
    },
    {
      patterns: 'h([1-6])',
      replacement: function(str, hLevel, attrs, innerHTML) {
        var hPrefix = '';
        for(var i = 0; i < hLevel; i++) {
          hPrefix += '#';
        }
        return '\n\n' + hPrefix + ' ' + innerHTML + '\n';
      }
    },
    {
      patterns: 'hr',
      type: 'void',
      replacement: '\n\n* * *\n'
    },
    {
      patterns: 'a',
      replacement: function(str, attrs, innerHTML) {
        var href = attrs.match(attrRegExp('href')),
            title = attrs.match(attrRegExp('title'));
        return href ? '[' + innerHTML + ']' + '(' + href[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')' : str;
      }
    },
    {
      patterns: ['b', 'strong'],
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '**' + innerHTML + '**' : '';
      }
    },
    {
      patterns: ['i', 'em'],
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '_' + innerHTML + '_' : '';
      }
    },
    {
      patterns: 'code',
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '`' + innerHTML + '`' : '';
      }
    },
    {
      patterns: 'img',
      type: 'void',
      replacement: function(str, attrs, innerHTML) {
        var src = attrs.match(attrRegExp('src')),
            alt = attrs.match(attrRegExp('alt')),
            title = attrs.match(attrRegExp('title'));
        return '![' + (alt && alt[1] ? alt[1] : '') + ']' + '(' + src[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')';
      }
    }
  ];
  
  for(var i = 0, len = ELEMENTS.length; i < len; i++) {
    if(typeof ELEMENTS[i].patterns === 'string') {
      string = replaceEls(string, { tag: ELEMENTS[i].patterns, replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
    }
    else {
      for(var j = 0, pLen = ELEMENTS[i].patterns.length; j < pLen; j++) {
        string = replaceEls(string, { tag: ELEMENTS[i].patterns[j], replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
      }
    }
  }
  
  function replaceEls(html, elProperties) {
    var pattern = elProperties.type === 'void' ? '<' + elProperties.tag + '\\b([^>]*)\\/?>' : '<' + elProperties.tag + '\\b([^>]*)>([\\s\\S]*?)<\\/' + elProperties.tag + '>',
        regex = new RegExp(pattern, 'gi'),
        markdown = '';
    if(typeof elProperties.replacement === 'string') {
      markdown = html.replace(regex, elProperties.replacement);
    }
    else {
      markdown = html.replace(regex, function(str, p1, p2, p3) {
        return elProperties.replacement.call(this, str, p1, p2, p3);
      });
    }
    return markdown;
  }
  
  function attrRegExp(attr) {
    return new RegExp(attr + '\\s*=\\s*["\']?([^"\']*)["\']?', 'i');
  }
  
  // Pre code blocks
  
  string = string.replace(/<pre\b[^>]*>`([\s\S]*)`<\/pre>/gi, function(str, innerHTML) {
    innerHTML = innerHTML.replace(/^\t+/g, '  '); // convert tabs to spaces (you know it makes sense)
    innerHTML = innerHTML.replace(/\n/g, '\n    ');
    return '\n\n    ' + innerHTML + '\n';
  });
  
  // Lists

  // Escape numbers that could trigger an ol
  // If there are more than three spaces before the code, it would be in a pre tag
  // Make sure we are escaping the period not matching any character
  string = string.replace(/^(\s{0,3}\d+)\. /g, '$1\\. ');
  
  // Converts lists that have no child lists (of same type) first, then works it's way up
  var noChildrenRegex = /<(ul|ol)\b[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi;
  while(string.match(noChildrenRegex)) {
    string = string.replace(noChildrenRegex, function(str) {
      return replaceLists(str);
    });
  }
  
  function replaceLists(html) {
    
    html = html.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, function(str, listType, innerHTML) {
      var lis = innerHTML.split('</li>');
      lis.splice(lis.length - 1, 1);
      
      for(i = 0, len = lis.length; i < len; i++) {
        if(lis[i]) {
          var prefix = (listType === 'ol') ? (i + 1) + ".  " : "*   ";
          lis[i] = lis[i].replace(/\s*<li[^>]*>([\s\S]*)/i, function(str, innerHTML) {
            
            innerHTML = innerHTML.replace(/^\s+/, '');
            innerHTML = innerHTML.replace(/\n\n/g, '\n\n    ');
            // indent nested lists
            innerHTML = innerHTML.replace(/\n([ ]*)+(\*|\d+\.) /g, '\n$1    $2 ');
            return prefix + innerHTML;
          });
        }
      }
      return lis.join('\n');
    });
    return '\n\n' + html.replace(/[ \t]+\n|\s+$/g, '');
  }
  
  // Blockquotes
  var deepest = /<blockquote\b[^>]*>((?:(?!<blockquote)[\s\S])*?)<\/blockquote>/gi;
  while(string.match(deepest)) {
    string = string.replace(deepest, function(str) {
      return replaceBlockquotes(str);
    });
  }
  
  function replaceBlockquotes(html) {
    html = html.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, function(str, inner) {
      inner = inner.replace(/^\s+|\s+$/g, '');
      inner = cleanUp(inner);
      inner = inner.replace(/^/gm, '> ');
      inner = inner.replace(/^(>([ \t]{2,}>)+)/gm, '> >');
      return inner;
    });
    return html;
  }
  
  function cleanUp(string) {
    string = string.replace(/^[\t\r\n]+|[\t\r\n]+$/g, ''); // trim leading/trailing whitespace
    string = string.replace(/\n\s+\n/g, '\n\n');
    string = string.replace(/\n{3,}/g, '\n\n'); // limit consecutive linebreaks to 2
    return string;
  }
  
  return cleanUp(string);
};

if (typeof exports === 'object') {
  exports.toMarkdown = toMarkdown;
}
;/*! otinput v1.0.0 */
(function(){
'use strict';
oTinput.prototype.getSupportedFormats = function(){
    var potentialFormatsAudio = ['mp3', 'ogg', 'webm', 'wav'];
    var potentialFormatsVideo = ['mp4', 'ogg', 'webm'];
    var isFormatSupported = this.isFormatSupported || oTinput.isFormatSupported;
    var audio = $.map( potentialFormatsAudio, function( format, i ) {
        if (isFormatSupported(format)){
            return format;
        }
    });
    var video = $.map( potentialFormatsVideo, function( format, i ) {
        if (isFormatSupported(format)){
            return format;
        }
    });
    return {
        audio: audio,
        video: video
    };
};
oTinput.prototype.isFormatSupported = function( format ){
    var a;
    if (typeof format !== 'string') {
        var fileType = format.type.split("/")[0];
        a = document.createElement(fileType);
        return !!(a.canPlayType && a.canPlayType(format.type).replace(/no/, ''));
    }
    a = document.createElement('audio');
    return !!(a.canPlayType && a.canPlayType('audio/'+format+';').replace(/no/, ''));
};
oTinput.getSupportedFormats = oTinput.prototype.getSupportedFormats;
oTinput.isFormatSupported = oTinput.prototype.isFormatSupported;

oTinput.prototype.parseYoutubeURL = function(url){
    if (url.match) {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match&&match[2].length===11){
            return match[2];
        }
    }
    return false;
};
oTinput.parseYoutubeURL = oTinput.prototype.parseYoutubeURL;

function oTinput(config){
    var that = this;
    this._text = config.text || {};
    this._onFileChange = config.onFileChange || function(){};
    this._onFileError = config.onFileError || function(){};
    this._onURLSubmit = config.onURLSubmit || function(){};
    this._onURLError = config.onURLError || function(){};
    this._dragover = config.onDragover || function(){};
    this._dragleave = config.onDragleave || function(){};
    this.element = this._setupElement(config.element);
    this._setupMouseEvents();
    
    $(this.element).find('input[type="file"]').change(function(){
        that._reactToFile(this);
    });
    $(this.element).find('.ext-input-field input').on('submit',function(){
        that._reactToURL( $(this).val() );
    }).keypress(function(e){
        if (e.which === 13) {
            that._reactToURL( $(this).val() );
            return false;
        }
    });    
}
window.oTinput = oTinput;
oTinput.prototype._setupElement = function(element){
    var that = this;
    if (typeof element === 'undefined') {
        throw('must specify container element');
    }
    var buttonText = this._text.button || 'Choose audio (or video) file';
    var button = '<button class="btn-file-input" style="width: 100%;">'+buttonText+'</button>';
    var fileInputStyle = [
        'position: absolute',
        'top: 0',
        'left: 0',
        'opacity: 0',
        'width: 100%'
    ].join(';');
    var fileInput = '<input type="file" accept="audio/*, video/*" style="'+fileInputStyle+'">';
    var wrapperStyle = 'position: relative; overflow: hidden;';
    var wrapper = '<div class="file-input-wrapper" style="'+wrapperStyle+'">'+button+fileInput+'</div>';
    var altButtonText = this._text.altButton || 'Enter file URL';
    var altButton = '<button class="alt-input-button">'+altButtonText+'</button>';
    var urlInputText = this._text.altInputText || 'Enter URL of audio or video file, or YouTube video:';
    var urlInputClose = this._text.closeAlt || 'close';
    var urlInput = '<div class="ext-input-field" style="display: none;"><div class="close-ext-input">'+urlInputClose+'</div><label>'+urlInputText+'<input type="text"></label><div class="ext-input-warning"></div></div>';
    $(element).html( wrapper + altButton + urlInput ); 
    return $(element)[0];
};
oTinput.prototype._setupMouseEvents = function(){
    var that = this;
    var element = this.element;
    var buttonEl = $(element).find('.file-input-wrapper')[0];
    buttonEl.addEventListener('dragover', function(){
        that._dragover();
    }, false);
    buttonEl.addEventListener('dragleave', function(){
        that._dragleave();
    }, false);
    $(element).find('.alt-input-button').click(function(){
        that.showURLInput();
    });    
    $(element).find('.close-ext-input').click(function(){
        that.showFileInput();
    });
};
oTinput.prototype._reactToFile = function(input){
    var file = input.files[0];
    if ( this.isFormatSupported(file) ) {
        this._onFileChange( file );
    } else {
        var err = new Error('Filetype '+file.type+' not supported by this browser');
        this._onFileError(err, file);
    }
};
oTinput.prototype._reactToURL = function(url){
    var input = url.replace(/\s/g,'');
    if (this.parseYoutubeURL(input)){
        return this._onURLSubmit( input );
    }
    var formatArr = input.split('.');
    var format = formatArr[formatArr.length-1];
    if ( this.isFormatSupported(format) ) {
        this._onURLSubmit( input );
    } else {
        var err = new Error('Filetype '+format+' not supported by this browser');
        this._onURLError(err, url);
    }
};
oTinput.prototype.showURLInput = function(){
    $(this.element).find('.ext-input-field').show().find('input').focus();
    $(this.element).addClass('ext-input-active');
};
oTinput.prototype.showFileInput = function(){
    $(this.element).find('.ext-input-field').hide();
    $(this.element).removeClass('ext-input-active');
};

}());;/*! otplayer v1.1.0 */
(function(){
'use strict';

var oTplayer = function(opts){
    var that = this;
    
    this.container = opts.container;
    this.buttons = opts.buttons || {};
    this.skipTime = opts.skipTime || 1.5;
    this._rewindOnPlay = opts.rewindOnPlay || true;
    this._onReady = opts.onReady || function(){};
    this._onChange = opts.onChange || function(){};
    this._onDisableSpeedChange = opts.onDisableSpeedChange || function(){};
    this._setupSpeed(opts);
    
    this.source = opts.source;
    
    if (typeof this.source === 'undefined') {
        throw('must specify source (URL or file object) in config');
    }
    if (typeof this.container === 'undefined') {
        throw('must specify container element');
    }
    
    if (opts.startpoint) {
        this._startPoint = opts.startpoint;
    }
    
    this.paused = true;
    this._addClickEvents();

    if (this.source.indexOf && this.parseYoutubeURL(this.source)) {
        // youtube URL detected
        this.format = 'youtube';
        $('#player-time').hide();
        this._buildYoutube();
    } else {
        var url;
        if (this.source.indexOf) {
            // URL string detected
            url = this.source;
            if (this._isVideoFormat(url)) {
                this.format = 'video';
            } else {
                this.format = 'audio';
            }
            this.title = url.split('/')[url.split('/').length];
        } else {
            // assume file upload
            url = this._createObjectURL(this.source);
            if ( this.source.type.indexOf("video") > -1 ) {
                this.format = 'video';
            } else {
                this.format = 'audio';
            }
            this.title = this.source.name;
        }
        this._buildMediaElement(url);
        this._initProgressor();
    }
    if (this._startPoint) {
        this.skipTo(this._startPoint);
    }
    this._onReady();    
};

window.oTplayer = oTplayer;

oTplayer.prototype._setupSpeed = function(opts){

    this.speedMin = opts.speedMin || 0.5;
    this.speedMax = opts.speedMax || 2;
    this._setSpeedIncrement( opts.speedIncrement || 0.25 ); 
        
    if (this.buttons.speedSlider) {
        $(this.buttons.speedSlider)
        .attr('min',this.speedMin)
        .attr('max',this.speedMax);
    }
        
};


oTplayer.prototype._isVideoFormat = function(url){
    var urlSplt = url.split('.');
    var format = urlSplt[urlSplt.length-1];
    return !!format.match(/mov|mp4|avi|webm/);
};

oTplayer.prototype._setSpeedIncrement = function(incr){
    this.speedIncrement = incr;
    if (this.buttons.speedSlider) {
        this.buttons.speedSlider.setAttribute('step',incr);
    }
};

oTplayer.prototype._initProgressor = function(){
    if ((typeof Progressor !== 'undefined') && (this.format !== 'youtube')) {
        this.progressBar = new Progressor({
            media : this.element,
            bar : $('#player-hook')[0],
            text : this.title,
            time : $('#player-time')[0]
        });
    }
};

oTplayer.prototype._createObjectURL = function(file){
    if (window.webkitURL) {
        return window.webkitURL.createObjectURL(file);
    } else {
        return window.URL.createObjectURL(file);      
    }
};
oTplayer.prototype._buildMediaElement = function(url){
    this.element = document.createElement( this.format );
    this.element.src = url;
    this.element.id = 'oTplayerEl';
    if (this.format === 'video') {
        document.body.appendChild(this.element);
    } else {
        this.container.appendChild(this.element); 
    }
};
oTplayer.prototype.remove = function(){
    $(this.element).remove();
};
oTplayer.prototype.pause = function(){
    var playPauseButton = $(this.buttons.playPause);
    playPauseButton.removeClass('playing');
    if(this.format === 'youtube') {
        try {
            this._ytEl.pauseVideo();
        } catch (err) {
            //
        }
    } else if (this.element) {
        this.element.pause();
    }
    this.paused = true;
    this._onChange('pause');
};
oTplayer.prototype.play = function(){
    var playPauseButton = $(this.buttons.playPause);
    if (this._rewindOnPlay) {
        this.skip('backwards');
    }
    if(this.format === 'youtube') {
        try {
            this._ytEl.playVideo();
            this.paused = false;
            playPauseButton.addClass('playing');
        } catch(err) {
            //
        }
    } else if (this.element) {
        this.element.play();
        this.paused = false;
        playPauseButton.addClass('playing');
    }
    this._onChange('play');
};
oTplayer.prototype.playPause = function(){
    if (this.paused === false){
        this.pause();
    } else {
        this.play();
    }
};
oTplayer.prototype.skipTo = function(time){
    try {
        if (this.format === 'youtube') {
            this._ytEl.seekTo( time );
        } else {
           this.element.currentTime = time;
        }    
    } catch (err) {
        //
    }
    this._onChange('skipTo');
};
oTplayer.prototype.setTime = oTplayer.prototype.skipTo;
oTplayer.prototype.skip = function(direction){
    var mod = 1;
    if (direction === "backwards"){
        mod = -1;
    }
    this.skipTo( this.getTime() + (this.skipTime*mod) );
};
oTplayer.prototype.speed = function(newSpeed){
    var el = this.element;
    if (this.format === 'youtube') {
        el = this._ytEl;
    }
    var min = this.speedMin;
    var max = this.speedMax;
    var step = this.speedIncrement;
    
    var newSpeedNumber;
    var currentSpeed = this.getSpeed();
    if ((newSpeed === "up") && (currentSpeed < max)){
        newSpeedNumber = currentSpeed+step;
    } else if ((newSpeed === "down") && (currentSpeed > min)){
        newSpeedNumber = currentSpeed-step;
    } else if (newSpeed === "reset"){
        newSpeedNumber = 1;
    } else if (typeof newSpeed === 'number') {
        newSpeedNumber = newSpeed;
    }
    if (el && newSpeedNumber) {
       el.playbackRate = newSpeedNumber;
        if (el.setPlaybackRate) {
            el.setPlaybackRate(newSpeedNumber);
        }
        if (this.buttons.speedSlider) {
            this.buttons.speedSlider.value = newSpeedNumber;
        }
    }
    this._onChange('speed');
};
oTplayer.prototype.getSpeed = function(){
    if ((this.format === 'youtube') && this._ytEl && this._ytEl.getPlaybackRate) {
        return this._ytEl.getPlaybackRate();
    } else if (this.format === 'youtube'){
        return 1;
    }
    if (this.element) {
        return this.element.playbackRate;
    }
};
oTplayer.prototype.getTime = function(){
    var that = this;
    if ((this.format === 'youtube') && this._ytEl && this._ytEl.getCurrentTime) {
        return this._ytEl.getCurrentTime();
    } else if (this.element && this.element.currentTime) {
        return this.element.currentTime;
    }
    return 0;
};
oTplayer.prototype.getDuration = function(){
    if (this.element) {
        return this.element.duration;
    }
};

oTplayer.prototype.reset = function(){
    this._onChange = function(){};
    this.speed("reset");
    this.element = undefined;
    this._ytEl = undefined;
    if (this.progressBar) {
        try {
            this.progressBar.remove();
        } catch (err) {}
    }
    $('#oTplayerEl').remove();
    $('#player-time').show();
    $('#player-hook').removeClass('progressor media-title media-titleprogressor').empty();
};
oTplayer.prototype.remove = oTplayer.prototype.reset;

oTplayer.prototype._addClickEvents = function(){
    var that = this;
    var buttons = this.buttons;
    $(buttons.playPause).click(function(){
        that.playPause();
    });
    $(this.buttons.speedSlider).change(function(){
        that.speed(this.valueAsNumber);
    });
};


oTplayer.prototype.disableSpeedChange = function(){
    this.speed = function(){
        return false;
    };
    this.speedChangeDisabled = true;
    this._onDisableSpeedChange();
};





oTplayer.prototype._youtubeReady = function(){
    var that = this;
    
    var videoId = this.parseYoutubeURL(this.source);
    this._ytEl = new YT.Player('oTplayerEl', {
        width: '100%',
        videoId: videoId,
        playerVars: {
            // controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1
        },
        events: {
            'onReady': this._youtubeReadyPartTwo.bind(this),
            'onStateChange': updatePause
        }
    });
    
    this._setYoutubeTitle(videoId);
        
    // YouTube embeds can't do 0.25 increments
    if (this.buttons.speedSlider) {
        this._setSpeedIncrement(0.5);
    }
    
    function updatePause (ev){
        var status = ev.data;
        if (status === 2) {
            that.paused = true;
        } else {
            that.paused = false;
        }
    }
    
};

oTplayer.prototype._youtubeReadyPartTwo = function(){
    // fix non-responsive keyboard shortcuts bug
    $(this.buttons.speedSlider).val(0.5).change().val(1).change();
    
    // Some YouTube embeds only support normal speed
    if (this._ytEl.getAvailablePlaybackRates()[0] === 1) {
        this.disableSpeedChange();
    }
    
    this.element.duration = this._ytEl.getDuration();
    this._onReady();
    

    var that = this;
    
    setTimeout(function(){
        // kickstart youtube
        that.play();
        setTimeout(function(){
            that.pause();
            if (this._startPoint) {
                setTimeout(function(){
                    that.seekTo( this._startPoint );
                },500);
            }
        },500);
        
    },1000);

};


oTplayer.prototype._buildYoutube = function(url){
    var that = this;
    this.url = url;
    
    this.element = document.createElement('div');
    this.element.setAttribute('id','oTplayerEl');
    document.body.appendChild(this.element); 
        
    // import YouTube API
    if ( window.YT === undefined ) {
        var tag = document.createElement('script');
        tag.setAttribute('id','youtube-script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
        this._youtubeReady();
    }
    window.onYouTubeIframeAPIReady = this._youtubeReady.bind(this);        
};

oTplayer.prototype.parseYoutubeURL = function(url){
    if (url.match) {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match&&match[2].length===11){
            return match[2];
        }
    }
    return false;
};
oTplayer.parseYoutubeURL = oTplayer.prototype.parseYoutubeURL;

oTplayer.prototype._setYoutubeTitle = function(id){
    var url = 'http://gdata.youtube.com/feeds/api/videos/'+id+'?v=2&alt=json-in-script&callback=?';
    $.ajax({
       type: 'GET',
        url: url,
        async: false,
        jsonpCallback: 'jsonCallback',
        contentType: "application/json",
        dataType: 'jsonp',
        success: function(d) {
            var title = '[YouTube] '+d.entry.title.$t;
            this.title = title;
            $('#player-hook').html(title).addClass('media-title');
        },
        error: function(e){
            console.log(e);
        }
    });
};
}());;function Progressor( options ){
    this._media = options.media;
    this._bar = options.bar;
    this._text = options.text;
    this._time = options.time;
    this.initProgressBar();
    this.initMedia();
};


Progressor.prototype.initMedia = function() {
    this._media.addEventListener('timeupdate', this.updateProgress.bind(this), false);
    this._media.addEventListener('timeupdate', this.updateTimeCount.bind(this), false);
    this.addClickEvents();
    this.updateTimeCount(this._media);
};

Progressor.prototype.initProgressBar = function(){
    this._textBox = document.createElement('span');
    this._textBox.textContent = this._text || "";
    this._bar.style.position = "relative";
    this._bar.style.zIndex = 1;
    this._bar.className = this._bar.className + " progressor";
    
    this._progress = document.createElement('div');
    this._progress.className = "progressor-progress";
    this._progress.style.width = "0%";
    this._progress.style.height = "100%";
    this._progress.style.position = "absolute";
    this._progress.style.top = 0;
    this._progress.style.zIndex = -1;
    
    this._bar.style.webkitUserSelect = "none";
    this._bar.style.userSelect = "none";
    this._bar.appendChild ( this._textBox );
    this._bar.appendChild( this._progress );
};

Progressor.prototype.updateProgress = function() {
    this.updateTimeCount();
    var value = 0;
    if (this._media.currentTime > 0) {
        value = Math.floor((100 / this._media.duration) * this._media.currentTime);
    }
    // this._bar.getElementsByTagName('div')[0].clientWidth = value + "%";
    this._bar.getElementsByTagName('div')[0].style.width = value + "%";
};

Progressor.prototype.formatTime = function ( time ) {
    var minutes = Math.floor(time / 60);
    var seconds = ("0" + Math.round( time - minutes * 60 ) ).slice(-2);
    return minutes+":"+seconds;    
}

Progressor.prototype.updateTimeCount = function(){
    if ( this._time ) {
        var currTime = this.formatTime ( this._media.currentTime );
        var totalTime = this.formatTime ( this._media.duration );
        if ( isNaN( this._media.duration ) === true ) { totalTime = "00:00" };
        this._time.innerHTML = currTime + "/" + totalTime;        
    }
};


Progressor.prototype.timeFromCursorPosition = function(element, event, duration){
    var dimensions = element.getBoundingClientRect();
    var pixelsOfBar = event.clientX - dimensions.left;
    var percentToSecs = pixelsOfBar / dimensions.width;
    return percentToSecs * duration;
};

Progressor.prototype.setMediaProgress = function(event){
    this._media.currentTime = this.timeFromCursorPosition(
        this._bar,
        event,
        this._media.duration
    );
    this.updateProgress();
    
};

Progressor.prototype.remove = function(){
    function clearEvents(oldElement){
        var newElement = oldElement.cloneNode(true);
        oldElement.parentNode.replaceChild(newElement, oldElement);
    }
    this._time.innerHTML = "";
    this._bar.removeChild(this._textBox);
    this._bar.removeChild(this._progress);
    this._bar.style.position = "";
    this._bar.style.zIndex = "";
    this._bar.style.webkitUserSelect = "";
    this._bar.style.userSelect = "";
    this._bar.classList.remove("progressor");
    clearEvents( this._bar );
    clearEvents( this._media );
}

Progressor.prototype.addClickEvents = function(){
    var isMouseDown = false,
        wasPlaying = false,
        mouseEventRefresh = '';
    var mouseDown = function(e){
        isMouseDown = true;
        wasPlaying = !this._media.paused;
        this._media.pause();
        this.setMediaProgress(e);
    }
    var mouseUp = function(e){
        clearInterval(mouseEventRefresh);
        isMouseDown = false;
        if (wasPlaying == true) {
            this._media.play();
            wasPlaying = false;
        };
    }
    var mouseMove = function(e){
        if ( isMouseDown === true ) {
            mouseEventRefresh = setInterval( this.setMediaProgress(e) , 1000 );   
        }
    }
    this._bar.addEventListener("mousedown", mouseDown.bind(this) );
    document.addEventListener("mouseup", mouseUp.bind(this) );
    document.addEventListener("mousemove", mouseMove.bind(this) );
};

var progressor = {
    init : function(){
        console.error("'progressor.init()' is deprecated. Please use 'Progressor()'.");
    }
};/* localStorageManager v0.2.1 */
;(function(){
'use strict';

var localStorageManager = {
    identifier: 'localStorageManager',
    setItem: function(key,value){
        var that = this;
        var now = new Date().getTime();
        var valueWithMetadata = {
            value: value,
            timestamp: now
        };
        try {
            localStorage.setItem(
                this.identifier+'_'+key,
                JSON.stringify(valueWithMetadata)
            );
            this.full = false;
        } catch (err) {
            var error = err.name;
            // Possible error names:
            // NS_ERROR_DOM_QUOTA_REACHED
            // QuotaExceededError
            this.full = true;
        }
        if (this.full) {
            if (
                !this._lastRanOnFull && this.onFull &&
                !((now - this._lastRanOnFull) < 1000)
            ) {
                this.onFull();
                this._lastRanOnFull = now;
            }
            this.clearOldest( function(){
                that.setItem(key, value);
            } );
        }
    },
    getItem: function(key, prefix){
        prefix = prefix || this.identifier+'_';
        var parsed = this.getItemMetadata(key, prefix);
        if (parsed && parsed.value) {
            return parsed.value;
        } else {
            return null;
        }
    },
    getItemMetadata: function(key, prefix){
        if (prefix === undefined) {
            prefix = this.identifier+'_';
        }
        var raw = localStorage.getItem(prefix+key);
        if ((raw === null) || (raw === undefined)) {
            return null;
        }
        var parsed = JSON.parse(raw);
        parsed.key = key;
        if (parsed && parsed.value) {
            return parsed;
        }
        return null;
        
    },
    removeItem: function(key){
        localStorage.removeItem(this.identifier+'_'+key);
    },
    getAll: function(opts){
        opts = opts || {};
        var result_obj = {};
        var result_arr = [];
        for (var i = 0; i < localStorage.length; i++) {
            var item = undefined;
            var key = localStorage.key(i);
            if (opts.all === true) {
                item = this.getItemMetadata(key,'');
            } else if (key.indexOf(this.identifier) > -1) {
                item = this.getItemMetadata(key,'');
            }
            key = key.replace(this.identifier+'_','');
            if (item) {
                result_obj[key] = item.value || item;
                result_arr.push({
                    key: key,
                    value: item.value || item,
                    timestamp: item.timestamp || null,
                    index: i
                });
            }
        }
        result_arr.sort(function(a,b){
            if (a.timestamp !== b.timestamp) {
                return a.timestamp - b.timestamp;
            } else {
                return a.index - b.index;
            }
        })
        if (opts.format === 'array') {
            return result_arr;
        } else {
            return result_obj;
        }
    },
    getArray: function(opts){
        opts = opts || {};
        opts.format = 'array';
        return this.getAll(opts);
    },
    getFirst: function(){
        var arr = this.getArray();
        return arr[0];
    },
    clearOldest: function(callback){
        if (this.full !== true) {
            return;
        }
        var array = this.getArray();
        for (var i = 0; i < 3; i++) {
            if (array[i]) {
                localStorageManager.removeItem( array[i].key );
            }
        }
        var testKey = this.identifier+'__test_'+new Date().getTime();
        try {
            localStorage.setItem(testKey,'A');
            // assumes test passes...
            this.full = false;
            this.saveAttempts = 0;
            if (callback) { callback(); }
        } catch (err) {
            this.saveAttempts += 1;
            if (this.saveAttempts < 10) {
                this.clearOldest(callback);
            } else if (this.onSaveFailure) {
                this.onSaveFailure();
            }
        }
        localStorage.removeItem(testKey);
    },
    saveAttempts: 0
}

window.localStorageManager = localStorageManager;

}());;/*global define:false */
/**
 * Copyright 2015 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.5.2
 * @url craig.is/killing/mice
 */
(function(window, document, undefined) {

    /**
     * mapping of special keycodes to their corresponding keys
     *
     * everything in this dictionary cannot use keypress events
     * so it has to be here to map to the correct keycodes for
     * keyup/keydown events
     *
     * @type {Object}
     */
    var _MAP = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        20: 'capslock',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'ins',
        46: 'del',
        91: 'meta',
        93: 'meta',
        224: 'meta'
    };

    /**
     * mapping for special characters so they can support
     *
     * this dictionary is only used incase you want to bind a
     * keyup or keydown event to one of these keys
     *
     * @type {Object}
     */
    var _KEYCODE_MAP = {
        106: '*',
        107: '+',
        109: '-',
        110: '.',
        111 : '/',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: '\''
    };

    /**
     * this is a mapping of keys that require shift on a US keypad
     * back to the non shift equivelents
     *
     * this is so you can use keyup events with these keys
     *
     * note that this will only work reliably on US keyboards
     *
     * @type {Object}
     */
    var _SHIFT_MAP = {
        '~': '`',
        '!': '1',
        '@': '2',
        '#': '3',
        '$': '4',
        '%': '5',
        '^': '6',
        '&': '7',
        '*': '8',
        '(': '9',
        ')': '0',
        '_': '-',
        '+': '=',
        ':': ';',
        '\"': '\'',
        '<': ',',
        '>': '.',
        '?': '/',
        '|': '\\'
    };

    /**
     * this is a list of special strings you can use to map
     * to modifier keys when you specify your keyboard shortcuts
     *
     * @type {Object}
     */
    var _SPECIAL_ALIASES = {
        'option': 'alt',
        'command': 'meta',
        'return': 'enter',
        'escape': 'esc',
        'plus': '+',
        'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
    };

    /**
     * variable to store the flipped version of _MAP from above
     * needed to check if we should use keypress or not when no action
     * is specified
     *
     * @type {Object|undefined}
     */
    var _REVERSE_MAP;

    /**
     * loop through the f keys, f1 to f19 and add them to the map
     * programatically
     */
    for (var i = 1; i < 20; ++i) {
        _MAP[111 + i] = 'f' + i;
    }

    /**
     * loop through to map numbers on the numeric keypad
     */
    for (i = 0; i <= 9; ++i) {
        _MAP[i + 96] = i;
    }

    /**
     * cross browser add event method
     *
     * @param {Element|HTMLDocument} object
     * @param {string} type
     * @param {Function} callback
     * @returns void
     */
    function _addEvent(object, type, callback) {
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
            return;
        }

        object.attachEvent('on' + type, callback);
    }

    /**
     * takes the event and returns the key character
     *
     * @param {Event} e
     * @return {string}
     */
    function _characterFromEvent(e) {

        // for keypress events we should return the character as is
        if (e.type == 'keypress') {
            var character = String.fromCharCode(e.which);

            // if the shift key is not pressed then it is safe to assume
            // that we want the character to be lowercase.  this means if
            // you accidentally have caps lock on then your key bindings
            // will continue to work
            //
            // the only side effect that might not be desired is if you
            // bind something like 'A' cause you want to trigger an
            // event when capital A is pressed caps lock will no longer
            // trigger the event.  shift+a will though.
            if (!e.shiftKey) {
                character = character.toLowerCase();
            }

            return character;
        }

        // for non keypress events the special maps are needed
        if (_MAP[e.which]) {
            return _MAP[e.which];
        }

        if (_KEYCODE_MAP[e.which]) {
            return _KEYCODE_MAP[e.which];
        }

        // if it is not in the special map

        // with keydown and keyup events the character seems to always
        // come in as an uppercase character whether you are pressing shift
        // or not.  we should make sure it is always lowercase for comparisons
        return String.fromCharCode(e.which).toLowerCase();
    }

    /**
     * checks if two arrays are equal
     *
     * @param {Array} modifiers1
     * @param {Array} modifiers2
     * @returns {boolean}
     */
    function _modifiersMatch(modifiers1, modifiers2) {
        return modifiers1.sort().join(',') === modifiers2.sort().join(',');
    }

    /**
     * takes a key event and figures out what the modifiers are
     *
     * @param {Event} e
     * @returns {Array}
     */
    function _eventModifiers(e) {
        var modifiers = [];

        if (e.shiftKey) {
            modifiers.push('shift');
        }

        if (e.altKey) {
            modifiers.push('alt');
        }

        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }

        if (e.metaKey) {
            modifiers.push('meta');
        }

        return modifiers;
    }

    /**
     * prevents default for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _preventDefault(e) {
        if (e.preventDefault) {
            e.preventDefault();
            return;
        }

        e.returnValue = false;
    }

    /**
     * stops propogation for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _stopPropagation(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
            return;
        }

        e.cancelBubble = true;
    }

    /**
     * determines if the keycode specified is a modifier key or not
     *
     * @param {string} key
     * @returns {boolean}
     */
    function _isModifier(key) {
        return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
    }

    /**
     * reverses the map lookup so that we can look for specific keys
     * to see what can and can't use keypress
     *
     * @return {Object}
     */
    function _getReverseMap() {
        if (!_REVERSE_MAP) {
            _REVERSE_MAP = {};
            for (var key in _MAP) {

                // pull out the numeric keypad from here cause keypress should
                // be able to detect the keys from the character
                if (key > 95 && key < 112) {
                    continue;
                }

                if (_MAP.hasOwnProperty(key)) {
                    _REVERSE_MAP[_MAP[key]] = key;
                }
            }
        }
        return _REVERSE_MAP;
    }

    /**
     * picks the best action based on the key combination
     *
     * @param {string} key - character for key
     * @param {Array} modifiers
     * @param {string=} action passed in
     */
    function _pickBestAction(key, modifiers, action) {

        // if no action was picked in we should try to pick the one
        // that we think would work best for this key
        if (!action) {
            action = _getReverseMap()[key] ? 'keydown' : 'keypress';
        }

        // modifier keys don't work as expected with keypress,
        // switch to keydown
        if (action == 'keypress' && modifiers.length) {
            action = 'keydown';
        }

        return action;
    }

    /**
     * Converts from a string key combination to an array
     *
     * @param  {string} combination like "command+shift+l"
     * @return {Array}
     */
    function _keysFromString(combination) {
        if (combination === '+') {
            return ['+'];
        }

        combination = combination.replace(/\+{2}/g, '+plus');
        return combination.split('+');
    }

    /**
     * Gets info for a specific key combination
     *
     * @param  {string} combination key combination ("command+s" or "a" or "*")
     * @param  {string=} action
     * @returns {Object}
     */
    function _getKeyInfo(combination, action) {
        var keys;
        var key;
        var i;
        var modifiers = [];

        // take the keys from this pattern and figure out what the actual
        // pattern is all about
        keys = _keysFromString(combination);

        for (i = 0; i < keys.length; ++i) {
            key = keys[i];

            // normalize key names
            if (_SPECIAL_ALIASES[key]) {
                key = _SPECIAL_ALIASES[key];
            }

            // if this is not a keypress event then we should
            // be smart about using shift keys
            // this will only work for US keyboards however
            if (action && action != 'keypress' && _SHIFT_MAP[key]) {
                key = _SHIFT_MAP[key];
                modifiers.push('shift');
            }

            // if this key is a modifier then add it to the list of modifiers
            if (_isModifier(key)) {
                modifiers.push(key);
            }
        }

        // depending on what the key combination is
        // we will try to pick the best event for it
        action = _pickBestAction(key, modifiers, action);

        return {
            key: key,
            modifiers: modifiers,
            action: action
        };
    }

    function _belongsTo(element, ancestor) {
        if (element === null || element === document) {
            return false;
        }

        if (element === ancestor) {
            return true;
        }

        return _belongsTo(element.parentNode, ancestor);
    }

    function Mousetrap(targetElement) {
        var self = this;

        targetElement = targetElement || document;

        if (!(self instanceof Mousetrap)) {
            return new Mousetrap(targetElement);
        }

        /**
         * element to attach key events to
         *
         * @type {Element}
         */
        self.target = targetElement;

        /**
         * a list of all the callbacks setup via Mousetrap.bind()
         *
         * @type {Object}
         */
        self._callbacks = {};

        /**
         * direct map of string combinations to callbacks used for trigger()
         *
         * @type {Object}
         */
        self._directMap = {};

        /**
         * keeps track of what level each sequence is at since multiple
         * sequences can start out with the same sequence
         *
         * @type {Object}
         */
        var _sequenceLevels = {};

        /**
         * variable to store the setTimeout call
         *
         * @type {null|number}
         */
        var _resetTimer;

        /**
         * temporary state where we will ignore the next keyup
         *
         * @type {boolean|string}
         */
        var _ignoreNextKeyup = false;

        /**
         * temporary state where we will ignore the next keypress
         *
         * @type {boolean}
         */
        var _ignoreNextKeypress = false;

        /**
         * are we currently inside of a sequence?
         * type of action ("keyup" or "keydown" or "keypress") or false
         *
         * @type {boolean|string}
         */
        var _nextExpectedAction = false;

        /**
         * resets all sequence counters except for the ones passed in
         *
         * @param {Object} doNotReset
         * @returns void
         */
        function _resetSequences(doNotReset) {
            doNotReset = doNotReset || {};

            var activeSequences = false,
                key;

            for (key in _sequenceLevels) {
                if (doNotReset[key]) {
                    activeSequences = true;
                    continue;
                }
                _sequenceLevels[key] = 0;
            }

            if (!activeSequences) {
                _nextExpectedAction = false;
            }
        }

        /**
         * finds all callbacks that match based on the keycode, modifiers,
         * and action
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event|Object} e
         * @param {string=} sequenceName - name of the sequence we are looking for
         * @param {string=} combination
         * @param {number=} level
         * @returns {Array}
         */
        function _getMatches(character, modifiers, e, sequenceName, combination, level) {
            var i;
            var callback;
            var matches = [];
            var action = e.type;

            // if there are no events related to this keycode
            if (!self._callbacks[character]) {
                return [];
            }

            // if a modifier key is coming up on its own we should allow it
            if (action == 'keyup' && _isModifier(character)) {
                modifiers = [character];
            }

            // loop through all callbacks for the key that was pressed
            // and see if any of them match
            for (i = 0; i < self._callbacks[character].length; ++i) {
                callback = self._callbacks[character][i];

                // if a sequence name is not specified, but this is a sequence at
                // the wrong level then move onto the next match
                if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
                    continue;
                }

                // if the action we are looking for doesn't match the action we got
                // then we should keep going
                if (action != callback.action) {
                    continue;
                }

                // if this is a keypress event and the meta key and control key
                // are not pressed that means that we need to only look at the
                // character, otherwise check the modifiers as well
                //
                // chrome will not fire a keypress if meta or control is down
                // safari will fire a keypress if meta or meta+shift is down
                // firefox will fire a keypress if meta or control is down
                if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {

                    // when you bind a combination or sequence a second time it
                    // should overwrite the first one.  if a sequenceName or
                    // combination is specified in this call it does just that
                    //
                    // @todo make deleting its own method?
                    var deleteCombo = !sequenceName && callback.combo == combination;
                    var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
                    if (deleteCombo || deleteSequence) {
                        self._callbacks[character].splice(i, 1);
                    }

                    matches.push(callback);
                }
            }

            return matches;
        }

        /**
         * actually calls the callback function
         *
         * if your callback function returns false this will use the jquery
         * convention - prevent default and stop propogation on the event
         *
         * @param {Function} callback
         * @param {Event} e
         * @returns void
         */
        function _fireCallback(callback, e, combo, sequence) {

            // if this event should not happen stop here
            if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
                return;
            }

            if (callback(e, combo) === false) {
                _preventDefault(e);
                _stopPropagation(e);
            }
        }

        /**
         * handles a character key event
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event} e
         * @returns void
         */
        self._handleKey = function(character, modifiers, e) {
            var callbacks = _getMatches(character, modifiers, e);
            var i;
            var doNotReset = {};
            var maxLevel = 0;
            var processedSequenceCallback = false;

            // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
            for (i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].seq) {
                    maxLevel = Math.max(maxLevel, callbacks[i].level);
                }
            }

            // loop through matching callbacks for this key event
            for (i = 0; i < callbacks.length; ++i) {

                // fire for all sequence callbacks
                // this is because if for example you have multiple sequences
                // bound such as "g i" and "g t" they both need to fire the
                // callback for matching g cause otherwise you can only ever
                // match the first one
                if (callbacks[i].seq) {

                    // only fire callbacks for the maxLevel to prevent
                    // subsequences from also firing
                    //
                    // for example 'a option b' should not cause 'option b' to fire
                    // even though 'option b' is part of the other sequence
                    //
                    // any sequences that do not match here will be discarded
                    // below by the _resetSequences call
                    if (callbacks[i].level != maxLevel) {
                        continue;
                    }

                    processedSequenceCallback = true;

                    // keep a list of which sequences were matches for later
                    doNotReset[callbacks[i].seq] = 1;
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
                    continue;
                }

                // if there were no sequence matches but we are still here
                // that means this is a regular match so we should fire that
                if (!processedSequenceCallback) {
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
                }
            }

            // if the key you pressed matches the type of sequence without
            // being a modifier (ie "keyup" or "keypress") then we should
            // reset all sequences that were not matched by this event
            //
            // this is so, for example, if you have the sequence "h a t" and you
            // type "h e a r t" it does not match.  in this case the "e" will
            // cause the sequence to reset
            //
            // modifier keys are ignored because you can have a sequence
            // that contains modifiers such as "enter ctrl+space" and in most
            // cases the modifier key will be pressed before the next key
            //
            // also if you have a sequence such as "ctrl+b a" then pressing the
            // "b" key will trigger a "keypress" and a "keydown"
            //
            // the "keydown" is expected when there is a modifier, but the
            // "keypress" ends up matching the _nextExpectedAction since it occurs
            // after and that causes the sequence to reset
            //
            // we ignore keypresses in a sequence that directly follow a keydown
            // for the same character
            var ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
            if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
                _resetSequences(doNotReset);
            }

            _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
        };

        /**
         * handles a keydown event
         *
         * @param {Event} e
         * @returns void
         */
        function _handleKeyEvent(e) {

            // normalize e.which for key events
            // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
            if (typeof e.which !== 'number') {
                e.which = e.keyCode;
            }

            var character = _characterFromEvent(e);

            // no character found then stop
            if (!character) {
                return;
            }

            // need to use === for the character check because the character can be 0
            if (e.type == 'keyup' && _ignoreNextKeyup === character) {
                _ignoreNextKeyup = false;
                return;
            }

            self.handleKey(character, _eventModifiers(e), e);
        }

        /**
         * called to set a 1 second timeout on the specified sequence
         *
         * this is so after each key press in the sequence you have 1 second
         * to press the next key before you have to start over
         *
         * @returns void
         */
        function _resetSequenceTimer() {
            clearTimeout(_resetTimer);
            _resetTimer = setTimeout(_resetSequences, 1000);
        }

        /**
         * binds a key sequence to an event
         *
         * @param {string} combo - combo specified in bind call
         * @param {Array} keys
         * @param {Function} callback
         * @param {string=} action
         * @returns void
         */
        function _bindSequence(combo, keys, callback, action) {

            // start off by adding a sequence level record for this combination
            // and setting the level to 0
            _sequenceLevels[combo] = 0;

            /**
             * callback to increase the sequence level for this sequence and reset
             * all other sequences that were active
             *
             * @param {string} nextAction
             * @returns {Function}
             */
            function _increaseSequence(nextAction) {
                return function() {
                    _nextExpectedAction = nextAction;
                    ++_sequenceLevels[combo];
                    _resetSequenceTimer();
                };
            }

            /**
             * wraps the specified callback inside of another function in order
             * to reset all sequence counters as soon as this sequence is done
             *
             * @param {Event} e
             * @returns void
             */
            function _callbackAndReset(e) {
                _fireCallback(callback, e, combo);

                // we should ignore the next key up if the action is key down
                // or keypress.  this is so if you finish a sequence and
                // release the key the final key will not trigger a keyup
                if (action !== 'keyup') {
                    _ignoreNextKeyup = _characterFromEvent(e);
                }

                // weird race condition if a sequence ends with the key
                // another sequence begins with
                setTimeout(_resetSequences, 10);
            }

            // loop through keys one at a time and bind the appropriate callback
            // function.  for any key leading up to the final one it should
            // increase the sequence. after the final, it should reset all sequences
            //
            // if an action is specified in the original bind call then that will
            // be used throughout.  otherwise we will pass the action that the
            // next key in the sequence should match.  this allows a sequence
            // to mix and match keypress and keydown events depending on which
            // ones are better suited to the key provided
            for (var i = 0; i < keys.length; ++i) {
                var isFinal = i + 1 === keys.length;
                var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
                _bindSingle(keys[i], wrappedCallback, action, combo, i);
            }
        }

        /**
         * binds a single keyboard combination
         *
         * @param {string} combination
         * @param {Function} callback
         * @param {string=} action
         * @param {string=} sequenceName - name of sequence if part of sequence
         * @param {number=} level - what part of the sequence the command is
         * @returns void
         */
        function _bindSingle(combination, callback, action, sequenceName, level) {

            // store a direct mapped reference for use with Mousetrap.trigger
            self._directMap[combination + ':' + action] = callback;

            // make sure multiple spaces in a row become a single space
            combination = combination.replace(/\s+/g, ' ');

            var sequence = combination.split(' ');
            var info;

            // if this pattern is a sequence of keys then run through this method
            // to reprocess each pattern one key at a time
            if (sequence.length > 1) {
                _bindSequence(combination, sequence, callback, action);
                return;
            }

            info = _getKeyInfo(combination, action);

            // make sure to initialize array if this is the first time
            // a callback is added for this key
            self._callbacks[info.key] = self._callbacks[info.key] || [];

            // remove an existing match if there is one
            _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

            // add this call back to the array
            // if it is a sequence put it at the beginning
            // if not put it at the end
            //
            // this is important because the way these are processed expects
            // the sequence ones to come first
            self._callbacks[info.key][sequenceName ? 'unshift' : 'push']({
                callback: callback,
                modifiers: info.modifiers,
                action: info.action,
                seq: sequenceName,
                level: level,
                combo: combination
            });
        }

        /**
         * binds multiple combinations to the same callback
         *
         * @param {Array} combinations
         * @param {Function} callback
         * @param {string|undefined} action
         * @returns void
         */
        self._bindMultiple = function(combinations, callback, action) {
            for (var i = 0; i < combinations.length; ++i) {
                _bindSingle(combinations[i], callback, action);
            }
        };

        // start!
        _addEvent(targetElement, 'keypress', _handleKeyEvent);
        _addEvent(targetElement, 'keydown', _handleKeyEvent);
        _addEvent(targetElement, 'keyup', _handleKeyEvent);
    }

    /**
     * binds an event to mousetrap
     *
     * can be a single key, a combination of keys separated with +,
     * an array of keys, or a sequence of keys separated by spaces
     *
     * be sure to list the modifier keys first to make sure that the
     * correct key ends up getting bound (the last key in the pattern)
     *
     * @param {string|Array} keys
     * @param {Function} callback
     * @param {string=} action - 'keypress', 'keydown', or 'keyup'
     * @returns void
     */
    Mousetrap.prototype.bind = function(keys, callback, action) {
        var self = this;
        keys = keys instanceof Array ? keys : [keys];
        self._bindMultiple.call(self, keys, callback, action);
        return self;
    };

    /**
     * unbinds an event to mousetrap
     *
     * the unbinding sets the callback function of the specified key combo
     * to an empty function and deletes the corresponding key in the
     * _directMap dict.
     *
     * TODO: actually remove this from the _callbacks dictionary instead
     * of binding an empty function
     *
     * the keycombo+action has to be exactly the same as
     * it was defined in the bind method
     *
     * @param {string|Array} keys
     * @param {string} action
     * @returns void
     */
    Mousetrap.prototype.unbind = function(keys, action) {
        var self = this;
        return self.bind.call(self, keys, function() {}, action);
    };

    /**
     * triggers an event that has already been bound
     *
     * @param {string} keys
     * @param {string=} action
     * @returns void
     */
    Mousetrap.prototype.trigger = function(keys, action) {
        var self = this;
        if (self._directMap[keys + ':' + action]) {
            self._directMap[keys + ':' + action]({}, keys);
        }
        return self;
    };

    /**
     * resets the library back to its initial state.  this is useful
     * if you want to clear out the current keyboard shortcuts and bind
     * new ones - for example if you switch to another page
     *
     * @returns void
     */
    Mousetrap.prototype.reset = function() {
        var self = this;
        self._callbacks = {};
        self._directMap = {};
        return self;
    };

    /**
     * should we stop this event before firing off callbacks
     *
     * @param {Event} e
     * @param {Element} element
     * @return {boolean}
     */
    Mousetrap.prototype.stopCallback = function(e, element) {
        var self = this;

        // if the element has the class "mousetrap" then no need to stop
        if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
            return false;
        }

        if (_belongsTo(element, self.target)) {
            return false;
        }

        // stop for input, select, and textarea
        return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
    };

    /**
     * exposes _handleKey publicly so it can be overwritten by extensions
     */
    Mousetrap.prototype.handleKey = function() {
        var self = this;
        return self._handleKey.apply(self, arguments);
    };

    /**
     * Init the global mousetrap functions
     *
     * This method is needed to allow the global mousetrap functions to work
     * now that mousetrap is a constructor function.
     */
    Mousetrap.init = function() {
        var documentMousetrap = Mousetrap(document);
        for (var method in documentMousetrap) {
            if (method.charAt(0) !== '_') {
                Mousetrap[method] = (function(method) {
                    return function() {
                        return documentMousetrap[method].apply(documentMousetrap, arguments);
                    };
                } (method));
            }
        }
    };

    Mousetrap.init();

    // expose mousetrap to the global object
    window.Mousetrap = Mousetrap;

    // expose as a common js module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Mousetrap;
    }

    // expose mousetrap as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Mousetrap;
        });
    }
}) (window, document);
;// IE 8 shim for Date.now
if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}

oT.backup = {};

oT.backup.openPanel = function(){
    oT.backup.populatePanel();
    $('.backup-window').height( $('.textbox-container').height() * (3/5) );
    $('.backup-panel').fadeIn('fast');
}

oT.backup.closePanel = function(){
    $('.backup-panel').fadeOut('fast',function(){
        $('.backup-window').empty();
        
    });
}

oT.backup.generateBlock = function(ref){
    // create icon and 'restore' button
    var obj = localStorageManager.getItemMetadata(ref);
    var text = obj.value;
    var timestamp = obj.timestamp;
    var date = oT.backup.formatDate(timestamp);
    
    var block = document.createElement('div');
    var doc = document.createElement('div');
    var restoreButton = document.createElement('div');

    block.className = 'backup-block';
    doc.className = 'backup-doc';
    restoreButton.className = 'backup-restore-button';

    doc.innerHTML = text;
    var restoreText = document.webL10n.get('restore-button');
    restoreButton.innerHTML = date+' - <span onClick="oT.backup.restore('+timestamp+');">' +restoreText+ '</span>';
    block.appendChild(doc);
    block.appendChild(restoreButton);
    
    return block;
}

oT.backup.formatDate = function(timestamp){
    var d = new Date( parseFloat(timestamp) );
    var day =  d.getDate() + '/' + (d.getMonth()+1);
    var now = new Date();
    today = now.getDate() + '/' + (now.getMonth()+1);
    yesterday = (now.getDate()-1) + '/' + (now.getMonth()+1);
    if (day === today) {
        day = document.webL10n.get('today');
    } else if (day === yesterday) {
        day = document.webL10n.get('yesterday');
    }
    var time = d.getHours() + ':';
    if (d.getMinutes() < 10) {
        time += '0';        
    }
    time += d.getMinutes();
    
    formattedDate = day + ' ' + time;
    return formattedDate;
}

oT.backup.populatePanel = function(){
    oT.backup.addDocsToPanel(0,8);
    if (oT.backup.list().length === 0) {
        var noBackupsText = document.webL10n.get('no-backups');
        $('.backup-window').append( '<div class="no-backups">'+noBackupsText+'</div>' );
    }
}

oT.backup.addDocsToPanel = function(start,end){
    $('.more-backups').remove();
    var allDocs = oT.backup.list();
    docs = allDocs.slice(start,end);
    for (var i = 0; i < docs.length; i++) {
        $('.backup-window').append( oT.backup.generateBlock(docs[i]) );
    }
    if (allDocs[end]) {
        var loadMoreText = document.webL10n.get('more-backups');
        $('.backup-window').append( '<div class="more-backups" onclick="oT.backup.addDocsToPanel('+(end)+','+(end+8)+')" >'+loadMoreText+'</div>' );
    }
}

oT.backup.save = function(){
    // save current text to timestamped localStorageManager item
    var text = document.getElementById("textbox");
    var timestamp = new Date().getTime();
    localStorageManager.setItem('oTranscribe-backup-'+timestamp, text.innerHTML);
    // and bleep icon
    $('.sbutton.backup').addClass('flash');
    setTimeout(function(){
        $('.sbutton.backup').removeClass('flash');
    },1000);
    // and add to tray
    var newBlock = oT.backup.generateBlock('oTranscribe-backup-'+timestamp);
    newBlock.className += ' new-block';
    $('.backup-window').prepend( newBlock );
    $( newBlock ).animate({
        'opacity': 1,
        'width': '25%'
    },'slow',function(){
        $( newBlock ).find('.backup-restore-button').fadeIn();
    });
    oT.backup.trimToOneHundred();
}

oT.backup.trimToOneHundred = function(){
    var backups = oT.backup.list();
    if (backups.length < 100) {
        return;
    }
    for (var i = 0; i < backups.length; i++) {
        if (i > 99) {
            localStorageManager.removeItem(backups[i]);
        }
    }
}

oT.backup.init = function(saveUrl){
    oT.backup.saveUrl=saveUrl;

    localStorageManager.onFull = function(){
        var backupClearMessage = document.webL10n.get('backup-clear');
        oT.message.header( backupClearMessage );
    }
    localStorageManager.onSaveFailure = oT.backup.warning;
    oT.backup.migrate();
    oT.backup.autosaveInit();
    setInterval(function(){
        oT.backup.save();
    },300000 /* 5 minutes */);
}

oT.backup.modified=false;
oT.backup.notYetWarned = true;

oT.backup.warning = function(){
    var backupWarningMessage = document.webL10n.get('backup-error');
    if (oT.backup.notYetWarned === true) {
        oT.message.header( backupWarningMessage );
        oT.backup.notYetWarned = false;
    }
}

oT.backup.list = function(){
    var result = [];
    var ls = localStorageManager.getArray();
    for (var i = 0; i < ls.length; i++) {
        if (ls[i].key.indexOf('oTranscribe-backup') > -1) {
            result.push( ls[i].key );
        }
    }
    return result.sort().reverse();
}

oT.backup.restore = function(timestamp){
    oT.backup.save();
    var item = localStorageManager.getItem('oTranscribe-backup-'+timestamp);
    if ( item ) {
        var newText = item;
        oT.import.replaceTranscriptTextWith(newText);
    } else {
        var restoreErrorMessage = document.webL10n.get('restore-error');
        oT.message.header( restoreErrorMessage );
    }
    oT.backup.closePanel();
}

oT.backup.migrate = function(){
    // May 2015 - migration to localStorageManager
    if ( localStorage.getItem("autosave")) {        
       localStorageManager.setItem("autosave", localStorage.getItem("autosave") );
    }
    var backupList = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf('oTranscribe-backup') === 0) {
            var item = {
                value: localStorage.getItem( key ),
                timestamp: key.split('-')[2]
            };
            localStorage.setItem( 'localStorageManager_'+key, JSON.stringify(item) );
            localStorage.removeItem( key );
        }
    }
}

// original autosave function
oT.backup.autosaveInit = function(){
    // Get current timestamp
    var field = document.getElementById("textbox");
    oT.backup.lastSave = -1;
    oT.backup.lastModification = 0;
    oT.backup.saveFinished = true;

    field.addEventListener("input", function() {
        oT.backup.lastModification = Math.floor(Date.now() / 1000);
    }, false);


    $("#last-save-button").click(function(element) {
        oT.backup.autosaveVoxolab();
    });

    
    // load existing autosave (if present)
    //if ( localStorageManager.getItem("autosave")) {        
    //   field.innerHTML = localStorageManager.getItem("autosave");
    //}
    // autosave every 2 second - but wait five seconds before kicking in
    /**
    setTimeout(function(){
        // prevent l10n from replacing user text
        $('#textbox p[data-l10n-id]').attr('data-l10n-id','');
        setInterval(function(){
            oT.backup.autosaveVoxolab();
           localStorageManager.setItem("autosave", field.innerHTML);
        }, 2000);
    }, 5000);
    **/
}

// Voxolab additions //
//



oT.backup.tsToString = function(unix_timestamp) {
    // Create a new JavaScript Date object based on the timestamp
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date(unix_timestamp*1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();

    // Will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return formattedTime;
}

oT.backup.autosaveVoxolab = function() {
    if(oT.backup.lastModification >= oT.backup.lastSave) {
        var field = document.getElementById("textbox");
        if(oT.backup.saveFinished) {
            if(field.innerHTML.replace(/\s+/g, '') != '') {

                oT.backup.saveFinished = false;
                var button = $("#last-save-button>i");
                button.addClass('fa-spin');
                return $.ajax({
                    url: oT.backup.saveUrl,
                    type: 'PUT',
                    data: JSON.stringify({content:field.innerHTML, format:'otr'}),
                    contentType: 'application/json',
                    success : function(data, status){
                        oT.backup.lastSave = Math.floor(Date.now() / 1000);
                        $('#last-save').html(oT.backup.tsToString(oT.backup.lastSave));
                    },
                    complete : function(data, status) {
                        oT.backup.saveFinished = true;

                        button.removeClass('fa-spin');
                    }
                });
            }
        }
    }
}
;/******************************************
                 Export
******************************************/

oT.export = {};

oT.export.asFormat = function( format ){
    if (format === 'md') {
        var p = document.getElementById('textbox').innerHTML;
        var clean = $.htmlClean(p, {format:true, removeTags: ["div", "span", "img", "pre", "text"]});
        var x = toMarkdown( clean );   
        return x.replace(/\t/gm,"");           
    } else if (format === 'txt') {
        var p = document.getElementById('textbox').innerHTML;
        var clean = $.htmlClean(p, {format:true, removeTags:["div", "span", "img", "em", "strong", "p", "pre", "text"]});
        return clean.replace(/\t/gm,"");
    } else if (format === 'html') {
        var p = document.getElementById('textbox').innerHTML;
        var clean = $.htmlClean(p, {format:true, removeAttrs: ["style"]});
        return clean.replace('\n','');
    }
}

oT.export.placeButton = function ( format ){
    if (format === 'otr') {
        var doc = oT.export.createJsonFile();
        var a = document.getElementById('x-otr');
        a.download = exportText.name() + ".otr";
        a.href = "data:text/plain;base64," + exportText.utf8_to_b64( doc );
    }
}

var exportText = {
    utf8_to_b64 : function( str ) {
        return window.btoa(unescape(encodeURIComponent( str )));
    },
    // element choose element to append button to
    mdButton : function(element) {
        var md = oT.export.asFormat('md');
        var a = document.getElementById('x-md');
        a.download = exportText.name() + ".md";
        a.href = "data:text/plain;base64," + exportText.utf8_to_b64( md );
    },
    txtButton : function(element) {
        var txt = oT.export.asFormat('txt');
        var a = document.getElementById('x-txt');
        a.download = exportText.name() + ".txt";
        a.href = "data:text/plain;base64," + exportText.utf8_to_b64( txt );
    },
    name : function(){
        var d = new Date();
        var fileName = document.webL10n.get('file-name');
        return fileName + " " + d.toUTCString();
    }
}


function placeExportPanel(){
    //exportText.mdButton();
    exportText.txtButton();
    //oT.export.placeButton('otr');
    gd.handleClientLoad();
        
    var origin = $('#icon-exp').offset();
    var right = parseInt( $('body').width() - origin.left + 25 );
    var top = parseInt( origin.top ) - 50;
    $('.export-panel')
        .css({'right': right,'top': top})
        .addClass('active'); 
}

function hideExportPanel(){
    $('.export-panel').removeClass('active');
    //$('.export-block-gd')[0].outerHTML = gd.button();
}

exportText.createBlob = function(){
    var p = document.getElementById('textbox').innerHTML;
    var aFileParts = [p];
    var oBlob = new Blob(aFileParts, {type : 'text/html'}); // the blob
    return oBlob;
}

exportText.reader= function(){
    var reader = new FileReader();
    var blob = exportText.createBlob();
    reader.readAsBinaryString(blob);
    return reader;
}


oT.export.createJsonFile = function(){
    var result = {};
    result.text = oT.export.asFormat('html');
    if (oT.player !== null){
        result.media = oT.player.title;
        if (oT.player.getTime) {
            result['media-time'] = oT.player.getTime();
        }
        if (oT.media.ytEl) {
            result['media-source'] = oT.media._ytEl.getVideoUrl();
        } else {
            result['media-source'] = '';
        }
    } else {
        result.media = '';
        result['media-source'] = '';
        result['media-time'] = '';
    }
    return JSON.stringify(result);
};
;
var gd = {
    CLIENT_ID : '219206830455.apps.googleusercontent.com',
    SCOPES : 'https://www.googleapis.com/auth/drive'
}


// Called during startup to prevent blocking
gd.loadGoogleApiAsync = function(){
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://apis.google.com/js/client.js?onload=gd.handleClientLoad";
    document.body.appendChild(script);
}


/**
 * Called when the client library is loaded to start the auth flow.
 */
gd.handleClientLoad = function() {
  window.setTimeout(gd.checkAuth, 1);
}

/**
 * Check if the current user has authorized the application.
 */
gd.checkAuth = function() {
    try {
        gapi.auth.authorize(
            {'client_id': gd.CLIENT_ID, 'scope': gd.SCOPES, 'immediate': true},
            gd.handleAuthResult);
    } catch(e) {
        $('.export-block-gd').css({
            'opacity': 0.5,
            'pointer-events': 'none'
        });
    }
}

/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 */
gd.handleAuthResult = function(authResult) {
  if (authResult && !authResult.error) {
    // Access token has been successfully retrieved, requests can be sent to the API.
    gd.updateButton("Google Drive",true,"javascript:insertFile();");
  } else {
    // No access token could be retrieved, show the button to start the authorization flow.
    document.getElementById('x-gd-sign').onclick = function() {
        gapi.auth.authorize(
            {'client_id': gd.CLIENT_ID, 'scope': gd.SCOPES, 'immediate': false},
            gd.handleAuthResult);
    };
  }
}

gd.updateButton = function(status, active, link){
    var exportBlockGd = $('.export-block-gd');
    exportBlockGd[0].innerHTML = status;
    if (active == true){
        exportBlockGd.addClass('gd-authenticated').removeClass("unauth");  
    } else if (active == false){
        exportBlockGd.removeClass('gd-authenticated');
    }
    exportBlockGd[0].href = link;
}

gd.button = function(){
    var signIn = document.webL10n.get('sign-in');
    var text = '<a class="export-block-gd unauth" id="x-gd" target="_blank" href="javascript:void(0);">Google Drive<div class="sign-in" id="x-gd-sign">'
    + signIn +
    '</div></a>'
    return text;
}

function uploadFile(evt) {
  gapi.client.load('drive', 'v2', function() {
    var file = evt.target.files[0];
    insertFile(file);
  });
}

/**
 * Insert new file.
 *
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Function to call when the request is complete.
 */
window.insertFile = function(callback) {
    var sendingText = document.webL10n.get('send-drive');
    gd.updateButton(sendingText,false);

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var reader = exportText.reader();
  reader.onload = function(e) {
    var contentType = 'text/html';
    var metadata = {
      'title': exportText.name(),
      'mimeType': 'text/html'
    };

    var base64Data = btoa(reader.result);
    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart','convert':true},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});
    if (!callback) {
      callback = function(file) {
          var openText = document.webL10n.get('open-drive');
        gd.updateButton(openText + ' &rarr;', true, file.alternateLink);
      };
    }
    request.execute(callback);
  }
};oT.import = {}

oT.import.loadFile = function( file ){
    
    try {
        file = JSON.parse(file);    
        oT.import.replaceTranscriptTextWith(file.text);
        oT.import.remindOfMediaFile(file.media, file['media-source'], file['media-time']);
    } catch (e) {
        alert('This is not a valid oTranscribe format (.otr) file.');
    }
}

oT.import.replaceTranscriptTextWith = function( newText ){
    
    // TODO: CLEAN STRING
    newText = oT.import.clean(newText);
    
    var $textbox = $("#textbox");
    
    $textbox.fadeOut(300,function(){
        if (typeof newText === 'string') {
            $textbox[0].innerHTML = newText;
        } else {
            textbox[0].innerHTML = '';
            $textbox[0].appendChild(newText);    
        }
        oT.timestamp.activate();
        $('.textbox-container').scrollTop(0)
        $(this).fadeIn(300);
    });
    
}

oT.import.remindOfMediaFile = function( filename, filesource, filetime ){
    if (filename && filename !== '') {
        // var lastfileText = document.webL10n.get('last-file');
        var lastfileText = 'File last used with imported document:';
        var restoreText = 'Restore';
        if ((filesource) && (oTplayer.parseYoutubeURL(filesource))) {
            oT.message.header( lastfileText+' <a href="#" id="restore-media">'+filename+'</a>' );
            $('#restore-media').click(function(){
                oT.media.create({file: filesource, startpoint: filetime});
                return false;
            });
        } else {
            oT.message.header(lastfileText+' '+filename);
        }
    }
}

oT.import.localButtonReaction = function( input ){
    var file = input.files[0];
    
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(e) { 
        var contents = e.target.result;
        oT.import.loadFile( contents );
    }
    
    input.value = '';
    
    
}

oT.import.clean = function(text){
    
    text = oT.texteditor.clean(text);
    
    return text;
}
;/******************************************
             Initialisation
******************************************/

oT.init = function(otrUrl, fileUpdateCorrectionUrl){
    oT.backup.init(fileUpdateCorrectionUrl);
    adjustEditorHeight();
    placeTextPanel();
    initWordCount();
    initWatchFormatting();
    oT.timestamp.activate();
    gd.loadGoogleApiAsync();

    oT.voxo.init(otrUrl, fileUpdateCorrectionUrl);
}

window.addEventListener('localized', function() {
    oT.input.setup();
    setStartButton();
    oldBrowserCheck();
    oT.input.loadPreviousFileDetails();
    $('#curr-lang').text( oT.lang.langs[document.webL10n.getLanguage()] );
}, false);


$(window).resize(function() {
    adjustEditorHeight();
    oT.texteditor.adjustPlayerWidth();
    placeTextPanel();
    if (document.getElementById('media') ) {
        document.getElementById('media').style.width = oT.media.videoWidth();
    }
});


;oT.input = {};

oT.input.setup = function(){
    var input = new oTinput({
        element: '.file-input-outer',
        onFileChange: function(file){
            oT.media.create( { file: file } );
            oT.input.saveFileDetails(file.name);
        },
        onFileError: function(err, file){
            var msg = document.webL10n.get('format-warn');
            msg = msg.replace('[file-format]',file.type.split("/")[1]);
            $('#formats').html(msg).addClass('warning');
        },
        onURLSubmit: function(url){
            input.showURLInput();
            oT.media.create( {file: url} );
        },
        onURLError: function(error){
            var msg = document.webL10n.get('youtube-error');
            $('.ext-input-warning').text(msg).show();
        },
        onDragover: function(){
            $('.file-input-wrapper').addClass('hover');
        },
        onDragleave: function(){
            $('.file-input-wrapper').removeClass('hover');
        },
        text: {
            button: '<i class="fa fa-arrow-circle-o-up"></i>'+document.webL10n.get('choose-file'),
            altButton: document.webL10n.get('choose-youtube'),
            altInputText: document.webL10n.get('youtube-instrux'),
            closeAlt: '<i class="fa fa-times"></i>'
        }
    });

    oT.input.setFormatsMessage( input.getSupportedFormats() );
}

oT.input.setFormatsMessage = function(formats){
    var text = document.webL10n.get('formats');
    text = text.replace("[xxx]", formats.audio.join('/') );
    text = text.replace("[yyy]", formats.video.join('/') );
    document.getElementById("formats").innerHTML = text;
}

oT.input.loadPreviousFileDetails = function(){
    if ( localStorageManager.getItem("oT-lastfile") ) {
        var lastFile = JSON.parse( localStorageManager.getItem("oT-lastfile") );
        var lastfileText = document.webL10n.get('last-file');
        if (lastFile.name === undefined) {
            document.getElementById("lastfile").innerHTML = lastfileText+' '+lastFile;
        } else if (lastFile.source === '') {
            document.getElementById("lastfile").innerHTML = lastfileText+' '+lastFile.name;
        } else {
            var el = document.getElementById("lastfile");
            el.innerHTML = lastfileText+' <span class="media-reload">'+lastFile.name+'</span>';
            el.addEventListener('click',function(){ 
                oT.input.processYoutube( lastFile.source );
            });
        }
    }    
}

oT.input.saveFileDetails = function(fileDetails){
    var obj = fileDetails;
    if (typeof file === 'string') {
        obj = {
            name: fileDetails,
            source: ''
        }
    }
    localStorageManager.setItem("oT-lastfile", JSON.stringify( obj ));
}

oT.input.show = function(){
    $('.topbar').addClass('inputting');
    $('.input').addClass('active');
    $('.sbutton.time').removeClass('active');
    $('.text-panel').removeClass('editing');
    
}


oT.input.hide = function(){
    $('.topbar').removeClass('inputting');
    $('.input').removeClass('active');
    $('.sbutton.time').addClass('active');
    $('.text-panel').addClass('editing');
};
;oT.lang = {};

oT.lang.langs = {
    'en': 'English',
    'pirate': 'Pirate',
    'es': 'Español',
    'de': 'Deutsch',
    'fr': 'Français',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'zh-hant': '繁體中文',
    'zh-hans': '简体中文',
    'ja': '日本語',
    'pt': 'Português',
    'ptbr': 'Português do Brasil',
    'ca': 'Català',
    'it': 'Italiano',
    'da': 'Dansk',
    'id': 'Indonesia',
    'uk': 'Українська',
    'ro': 'Română'
}

oT.lang.setLang = function(lang){
    if (lang){
        localStorageManager.setItem('oTranscribe-language',lang);
        window.location.reload();
    }
}

oT.lang.applyLang = function(callback){
    var lang = localStorageManager.getItem('oTranscribe-language');
    if(lang) {
        document.webL10n.setLanguage(lang);
    } else {
        document.webL10n.setLanguage('en');
    }
}

oT.lang.togglePanel = function(){
    $('.language-picker').toggleClass('active');
    $('.language-title').toggleClass('active');
}

oT.lang.bide = function(){
    if (document.webL10n.getReadyState() === 'complete' ) {
        oT.lang.applyLang();
    } else {
        setTimeout(function(){
            oT.lang.bide();
        },50);
    }
}

window.oT.lang = oT.lang;;
oT.media = {};

// dummy functions for before player is initialised
oT.player = function(){};
oT.player.playPause = function(){};
oT.player.skipTo = function(){};
oT.player.skip = function(){};
oT.player.speed = function(){};

// initialise a new player
oT.media.create = function(opts){
    opts.source = opts.file;
    opts.container = document.querySelector('#player-hook');
    opts.onDisableSpeedChange = function(){
        $('.speed-box').html('This media only supports 1x playback rate. Sorry.');
    }
    opts.buttons = {
        speedSlider: document.querySelector('#slider3'),
        playPause: document.querySelector('.button.play-pause')
    }
    if(!opts.onReady) { 
        opts.onReady = function(){
            oT.voxo.initTimeupdate();
            $(window).resize();
        }
    }
    oT.media.reset({
        callback: function(){
            // oTplayer is a separate module
            oT.player = new oTplayer(opts);
        }
    });
    oT.input.hide();
    setInterval(function(){
        var width = oT.media.videoWidth();
        $('#oTplayerEl').width( width ).height( width*(3/4) );
    },50);
}

// switching files
oT.media.reset = function(options){
    options = options || {};
    if (oT.player.reset) {
        oT.player.reset();
    }
    oT.player = function(){};
    oT.player.playPause = function(){};
    oT.player.skipTo = function(){};
    oT.player.skip = function(){};
    oT.player.speed = function(){};
    if (options.input) {
        oT.input.loadPreviousFileDetails();
        oT.input.show();
    }
    if (options.callback) {
        setTimeout(function(){
            options.callback();
        },500);
    }
}
oT.media.reset();

// calculate optimal width for video element based on window size
oT.media.videoWidth = function(){
    var boxOffset = document.getElementById('textbox').getBoundingClientRect().left;
    if ( boxOffset > 200 ) {
        return (boxOffset-40);
    }
}



;oT.message = {}

oT.message.header = function(msg){
    $('.message-panel .message-content').html( msg );
    var $panel = $('.message-panel');
    var $textbox = $('#textbox');
    $panel.removeClass('hidden');
    oT.message.stickyWatch = setInterval(function(){
        if ( $textbox.offset().top < 0 ) {
            $panel.css('margin-left', $panel.css('margin-left') );
            $panel.addClass('stuck');
        } else {
            $panel.removeClass('stuck');
        }
    },50);
}

oT.message.close = function(){
    $('.message-panel').addClass('hidden');
    clearInterval(oT.message.stickyWatch);
}

;
/******************************************
                Other
******************************************/

function setStartButton(){
    var startText = document.webL10n.get('start-ready');
    $('.start').text(startText).addClass('ready');
}

function html5Support(){
    var audioTagSupport = !!(document.createElement('audio').canPlayType);
    var contentEditableSupport = document.getElementById('textbox').contentEditable;
    var fileApiSupport = !!(window.FileReader);

    if (audioTagSupport && contentEditableSupport && fileApiSupport){
        return true;
    } else {
        return false;
    }
}

function oldBrowserCheck(){
    if ( html5Support() === false ){
        var oldBrowserWarning = document.webL10n.get('old-browser-warning');
        document.getElementById('old-browser').innerHTML = oldBrowserWarning;
    }
}
;/******************************************
               Text editor
******************************************/

oT.texteditor = {}

oT.texteditor.clean = function( html ){
    var result = $.htmlClean(html, {
        format: false,
        allowedTags: ['p', 'div', 'strong', 'em', 'i', 'b', 'span', 'br'],
        allowedAttributes: [['class',['span']],['data-timestamp',['span']],['data-start',['span']]],
        allowedClasses: ['timestamp', 'word']
    });
    return result;
}


oT.texteditor.adjustPlayerWidth = function(){
    var cntrls = $('.controls');
    
    var gap = $(window).width() - (cntrls.width() + $('.title').outerWidth()  + $('.help-title').outerWidth() + $('.language-title').outerWidth()  );
    $('#player-hook').width( $('#player-hook').width()+gap -10 );
}


function toggleAbout(){
    $('.help-title').removeClass('active');
    $('.help').removeClass('active');
    $('.title').toggleClass('active');
    $('.about').toggleClass('active');
}

function toggleHelp(){
    $('.title').removeClass('active');
    $('.about').removeClass('active');
    $('.help-title').toggleClass('active');
    $('.help').toggleClass('active');
}


function adjustEditorHeight(){
    $('.textbox-container').height( window.innerHeight - 36 );
}

function placeTextPanel(){
   var position = parseInt( $('#textbox').offset().left, 10) + 700;
   $('.text-panel').css('left', position);
}

function countWords(str){
    var trimmedStr = $.trim(str);
    if (trimmedStr){
        return trimmedStr.match(/\S+/gi).length;
    }
    return 0;
}

function countTextbox(){
    var textboxElement = document.getElementById('textbox');
    var textboxText = textboxElement.innerText || textboxElement.textContent;
    var count = countWords(textboxText);
 
    document.getElementById('wc').innerHTML = count;
    
    var wordcountText = document.webL10n.get('wordcount', {n: count});
    document.querySelector('.wc-text').innerHTML = wordcountText;
}

function initWordCount(){
    setInterval(function(){
        countTextbox();
    }, 1000);
    
}


function watchFormatting(){
    var b = document.queryCommandState("Bold");
    var bi = document.getElementById("icon-b");
    var i = document.queryCommandState("italic");
    var ii = document.getElementById("icon-i");
    
    if (b === true){
        bi.className = "fa fa-bold active"
    } else {
        bi.className = "fa fa-bold"
    }
    if (i === true){
        ii.className = "fa fa-italic active"
    } else {
        ii.className = "fa fa-italic"
    }
}

function initWatchFormatting(){
    setInterval(function(){
        watchFormatting();
    }, 100);
}


;/******************************************
               Timestamp
******************************************/


oT.timestamp = {
    split: function(hms){
        var a = hms.split(':');
        var seconds = (+a[0]) * 60 + (+a[1]); 
        return seconds;
    },
    get: function(){
        // get timestap
        if (!oT.player || !oT.player.getTime) {
            return false;
        }
        var time = oT.player.getTime();
        var minutes = Math.floor(time / 60);
        var seconds = ("0" + Math.floor( time - minutes * 60 ) ).slice(-2);
        return minutes+":"+seconds;
    },
    insert: function(){
        var time = oT.timestamp.get();
        if (time) {
            document.execCommand('insertHTML',false,
            '<span class="timestamp" contenteditable="false" data-timestamp="' + oT.timestamp.get() + '" >' + oT.timestamp.get() + '</span>&nbsp;'
            );
            oT.timestamp.activate();
        }
    },
    activate: function(){
        $('.timestamp').each(function( index ) {
            $( this )[0].contentEditable = false;
            $( this ).off().click(function(){
                var time = $( this ).attr('data-timestamp') || $(this).text();
                console.log("Should skip to time " + time);
                oT.player.skipTo( oT.timestamp.split(time) );
            })
        });

        $('.word').each(function( index ) {
            $( this ).off().dblclick(function(){
                var time = $( this ).attr('data-start') || $(this).text();
                console.log("Should skip to time of word" + time);
                oT.player.skipTo( time );
            })
        });
    }
}

// backwards compatibility, as old timestamps use setFromTimestamp() and ts.setFrom()
window.setFromTimestamp = function(clickts, element){
    ts.setFrom(clickts, element);
}
window.ts = {
    setFrom: function(clickts, element){
        if (element.childNodes.length == 1) {
            oT.player.skipTo( oT.timestamp.split(clickts) );
        }
    }
}



;/******************************************
             User Interaction
******************************************/

var keyboardShortcuts = [
        [ 'escape',      function(){  oT.player.playPause();                         }],
        [['f1','mod+1'], function(){  oT.player.skip('backwards');                   }],
        [['f2','mod+2'], function(){  oT.player.skip('forwards');                    }],
        [['f3','mod+3'], function(){  oT.player.speed('down');                       }],
        [['f4','mod+4'], function(){  oT.player.speed('up');                         }],
        [ 'mod+j',       function(){  oT.timestamp.insert();                         }],
        [ 'mod+s',       function(){  oT.backup.save();                              }],
        [ 'mod+b',       function(){  document.execCommand('bold',false,null);       }],
        [ 'mod+i',       function(){  document.execCommand('italic',false,null);     }],
        [ 'mod+u',       function(){  document.execCommand('underline',false,null);  }]
    ];
    
    $.each(keyboardShortcuts, function(i,m){
        Mousetrap.bind(m[0], function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                // internet explorer
                e.returnValue = false;
            }
            m[1]();
            return false;
        });
    });

    var skippingButtonInterval;
    $('.skip-backwards').mousedown(function(){
        oT.player.skip('backwards');
        skippingButtonInterval = setInterval(function(){
            oT.player.skip('backwards');
        },100);
    }).mouseup(function(){
        clearInterval(skippingButtonInterval);
    });
    $('.skip-forwards').mousedown(function(){
        oT.player.skip('forwards');    
        skippingButtonInterval = setInterval(function(){
            oT.player.skip('forwards');
        },100);
    }).mouseup(function(){
        clearInterval(skippingButtonInterval);
    });
    $('.button.reset').click(function(){
        oT.media.reset({input: true});    
    });

    $( ".speed" ).mousedown(function() {
        if ($('.speed-box').not(':hover').length) {
            $(this).toggleClass('fixed');
        }    
    });
    
    $('.title').mousedown(function(){
        toggleAbout();
    });
    
    $('.language-title').mousedown(function(){
        oT.lang.togglePanel();
    });
    
    $('.language-button').click(function(){
       oT.lang.setLang( $(this).data('language') ); 
    });

    $('.about .start').click(function(){
        if ( $(this).hasClass('ready') ) {
            toggleAbout();
        }
    });
    
    $('#local-file-import').change(function() {
        oT.import.localButtonReaction(this);
    });        

    $('.sbutton.export').click(function() {
        placeExportPanel();
    });    
    
    $('.sbutton.backup').click(function(){
        oT.backup.openPanel();
    });
        
    $('.backup-close').click(function(){
        oT.backup.closePanel();
    });
    
    $('.textbox-container').click(function(e) {
        if(
            $(e.target).is('#icon-exp') ||
            $(e.target).is('.export-panel') ||
            $(e.target).is('.sbutton.export')
        ){
            e.preventDefault();
            return;
        }
        hideExportPanel();
    });    
    
    $(".export-panel").click(function(e) {
         e.stopPropagation();
    });
    
    $('.close-message-panel').click(function(){
        oT.message.close();
    })
    

// End UI



;/******************************************
             Voxolab
******************************************/

oT.voxo = {};

oT.voxo.loadFromUrl = function(otrUrl, correctionUrl) {
    $.getJSON(correctionUrl, function( data ) {
        if( data.content == '') {

            $.getJSON(otrUrl, function( otrData ) {
                //console.log("Loading", otrData.text);
                oT.import.replaceTranscriptTextWith(otrData.text);
            });

        } else {
            oT.import.replaceTranscriptTextWith(data.content);
        }

    });

}



oT.voxo.isScrolledIntoView = function (elem)
{
    var $elem = $(elem);
    var $window = $(window);

    var docViewTop = $window.scrollTop();
    var docViewBottom = docViewTop + $window.height();

    var elemTop = $elem.offset().top;
    var elemBottom = elemTop + $elem.height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}


oT.voxo.initTimeupdate = function() {

    // Get the video element with id="myVideo"
    var aud = document.getElementById("oTplayerEl");

    // Assign an ontimeupdate event to the video element, and execute a function if the current playback position has changed
    aud.ontimeupdate = function() {myFunction()};

    function myFunction() {
        // Get all the previous words
        var results = $('span[class~="word"]').filter(function() {
            return  $(this).data("start") < aud.currentTime;
        });
        $('span[class="word highlighted"]').removeClass('highlighted').addClass('white');
        results.removeClass('highlighted').addClass('white');

        if(results.length > 0) {
            var lastResult = results[results.length-1]
            var top = lastResult.offsetTop;
            if(!oT.voxo.isScrolledIntoView(lastResult)) {
                $(".textbox-container").scrollTop( top - 50 );
            }
            results.last().removeClass('white').addClass('highlighted');
        }
    }
}

oT.voxo.init = function(otrUrl, correctionUrl){
    //console.log('init voxo 2', otrUrl, correctionUrl);
    //oT.voxo.loadFromUrl(otrUrl, correctionUrl);
};
}());