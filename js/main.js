$(document).ready(function(){
    answers = {'q14': '1'};
    $questions = $('.form-group');
    $results = $('#results');
    $prevNext = $('.prevNext');
    totalQuestions = $questions.size();
    // Represents path through questions so far
    // i.e. [0, 1, 3] means user has answered questions
    // 0, 1, and 3 (but skipped 2 based on some previous answer)
    questionPath = [0];
    $questions.hide();
    $results.hide();
    $($questions.get(getCurrQuestion())).fadeIn();
    addAnswerListener();
    addSelectChangeListener();
    addChangeOnEnter();
    addprevNextListeners();
    initializeDatePicker();
});

// Returns the current question (i.e. the most recently added question
// to the question path)
function getCurrQuestion() {
    return questionPath[questionPath.length - 1];
}

// According to documentation at http://www.eyecon.ro/bootstrap-datepicker/
function initializeDatePicker() {
    $('.firstMonth').datepicker();
    $('.firstMonth').on('changeDate', function(ev) {
        if (ev.viewMode != "years") {
            var question = $(this).parent().attr('id');
            answers[question] = ev.date;
            $(this).datepicker('hide');
            transitionNext();
        }
    });
}

// Returns the next question based on the current question number
// (assuming passed value is 1-indexed)
function getNextQuestion(qNum) {
    var nextQ = qNum + 1;
    // Question skipping logic
    if (qNum == 7 && answers['q7'] && answers['q7'].toLowerCase().charAt(0) === 'n') {
        nextQ = 10;
    } else if (qNum == 8 && answers['q8'] && answers['q8'].toLowerCase().charAt(0) === 'y') {
        nextQ = 10;
    } else if (qNum == 10 && answers['q10'] && answers['q10'].toLowerCase().charAt(0) === 'y') {
        if (answers['q2'].toLowerCase().charAt(0) === 'n') {
            nextQ = 23;
        } else {
            nextQ = 24;
        }
    } else if (qNum == 11 && answers['q11'] && answers['q11'].toLowerCase().charAt(0) === 's') {
        nextQ = 14;
    } else if (qNum == 19 && answers['q19'] && answers['q19'].toLowerCase().indexOf('current') >= 0) {
        nextQ = 21;
    } else if (qNum == 19 && answers['q19'] && answers['q19'].toLowerCase().indexOf('default') < 0) {
        nextQ = 21;
    } else if (qNum == 20) {
        nextQ = 22;
    } else if (qNum == 22 && answers['q2'] && answers['q2'].toLowerCase().charAt(0) === 'y') {
        nextQ = 24;
    }
    return nextQ - 1;
}

// Adds listeners to all input elements to update answers as the values change.
// Will also transition question if it is a radio button or select element.
function addAnswerListener() {
    $('input').change(function(){
        var inputType = getCurrQuestionType(this);
        var answer = ($(this).val());
        var question = inputType == 'radio' ? $(this).parent().parent().attr('id') : $(this).parent().attr('id');
        answers[question] = answer;
        if(inputType == 'radio') {
            console.log('radio change listener');
            transitionNext();
        }
    });
}

