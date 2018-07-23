/**
 * Created by nazarigonzalez on 9/4/17.
 */
$(function(){
  var HOST = "http://192.168.1.103:8000"; //todo change this

  var tplMenu = _.template($('script#tpl-menu').text());
  var tplGames = _.template($('script#tpl-games').text());
  var menu = $('div#menu');
  var games = $('table#games');

  setDateAndType("today", "points");

  function setDateAndType(_date, _type){
    displayMenu(_date, _type);
    getLeaderboard(_date, _type);
  }

  function displayMenu(_date, _type){
    menu.html(tplMenu({Type: _type, Date: _date}));
    menu.find("a").on('click', function(evt){
      var date = $(this).data("time");
      var type = $(this).data("rank");
      setDateAndType(date, type);
    });
  }

  function getLeaderboard(_date, _type){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", HOST + "/api/leaderboard/" + _date + "/" + _type + "/", true);
    xhr.onload = function(){
      if(xhr.status === 200){
        var contentType = xhr.getResponseHeader("Content-Type");
        if(contentType.indexOf("application/json") !== -1){
          displayGames(JSON.parse(xhr.response));
          return;
        }
      }

      alert("Something went wrong...");
    };
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(null);
  }

  function displayGames(data){
    games.html(tplGames(data));
  }
});