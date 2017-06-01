var curGradingData = null;
var curGradingScoreCache = {};
var curTask = null;

function loadTask(url, callback) {
   $("#evalIframe").attr("src", url);
   $('#evalIframe').load(function() {
      $('#evalIframe').unbind('load');
      curGradingData = {
         noScore: 0,
         noAnswerScore: 0,
         minScore: 0,
         maxScore: 100,
         options: {}
         };
      curGradingData.noScore = curGradingData.noAnswerScore;
      // will be filled later
      curGradingData.randomSeed = 0;
   
      // Reset answers score cache
      curGradingScoreCache = {};
      try {
         TaskProxyManager.getTaskProxy('evalIframe', function(task) {
            var platform = new Platform(task);
            platform.getTaskParams = function(key, defaultValue, success, error) {
               var res = {};
               if (key) {
                  if (key !== 'options' && key in curGradingData) {
                     res = curGradingData[key];
                  } else {
                     res = (typeof defaultValue !== 'undefined') ? defaultValue : null;
                  }
               } else {
                  res = {
                     randomSeed: curGradingData.randomSeed,
                     maxScore: curGradingData.maxScore,
                     minScore: curGradingData.minScore,
                     noAnswerScore: curGradingData.noAnswerScore,
                     noScore: curGradingData.noScore,
                     options: curGradingData.options
                  };
               }
               if (success) {
                  success(res);
               } else {
                  return res;
               }
            };
            TaskProxyManager.setPlatform(task, platform);
            task.getResources(function(bebras) {
               curGradingBebras = bebras;
               task.load({'task': true, 'grader': true}, function() {
                  callback(task);
               });
            });
         }, true);
      } catch (e) {
         console.log('Task loading error catched : questionKey='+questionKeys[curIndex]);
         console.log(e);
      }
   });
}

function startReeval(groupId, itemId) {
   $.post('evalApi.php',
      {itemId: itemId, groupId: groupId, action: 'start'},
      function(data) {
         if(data.error) {
            $('#msg').text('Error: '+data.errorMsg);
         } else {
            var url = '/task/evalInterface.php?groupId='+groupId+'&itemId='+itemId+'&action=continue';
            $('#msg').html('Success! Starting reevaluation of '+data.nbAnswers+' answers in 5 seconds... (or <a href="'+url+'">click here</a>)');
            setTimeout(function () {
               window.location = url;
            }, 5000);
         }
      }, 'json');
};

var curGroupId = null;
var curItemId = null;
var reloadTimeout = null;

var remainingEvals = 0;

function continueReeval(groupId, itemId) {
   curGroupId = groupId;
   curItemId = itemId;

   $.post('evalApi.php',
      {itemId: curItemId, groupId: curGroupId, action: 'getCount'},
      function(data) {
        if(!data.error) {
          remainingEvals = data.nbToGrade;
        }
        grade();
      }, 'json');

   // After 10 minutes, refresh the page
   reloadTimeout = setTimeout(function () {
      window.location.reload();
   }, 10*60*1000);
};

var nbPacksDone = 0;
var reevalConfig = {
    maxPacksBeforeReload: 10
    };

function grade() {
   // Grading loop; it will automatically resume
   if(nbPacksDone > reevalConfig.maxPacksBeforeReload) {
      $('#msg').text('Reloading page...');
      window.location.reload();
      return;
   }

   $.post('evalApi.php',
      {itemId: curItemId, groupId: curGroupId, action: 'continue'},
      function(data) {
         if(data.error) {
            alert(data.errorMsg);
            return;
         }

         if(data.answersToGrade.length == 0) {
            $('#msg').text('Done!');
            $('#evalIframe').hide();
            clearTimeout(reloadTimeout);
            // TODO :: finish request
/*            $.post('evalApi.php',
              {itemId: curItemId, groupId: curGroupId, action: 'finish'},
              function(data) {
                 console.log('finish:'+data.error);
              }, 'json');*/
            return;
         }

         var startGrading = function(task) {
            gradeQuestionPack(task, data.answersToGrade, gradeSave);
         };

         // TODO :: should we reload on each packet?
//         if(!curTask || $('#evalIframe').attr('src') != data.itemUrl) {
            curTask = loadTask(data.itemUrl, startGrading);
//         }
      }, 'json');
}

function gradeQuestionPack(task, answersToGrade, callback) {
   var scores = {};
   var i = 0;
   for (var i = 0; i < answersToGrade.length; i++) {
      var answer = answersToGrade[i];

      var usesRandomSeed = (('usesRandomSeed' in curGradingBebras) && curGradingBebras.usesRandomSeed);

      scores[i] = {};
      // in some cases, score cannot be computed because the answer is invalid, so we have this default score
      // that will output "NULL" in the database
      scores[i].score = '';
      scores[i].ID = answer.ID;
      scores[i].usesRandomSeed = usesRandomSeed;
      if ((!usesRandomSeed) && 'cache_'+answer.answerStr in curGradingScoreCache) {
         scores[i].score = curGradingScoreCache['cache_'+answer.answerStr];
      }
      else if (answer.answerStr == '' || answer.answerStr == 'null') {
         scores[i].score = parseInt(curGradingData.noAnswerScore);
      } else {
         scores[i].needsEvaluation = true;
      }

      // Cache the current answer's score
      if (!usesRandomSeed && !scores[i].needsEvaluation) {
         curGradingScoreCache['cache_'+answer.answerStr] = scores[i].score;
      }
   }
   
   gradeOneAnswer(task, answersToGrade, 0, scores, function() {
      gradeSave(scores);
   });
}

function gradeOneAnswer(task, answersToGrade, i, scores, finalCallback) {
   if (i >= answersToGrade.length) {
      remainingEvals -= i;
      finalCallback();
      return;
   }
   var answer = answersToGrade[i].answerStr;
   if (!scores[i].needsEvaluation) {
      gradeOneAnswer(task, answersToGrade, i+1, scores, finalCallback);
      return;
   }
   console.log('gradeOneAnswer:' + i);
   $('#msg').text('Evaluating... '+(remainingEvals - i)+' evaluations remaining.');
   task.gradeAnswer(answer, null, function(score) {
      console.log(arguments);
      scores[i].score = score;
      if (typeof curGradingScoreCache['cache_'+answer] == 'undefined') {
         curGradingScoreCache['cache_'+answer] = score;
      }
      setTimeout(function() {
         gradeOneAnswer(task, answersToGrade, i+1, scores, finalCallback);
      },0);
   }, function() {
      scores[i].score = -2;
      scores[i].scoreNeedsChecking = 1;
      setTimeout(function() {
         gradeOneAnswer(task, answersToGrade, i+1, scores, finalCallback);
      },0);
   });
}


function gradeSave(scores) {
   // Send scores back
   console.log(scores);
   $('#msg').text('Sending results... '+remainingEvals+' evaluations remaining.');
   $.post('evalApi.php',
      {itemId: curItemId, groupId: curGroupId, scores: scores, action: 'saveScores'},
      function(data) {
         console.log('saveScores:'+data.error+' ('+data.errorMsg+') ok='+data.nbOk);
         nbPacksDone += 1;
         grade();
      }, 'json');
}