// Adds listener for changed select value to update answers and transition question
function addSelectChangeListener() {
    $('select').change(function() {
        var answer = $(this).val();
        var question = $(this).parent().attr('id');
        answers[question] = answer;
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
        // Handle the question that has a select drop down. Only allow advance
        // if they have changed from default "--"
        if ($($questions.get(getCurrQuestion())).find('select').length > 0) {
            var selected = $($questions.get(getCurrQuestion())).find('select').find(':selected').text();
            if (selected != "--") {
                canAdvance = true;
            }
        }

        // Handle all other kinds of questions
        $($questions.get(getCurrQuestion())).find('input').each(function(i, inputElem) {
            var type = inputElem.getAttribute("type");
            if (type == "radio" && $(inputElem).is(':checked')
              || ((type == "number" || type == "text") && $(inputElem).val().length > 0)) {
                canAdvance = true;
            }
        });
        if (canAdvance) {
            $($questions.get(getCurrQuestion())).fadeOut({
                complete: function(){
                    questionPath.push(getNextQuestion(getCurrQuestion() + 1));
                    if (getCurrQuestion() < totalQuestions) {
                        $($questions.get(getCurrQuestion())).fadeIn(function() {
                            var input = $($questions.get(getCurrQuestion())).find('input');
                            var type = input.length > 0 ? input[0].getAttribute("type") : "";
                            // If enter text, focus the field, otherwise focus next button
                            // so enter goes to next question
                            if (type == "number" || type == "text") {
                                input.focus();
                            } else {
                                $('#next').focus();
                            }
                        });
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

// Transitions to the previous question
function transitionPrev() {
    if (transitionLock) {
        transitionLock = false;
        if (getCurrQuestion() > 0) {
            $($questions.get(questionPath.pop())).fadeOut(function(){
                $($questions.get(getCurrQuestion())).fadeIn();
                transitionLock = true;
            });
        } else {
            transitionLock = true;
        }
    }
}

// Returns the type of a question ('radio', 'text', or 'select') for a given
// questionNum
function getCurrQuestionType(elem) {
    var nodeName = elem.nodeName.toLowerCase().trim();
    return nodeName == "input" ? elem.getAttribute('type') : nodeName;
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
    var headerDescs = [
        'A potential payment plan',
        'How much you would pay per month for this given plan',
        'How much you would save per month on this given plan, compared to what you currently pay',
        'How much you would have paid in total by the end of the repayment term on this given plan',
        'How much of your loan balance will be forgiven by the government at the end of your repayment term. Notably, this amount counts as taxable income on federal taxes',
        'How much accumulating interest from your loan was forgiven by the federal government',
        'How much you would earn over the repayment period if you took the amount you saved per month and invested it into an S&P mutual fund. This value is adjusted for inflation, meaning that the number is the value of your gains in today\'s dollars',
        'The number of months it will take to pay off the loan on the given payment plan'
    ];
    var plansToDescs = {
        'Current': 'Your current monthly payment amount you entered',
        'Standard': 'The standard 10-year payment plan',
        'Extended': 'The extended 25-year payment plan',
        'REPAYE': 'Revised Pay As You Earn payment plan',
        'PAYE': 'Pay As You Earn payment plan for new borrowers as of October 1, 2011',
        'IBR': 'Income Based Repayment payment plan',
        'IBR for New Borrowers': 'Income Based Repayment payment plan for new borrowers as of July 1, 2014',
        'ICR': 'Income Contingent Repayment'
    };
    // Fill in header row
    var nextRow = '<tr>';
    for (var i = 0; i < data[0].length; ++i) {
        var content = data[0][i];
        var desc = headerDescs[i];
        nextRow += '<th><a class="red-tooltip" data-placement="top" data-toggle="tooltip" title="" data-original-title="' + desc + '">' + content + '</a></th>'
    }
    nextRow += '</tr>';
    $('#resultsTable > thead').append(nextRow);
    // Fill in rest of table
    for (var i = 1; i < data.length; ++i) {
        nextRow = '<tr>';
        var plan = data[i][0];
        var desc = plansToDescs[plan.split('(ineligable)')[0].trim()];
        nextRow += '<td><a class="red-tooltip" data-placement="bottom" data-toggle="tooltip" title="" data-original-title="' + desc + '">' + plan + '</a></td>'
        for (var j = 1; j < data[i].length; ++j) {
            nextRow += '<td>' + data[i][j] + '</td>';
        }
        nextRow += '</tr>';
        $('#resultsTable > tbody:last-child').append(nextRow);
    }
    $('[data-toggle="tooltip"]').tooltip();
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
        transitionPrev();
        return false;
    });
}
