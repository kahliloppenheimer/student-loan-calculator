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
    addSelectChangeListener();
    addChangeOnEnter();
    addprevNextListeners();
});

// Returns the next question based on the current question number
function getNextQuestion() {
    // Deal with 1-based index of question numbers
    var qNum = currQuestion + 1;
    var nextQ = qNum + 1;
    // Question skipping logic
    if (qNum == 5 && answers['q5'].toLowerCase().charAt(0) === 'n') {
        nextQ = 8;
    } else if (qNum == 6 && answers['q6'].toLowerCase().charAt(0) === 'y') {
        nextQ = 8;
    } else if (qNum == 8 && answers['q8'].toLowerCase().charAt(0) === 'y') {
        if (answers['q1'].toLowerCase().charAt(0) === 'n') {
            nextQ = 20;
        } else {
            nextQ = 21;
        }
    } else if (qNum == 9 && answers['q9'].toLowerCase().charAt(0) === 's') {
        nextQ = 13;
    } else if (qNum == 11 && answers['q11'].toLowerCase().charAt(0) === 'n') {
        nextQ = 13;
    } else if (qNum == 18 && answers['q18'].toLowerCase().indexOf('current') >= 0) {
        nextQ = 20;
    } else if (qNum == 18 && answers['q18'].toLowerCase().indexOf('default') < 0) {
        nextQ = 21;
    } else if (qNum == 19) {
        nextQ = 21;
    } else if (qNum == 21 && answers['q1'].toLowerCase().charAt(0) === 'y') {
        nextQ = 23;
    }
    return nextQ - 1;
}

// Returns the previous question based on the current question number
function getPrevQuestion() {
    // Deal with 1-based index of question numbers
    var qNum = currQuestion + 1;
    var nextQ = qNum - 1;
    // Question skipping logic
    if (qNum == 8 && answers['q5'].toLowerCase().charAt(0) === 'n') {
        nextQ = 5;
    } else if (qNum == 8 && answers['q6'].toLowerCase().charAt(0) === 'y') {
        nextQ = 6;
    } else if (qNum == 21 && answers['q8'].toLowerCase().charAt(0) === 'y') {
        if (answers['q1'].toLowerCase().charAt(0) === 'n') {
            nextQ = 8;
        }
    } else if (qNum == 13 && answers['q9'].toLowerCase().charAt(0) === 's') {
        nextQ = 9;
    } else if (qNum == 13 && answers['q11'].toLowerCase().charAt(0) === 'n') {
        nextQ = 11;
    } else if (qNum == 20 && answers['q18'].toLowerCase().indexOf('default') < 0) {
        nextQ = 18;
    } else if (qNum == 21 && answers['q18'].toLowerCase().indexOf('default') >= 0) {
        nextQ = 19;
    } else if (qNum == 21 && answers['q18'].toLowerCase().indexOf('current') < 0) {
        nextQ = 18;
    } else if (qNum == 23 && answers['q1'].toLowerCase().charAt(0) === 'y') {
        nextQ = 21;
    }
    return nextQ - 1;
}

// Adds listeners to all input elements to update answers as the values change.
// Will also transition question if it is a radio button or select element.
function addAnswerListener() {
    $('input').change(function(){
        var answer = ($(this).val());
        var question = ($(this).parent().attr('id'));
        answers[question] = answer;
        var inputType = getCurrQuestionType();
        if(inputType == 'radio') {
            console.log('radio change listener');
            transitionNext();
        }
    });
}

// Adds listener for changed select value to update answers and transition question
function addSelectChangeListener() {
    $('select').change(function() {
        var answer = ($(this).val());
        var question = ($(this).parent().attr('id'));
        answers[question] = answer;
        var inputType = getCurrQuestionType();
        console.log('select change listener');
        transitionNext();
    });
}

// Adds listeners that will transition to next question when user presses the
// enter key
function addChangeOnEnter() {
    $(document).keypress(function(e) {
        if(e.which == 13) {
            console.log('enter listener');
            transitionNext();
            e.preventDefault();
            return false;
        }
    });
}

// Transitions to the next question or to the results page if no questions
// are left
function transitionNext() {
    if (transitionLock) {
        transitionLock = false;
        // False unless either a radio button is checked or a text box is filled in
        var canAdvance = false;
        // Handle the question that has a select drop down
        canAdvance = $($questions.get(currQuestion)).find('select').length == 0  ? false : true;
        // Handle all other kinds of questions
        $($questions.get(currQuestion)).find('input').each(function(i, inputElem) {
            if (inputElem.getAttribute("type") == "radio" && $(inputElem).is(':checked')
              || (inputElem.getAttribute("type") == "text" && $(inputElem).val().length > 0)) {
                canAdvance = true;
            }
        });
        if (canAdvance) {
            $($questions.get(currQuestion)).fadeOut({
                complete: function(){
                    currQuestion = getNextQuestion(currQuestion);
                    if (currQuestion < totalQuestions) {
                        $($questions.get(currQuestion)).fadeIn();
                    } else {
                        showResults();
                    }
                    transitionLock = true;
                }
            });
        } else {
            transitionLock = true;
        }
    }
}

// Returns the type of a question ('radio', 'text', or 'select') for a given
// questionNum
function getCurrQuestionType() {
    return $($questions.get(currQuestion)).find('input')[0] ? $($questions.get(currQuestion)).find('input')[0].getAttribute('type') : 'select';
}

// Calculates all results and displays them on page
function showResults() {
    var results = getResults(answers);
    makeTable('resultsTable', results);
    $prevNext.fadeOut(function() {
        $results.fadeIn();
    });
}

// Takes in the id of an html table element and a 2d array of data
// to fill the table in with. Assumes the first row of data should be
// headers and that the table element is currently empty (no th, tr, or td elems),
// but has thead and tbody elems
function makeTable(id, data) {
    // Ignore empty tables
    if (results.length <= 0) {
        return;
    }
    // Fill in header row
    var nextRow = '<tr>';
    for (var i = 0; i < data[0].length; ++i) {
        nextRow += '<th>' + data[0][i] + '</th>';
    }
    nextRow += '</tr>';
    $('#resultsTable > thead').append(nextRow);
    // Fill in rest of table
    for (var i = 1; i < data.length; ++i) {
        nextRow = '<tr>';
        for (var j = 0; j < data[i].length; ++j) {
            nextRow += '<td>' + data[i][j] + '</td>';
        }
        nextRow += '</tr>';
        $('#resultsTable > tbody:last-child').append(nextRow);
    }
}

// Adds listeners for the next/prev buttons
function addprevNextListeners() {
    // Locks next button while transitioning
    transitionLock = true;
    // Make sure next button only works if they have selected an option
    // and if they are not on the last question
    $('#next').click(function() {
        console.log('next listener');
        transitionNext();
    });

    // Make sure previous only works if they are not on the first question
    $('#prev').click(function(){
        console.log('prev listener');
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
