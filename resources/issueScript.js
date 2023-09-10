const vscode = acquireVsCodeApi();

addEventListener("load", initialize);

function initialize() {
  const issueButton = document.getElementById('issueButton');
  issueButton.addEventListener('click', issueDocumentOnClick);
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
  const message = {
    day:date.getDate(),
    month:date.getMonth(),
    year:date.getFullYear(),
    major:Number(issueRadio.dataset["major"]),
    minor:Number(issueRadio.dataset["minor"]),
    detail:detailArea.value,
    author:authorArea.value,
    isMajor:isMajor
  };
  vscode.postMessage(message);
}