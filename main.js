$(document).ready(function(){
    answers = {};
    $questions = $('.form-group');
    $results = $('#results');
    $prevNext = $('.prevNext');
    totalQuestions = $questions.size();
    currQuestion = 0;
    $questions.hide();
    $results.hide();
    $($questions.get(currQuestion)).fadeIn();
    addAnswerListener();
    addprevNextListeners();
});

// Returns the next question based on the current question number
function getNextQuestion() {
    // Deal with 1-based index of question numbers
    var qNum = currQuestion + 1;
    var nextQ = qNum + 1;
    // Question skipping logic
    if (qNum == 4 && answers['q4'].toLowerCase().charAt(0) === 'n') {
        nextQ = 7;
    } else if (qNum == 5 && answers['q5'].toLowerCase().charAt(0) === 'y') {
        nextQ = 7;
    } else if (qNum == 7 && answers['q7'].toLowerCase().charAt(0) === 'y') {
        if (answers['q1'].toLowerCase().charAt(0) === 'n') {
            nextQ = 18;
        } else {
            nextQ = 19;
        }
    } else if (qNum == 8 && answers['q8'].toLowerCase().charAt(0) === 's') {
        nextQ = 12;
    } else if (qNum == 10 && answers['q10'].toLowerCase().charAt(0) === 'n') {
        nextQ = 12;
    } else if (qNum == 15 && answers['q15'].toLowerCase().indexOf('default') < 0) {
        nextQ = 17;
    } else if (qNum == 17 && answers['q1'].toLowerCase().charAt(0) === 'y') {
        nextQ = 19;
    }
    return nextQ - 1;
}

// Returns the previous question based on the current question number
function getPrevQuestion() {
    // Deal with 1-based index of question numbers
    var qNum = currQuestion + 1;
    var nextQ = qNum - 1;
    // Question skipping logic
    if (qNum == 7 && answers['q4'].toLowerCase().charAt(0) === 'n') {
        nextQ = 4;
    } else if (qNum == 7 && answers['q5'].toLowerCase().charAt(0) === 'y') {
        nextQ = 5;
    } else if (qNum == 18 && answers['q7'].toLowerCase().charAt(0) === 'y') {
        if (answers['q1'].toLowerCase().charAt(0) === 'n') {
            nextQ = 7;
        }
    } else if (qNum == 12 && answers['q8'].toLowerCase().charAt(0) === 's') {
        nextQ = 8;
    } else if (qNum == 12 && answers['q10'].toLowerCase().charAt(0) === 'n') {
        nextQ = 10;
    } else if (qNum == 17 && answers['q15'].toLowerCase().indexOf('default') < 0) {
        nextQ = 15;
    } else if (qNum == 19 && answers['q1'].toLowerCase().charAt(0) === 'y') {
        nextQ = 17;
    }
    return nextQ - 1;
}

// Adds listeners to all input elements to update answers as they change
function addAnswerListener() {
    $('input').change(function(){
        var answer = ($(this).val());
        var question = ($(this).parent().attr('id'));
        answers[question] = answer;
        $($questions.get(currQuestion)).fadeOut(function() {
            currQuestion = getNextQuestion(currQuestion);
            if (currQuestion < totalQuestions) {
                $($questions.get(currQuestion)).fadeIn();
            } else {
                showResults();
            }
        });
    });
}

function showResults() {
    $prevNext.fadeOut(function() {
        $results.fadeIn();
    });
}

// Adds listeners for the next/prev buttons
function addprevNextListeners() {
    // Locks next button while transitioning
    transitionLock = true;
    // Make sure next button only works if they have selected an option
    // and if they are not on the last question
    $('#next').click(function() {
        if (transitionLock) {
            transitionLock = false;
            // False unless either a radio button is checked or a text box is filled in
            var canAdvance = false;
            $($questions.get(currQuestion)).find('input').each(function(i, inputElem) {
                if (inputElem.getAttribute("type") == "radio" && $(inputElem).is(':checked')
                || (inputElem.getAttribute("type") == "text" && $(inputElem).val().length > 0)) {
                    canAdvance = true;
                }
            });
            if (canAdvance && currQuestion < totalQuestions - 1) {
                $($questions.get(currQuestion)).fadeOut(function(){
                    currQuestion = getNextQuestion(currQuestion);
                    $($questions.get(currQuestion)).fadeIn();
                    transitionLock = true;
                });
            } else {
                transitionLock = true;
            }
        }
        return false;
    });

    // Make sure previous only works if they are not on the first question
    $('#prev').click(function(){
        if (transitionLock) {
            transitionLock = false;
            if (currQuestion > 0) {
                $($questions.get(currQuestion)).fadeOut(function(){
                    currQuestion = getPrevQuestion(currQuestion);
                    $($questions.get(currQuestion)).fadeIn();
                    transitionLock = true;
                });
            } else {
                transitionLock = true;
            }
        }
        return false;
    });
}
