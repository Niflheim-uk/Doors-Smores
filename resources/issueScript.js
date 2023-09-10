const vscode = acquireVsCodeApi();

addEventListener("load", initialize);

function initialize() {
  const issueButton = document.getElementById('issueButton');
  issueButton.addEventListener('click', issueDocumentOnClick);
  const elements = document.getElementsByClassName('deltaSpan');
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener('click', deltaSpanOnClick);
  }
  const detailButton = document.getElementById('detailButton');
  detailButton.addEventListener('click', detailReturnOnClick);
  const majorRadio = document.getElementById('majorIssue');
  majorRadio.addEventListener('change', radioOnChange);
  
}
function radioOnChange() {
  const detailArea = document.getElementById('issueSummary');
  if(document.getElementById('majorIssue').checked) {
    const historyTable = document.getElementById('historyTable');
    const draft = historyTable.dataset["draft"];
    detailArea.value = draft;
  } else {
    detailArea.value = "";
  }
}
function issueDocumentOnClick() {
  var issueRadio;
  var isMajor = true;
  if(document.getElementById('minorIssue').checked) {
    issueRadio = document.getElementById('minorIssue');
    isMajor = false;
  } else {
    issueRadio = document.getElementById('majorIssue');
  }
  const detailArea = document.getElementById('issueSummary');
  const authorArea = document.getElementById('issueAuthor');
  const date = new Date();
  const item = {
    day:date.getDate(),
    month:date.getMonth(),
    year:date.getFullYear(),
    major:Number(issueRadio.dataset["major"]),
    minor:Number(issueRadio.dataset["minor"]),
    detail:detailArea.value,
    author:authorArea.value,
    isMajor:isMajor
  };
  vscode.postMessage({command:'submit', item});
}

function deltaSpanOnClickBak(event) {
  const filepath = event.currentTarget.dataset["file"];
  vscode.postMessage({command: 'viewDiff', filepath});
}
function deltaSpanOnClick(event) {
  const detail = event.currentTarget.dataset["detail"];
  const detailLines = detail.split("\n");
  const detailInnerDiv = document.getElementById('detailDivInner');
  while (detailInnerDiv.lastChild) {
    detailInnerDiv.removeChild(detailInnerDiv.lastChild);
  }
  for(let i=0; i<detailLines.length; i++) {
    var line = document.createElement('span');
    line.className = 'whitespace';
    if(detailLines[i][0] === '+') {
      line.classList.add('insertion');
    } else if(detailLines[i][0] === '-') {
      line.classList.add('deletion');
    } else if(detailLines[i][0] === '@') {
      line.classList.add('notation');
    }
    line.innerText = detailLines[i];
    detailInnerDiv.appendChild(line);
  }
  const detailDiv = document.getElementById('detailDiv');
  detailDiv.style.visibility = 'visible';
}
function detailReturnOnClick(event) {
  const detailDiv = document.getElementById('detailDiv');
  detailDiv.style.visibility = 'hidden';
}