var CHANNEL_ACCESS_TOKEN = '[Libe bot access token]';
var CHAT_BOT_ACCESS_TOKEN = 'Userlocal Chat system Access Token';
var chat_endpoint = 'https://chatbot-api.userlocal.jp/api/chat';
var line_endpoint = 'https://api.line.me/v2/bot/message/reply';
var simple_wikipedia_api = 'http://wikipedia.simpleapi.net/api';

function doPost(e) {
  var reply_token= JSON.parse(e.postData.contents).events[0].replyToken;
  if (typeof reply_token === 'undefined') {
    return;
  }
  
  var user_message = JSON.parse(e.postData.contents).events[0].message.text;
  var reply_messages = ['ごめん。わからなかった…'];
  
  if (/って(なに|何)？?$/.test(user_message)) {
    var q = user_message.match(/(.*)って(なに|何)？?$/)[1];
    var url_and_body = getWikipediaUrlAndBody(q);
    if (url_and_body !== null) {
      reply_messages = [
        '説明しよう！ ' + q + 'とは！',
        url_and_body.body.substr(0, 140) + '...',
        '続きは',
        url_and_body.url,
      ];
    }
  } else if(/(トップ|top)/.test(user_message)){
    var url_and_body = getAlisTopArticle();
        if (url_and_body !== null) {
      reply_messages = [
        '現在のトップ記事は',
        url_and_body.body.substr(0, 140) + '...',
        url_and_body.url,
      ];
    } 
  } else if(/(適当|random)/.test(user_message)){
    var url_and_body = getRandomArticle();
        if (url_and_body !== null) {
      reply_messages = [
        'これはどう？',
        url_and_body.body.substr(0, 140) + '...',
        url_and_body.url,
      ];
    }
  }else {
    var res = UrlFetchApp.fetch(
      chat_endpoint + '?key=' + encodeURIComponent(CHAT_BOT_ACCESS_TOKEN) + '&message=' + encodeURIComponent(user_message)
    );
    reply_messages = [JSON.parse(res).result];
  }
  
  var messages = reply_messages.map(function (v) {
    return {'type': 'text', 'text': v};
  });
  
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': messages,
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function getWikipediaUrlAndBody(q) {
  var url = simple_wikipedia_api + '?keyword=' + encodeURIComponent(q) + '&output=json';
  var res = JSON.parse(UrlFetchApp.fetch(url));
  if (res !== null) {
    return {'url':res[0].url, 'body': res[0].body};
  } else {
    return null;
  }
}

//ALIS トップ記事の呼び出し
function getAlisTopArticle(){
  var response = UrlFetchApp.fetch("https://alis.to/api/articles/popular?limit=1&page=1").getContentText();
  var results = JSON.parse(response);
  
  if (results !== null) {
    var titleOverview=results["Items"][0]["title"]+"\n\n"+ results["Items"][0]["overview"];
    var topArticleUrl = 'https://alis.to/yoshidakunsansan/articles/' + results["Items"][0]["article_id"];
    return {'url':topArticleUrl, 'body': titleOverview};
  } else {
    return null;
  }
}
  
//ALIS 適当な記事をお勧め
  function getRandomArticle(){
  var response = UrlFetchApp.fetch("https://alis.to/api/articles/popular?limit=100&page=1").getContentText();
  var results = JSON.parse(response);
  var random = Math.floor(Math.random()*99)+10;
    
    
if (results !== null) {
    var ArticleUrl = 'https://alis.to/' + results["Items"][random]["user_id"] + '/articles/' + results["Items"][random]["article_id"];
    var titleOverview=results["Items"][random]["title"] +"\n\n"+ results["Items"][random]["overview"];
    return {'url':ArticleUrl, 'body': titleOverview};
  } else {
    return null;
  }
}


