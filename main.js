$(document).ready(function(){
    answers = {};
    $('[type="radio"]').change(function(){
        var answer = ($(this).attr('value'));
        var question = ($(this).attr('name'));
        answers[question] = answer;
        $($questions.get(currentQuestion)).fadeOut(function(){
            currentQuestion = currentQuestion + 1;
            $($questions.get(currentQuestion)).fadeIn();
        });
    });

    $('.form-group').hide();
    var item1 = document.getElementById('.form-group');
    var totalQuestions = $('.form-group').size();
    var currentQuestion = 0;
    $questions = $('.form-group');
    $questions.hide();
    $($questions.get(currentQuestion)).fadeIn();

    // Locks next button while transitioning
    var nextLock = true;
    // Make sure next button only works if they have selected an option
    // and if they are not on the last question
    $('#next').click(function() {
        if (nextLock) {
            nextLock = false;
            // False unless either a radio button is checked or a text box is filled in
            var canProgress = false;
            $($('.form-group')[currentQuestion]).find('input').each(function(i, inputElem) {
                console.log(inputElem.getAttribute("type"));
                if(inputElem.getAttribute("type") == "radio" && $(inputElem).is(':checked')) {
                    canProgress = true;
                } else if (inputElem.getAttribute("type") == "text" && $(inputElem).val().length > 0) {
                    canProgress = true;
                }
            });
            if (isChecked && currentQuestion < totalQuestions - 1) {
                $($questions.get(currentQuestion)).fadeOut(function(){
                    currentQuestion += 1;
                    $($questions.get(currentQuestion)).fadeIn();
                    nextLock = true;
                });
            }
        }
    });

    // Locks prevButton while transitioning
    var prevLock = true;
    // Make sure previous only works if they are not on the first question
    $('#prev').click(function(){
        if (prevLock) {
            prevLock = false;
            if (currentQuestion > 0) {
                $($questions.get(currentQuestion)).fadeOut(function(){
                    currentQuestion = currentQuestion - 1;
                    $($questions.get(currentQuestion)).fadeIn();
                    prevLock = true;
                });
            }
        }
    });
});
