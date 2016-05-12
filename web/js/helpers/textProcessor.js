!function(globals) {

  'use strict';

  var TXT_TYPE = 'txt';
  var URL_TYPE = 'url';

 /**
  * Return an array of object for any consecutive elements of the same type.
  * The types can be TXT_TYPE (i.e. whatever except an url) or URL_TYPE (i.e. a valid url)
  * For example, the string:
  * 'p1 p2  p3   line.newphrase    http://www.tokbox.com  http://www.tid.es http://telefonica.com'
  * return the array
  * r[0] = {type: TXT_TYPE, value:' p1 p2  p3   line.newphrase    '}
  * r[1] = {type: URL_TYPE, value:'http://www.tokbox.com'}
  * r[2] = {type: TXT_TYPE, value:'  '}
  * r[3] = {type: URL_TYPE, value:'http://www.tid.es'}
  * r[4] = {type: TXT_TYPE, value:' '}
  * r[5] = {type: URL_TYPE, value:'http://telefonica.com'}
  */
 function parse(text) {
    var result = [];
    // text like
    // 'p1 p2  p3   line.newphrase    http://www.tokbox.com  http://tid.es http://telefonica.com'
    // is splitted as:
    // p1|p2||p3|||line.newphrase||||http:/www.tokbox.com||http://tid.es|http://telefonica.com
    var tokens = text.split(' ');

    var txt = '';
    for (var i = 0, l = tokens.length; i < l; i++) {
      var word = tokens[i];
      if (word.length === 0) {
        // If not first token and previous tokens wasn't a white space
        // we need to add word separator, i.o.c. just the white space
        txt = txt.concat((i > 0 && tokens[i - 1].length > 0) ? '  ' : ' ');
      } else {
        try {
          var isUrl = new URL(word);
          if (txt.length > 0) {
            if (tokens[i - 1].length > 0) {
              txt = txt.concat(' ');
            }
            result.push({ type: TXT_TYPE, value: txt });
            txt= '';
          }
          var length = result.length;
          if (length > 0 && result[length - 1].type === URL_TYPE) {
             result.push({ type: TXT_TYPE, value: ' ' });
          }
          result.push({ type: URL_TYPE, value: tokens[i] });
        } catch (e) {
          txt = (i > 0 && tokens[i - 1].length > 0) ?
            txt.concat(' ', word) :
            txt.concat(word);
        }
      }
    }

    txt.length && result.push({ type: TXT_TYPE, value: txt });

    return result;
  }

  var TextProcessor = {
    TYPE: {
      TXT: TXT_TYPE,
      URL: URL_TYPE
    },
    parse: parse
  };

  globals.TextProcessor = TextProcessor;

}(this);
