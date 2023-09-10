addEventListener("load", loadElements);

const cssSelectorClasses = ['page', 'frompage', 'topage', 'webpage', 'section', 'subsection', 'date', 'isodate', 'time', 'title', 'doctitle', 'sitepage', 'sitepages'];

/* replaces the text context of classes in the above array with the value from key=value pairs provided in the Get request */
function loadElements() {
  var vars = {};
  var queryStringsFromUrl = document.location.search.substring(1).split('&');
  for (var queryString in queryStringsFromUrl) {
    if (queryStringsFromUrl.hasOwnProperty(queryString)) {
      var tempVar = queryStringsFromUrl[queryString].split('=', 2);
      vars[tempVar[0]] = decodeURI(tempVar[1]);
    }
  }
  for (var cssClass in cssSelectorClasses) {
    if (cssSelectorClasses.hasOwnProperty(cssClass)) {
      var element = document.getElementsByClassName(cssSelectorClasses[cssClass]);
      for (var j = 0; j < element.length; ++j) {
        element[j].textContent = vars[cssSelectorClasses[cssClass]];
      }
    }
  }
}