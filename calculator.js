// Constructs a new calculator for a client based on an answers object
// produced from web-client

/** ASSUMPTIONS
 * 1) All loans are undergraduate student loans
 * 2) All loans were taken out before 2014
 * 3) Income remains constant over course of loan
 * 4) Family size remains constant over course of loan
 * 5) Poverty line statistics are accurate as of 2/16/2016
 * 6) Current monthly payment entered is the standard payment calculated
 * 7)
 */
var Calculator = function(answers) {
    this.answers = answers;
}

// Returns poverty line of client based on residence and family size
Calculator.prototype.getPovertyLine = function() {
    var povLines = {
        // Alaska
        'ak': {
            1: 14720,
            2: 19920,
            3: 25120,
            4: 30320,
            5: 35520,
            6: 40720
        },
        // Hawaii
        'hi': {
            1: 13550,
            2: 18330,
            3: 23110,
            4: 27890,
            5: 32670,
            6: 37450
        },
        // Continental US
        'continental': {
            1: 11770,
            2: 15930,
            3: 20090,
            4: 24250,
            5: 28410,
            6: 32570
        }
    }
    // default to continental for the case of non-filled state
    var state = this.getState();
    if (state != 'ak' && state != 'hi') {
        state = 'continental';
    }
    return povLines[state][this.getFamilySize()];
}

// Returns state that user selected
Calculator.prototype.getState = function() {
    return this.answers['q1'].toLowerCase().trim();
}

// Returns the date of the oldest loan taken out
Calculator.prototype.getDate = function() {
    return this.answers['q6'];
}

// Returns principle balance of client's current loans
Calculator.prototype.getPrincipleBalance = function() {
    return extractNum(this.answers['q17']);
}

Calculator.prototype.getInterestRate = function() {
    return extractNum(this.answers['q18']);
}

// Returns client's current monthly payment on loan
Calculator.prototype.getCurrentMonthlyPayment = function() {
    return extractNum(this.answers['q21']);
}

// Returns client's currents annual payment on loan
Calculator.prototype.getCurrentAnnualPayment = function() {
    return this.getCurrentMonthlyPayment() * 12;
}

// Returns spouse's AGI
Calculator.prototype.getSpouseIncome = function() {
    return this.answers['q13'] ? extractNum(this.answers['q13']) : 0;
}

// Returns family size claimed by client on taxes
Calculator.prototype.getFamilySize = function() {
    return extractNum(this.answers['q14']);
}

// Returns adjusted gross income for client
Calculator.prototype.getAgi = function() {
    return extractNum(this.answers['q15']);
}

// Returns client + spouse total income
Calculator.prototype.getTotalHouseholdIncome = function() {
    return this.getAgi() + this.getSpouseIncome();
}

// Returns difference between Agi and 150% of poverty line index
Calculator.prototype.getDiscretionaryIncome = function(countSpouse) {
    if (!countSpouse) {
        return Math.max(0, this.getAgi() - 1.5 * this.getPovertyLine());
    } else {
        return Math.max(0, this.getTotalHouseholdIncome() - 1.5 * this.getPovertyLine());
    }
}

// Definition found at:
// http://www.equaljusticeworks.org/resources/student-debt-relief/income-based-repayment/partial-financial-hardship
Calculator.prototype.hasPartialFinancialHardship = function() {
    return this.getStandardPayment() * 12 > 0.15 * this.getDiscretionaryIncome();
}

// Calculation used from http://www.javascriptkit.com/script/cut155.shtml
Calculator.prototype.getStandardPayment = function() {
    // var princ = this.getPrincipleBalance();
    // var term = 120;
    // var intr = this.getInterestRate() / 1200;
    // return princ * intr / (1 - (Math.pow(1/(1 + intr), term)));
    return valueOfLoanAfterDuration(this.getPrincipleBalance(), this.getInterestRate(), 120) / 120;
}

// Computes the value a loan will with principle p and interest rate r will
// appreciate to after n months
function valueOfLoanAfterDuration(p, r, n) {
    r /= 1200;
    return p * r / (1 - (Math.pow(1/(1 + r), n))) * n;
}

// Returns true iff the oldest current loan was taken out
// after Oct. 1, 2007
Calculator.prototype.isNewBorrowerForPaye = function() {
    var oldest = new Date(2007, 10, 1);
    return this.getDate() > oldest;
}

// Returns true iff the oldest current loan was taken out
// after July 1, 2014
Calculator.prototype.isNewBorrowerForIbr = function() {
    var oldest = new Date(2014, 7, 1);
    return this.getDate() > oldest;
}

/**
 * All payment calculations are outlined at https://studentaid.ed.gov/sa/repay-loans/understand/plans
 */
Calculator.prototype.getRepayePayment = function() {
    return 0.10 * this.getDiscretionaryIncome(true) / 12;
}

Calculator.prototype.getPayePayment = function() {
    return this.isNewBorrowerForPaye() && this.hasPartialFinancialHardship() ? 0.10 * this.getDiscretionaryIncome() / 12 : -1;
}

Calculator.prototype.getIbrPayment = function() {
    return !this.isNewBorrowerForIbr() && this.hasPartialFinancialHardship() ?  0.15 * this.getDiscretionaryIncome() / 12 : -1;
}

Calculator.prototype.getIbrForNewBorrowerPayment = function() {
    return this.isNewBorrowerForIbr() && this.hasPartialFinancialHardship() ? 0.10 * this.getDiscretionaryIncome() / 12 : -1;
}

// Takes in the principle balance p, the interest rate r, and the monthly payment m
// and returns the number of months required to pay off the loan. Notably, this will
// give an upper-bound estimate (i.e. the ceiling) of the true value of the number
// of months. Taken from:
// http://www.had2know.com/finance/how-long-pay-off-loan.html
function getPeriod(p, r, m) {
    // Convert percentages to decimal
    if (r > 1) {
        r /= 100;
    }
    // Return infinity for non-positive monthly payments
    if (m <= 0) {
        return Number.MAX_VALUE;
    }
    return Math.ceil((Math.log(m) - Math.log(m - p * r / 12)) / Math.log(1 + r / 12));
}

// Gets period for loan assuming this calculator's principle balance and interest
Calculator.prototype.getPeriodForMonthlyPayment = function(p) {
    return getPeriod(this.getPrincipleBalance(), this.getInterestRate(), p);
}

// Returns a table of results to display given a user's answers
getResults = function(answers) {
    var calc = new Calculator(answers);
    // Headers of results table
    var results = [['Payment Plan', 'Monthly Payment ($)', 'Monthly Savings ($)', 'Total Amount Paid ($)', 'Projected Loan Forgiveness ($)', 'Repayment Period (months)']];
    // 3-tuples containing payment plan name, monthly payment, and maximum repayment term
    var paymentPlans = [
        ['Current', calc.getCurrentMonthlyPayment()],
        ['Standard', calc.getStandardPayment(), 120],
        ['REPAYE', calc.getRepayePayment(), 300],
        ['PAYE', calc.getPayePayment(), 240],
        ['IBR', calc.getIbrPayment(), 300],
        ['IBR for New Borrowers', calc.getIbrForNewBorrowerPayment(), 240]
    ];


    // Go through each plan and monthly payment and add row to results table
    for (var i = 0; i < paymentPlans.length; ++i) {
        var plan = paymentPlans[i][0];
        var payment = paymentPlans[i][1];
        var maxPeriod = paymentPlans[i][2];
        var savings = calc.getCurrentMonthlyPayment() - payment;
        // Max period possible for the given plan
        // Period required if the payments were to pay off the entire balance
        var fullPeriod = calc.getPeriodForMonthlyPayment(payment);
        // Take min of the two of the maxPeriod exists
        var period = maxPeriod ? Math.min(maxPeriod, fullPeriod) : fullPeriod;
        // Projected forigveness is full amount that would be paid minus the amount that is paid
        var forgiveness = valueOfLoanAfterDuration(calc.getPrincipleBalance(), calc.getInterestRate(), period) - payment * period;
        // Functions to format negative values for forgiveness dollar amounts and
        // all other dollar amounts
        var fun = function(b){return '(' + b + ')';};
        var forgivenessFun = function(b){return '0.00';};
        var nextPlan;
        if (payment >= 0) {
            nextPlan = [
                plan,
                fmtAsMoney(payment, fun),
                fmtAsMoney(savings, fun),
                fmtAsMoney(payment * period, fun),
                fmtAsMoney(forgiveness, forgivenessFun),
                period
            ];
        } else {
            nextPlan = [
                plan + ' (ineligable)',
                '-',
                '-',
                '-',
                '-',
                '-'
            ];
        }
        results.push(nextPlan);
    }
    return results;
}

// Formats the given number as money (i.e. rounds to the hundreths place)
// second argument is a function that will take the string of a negative
// dollar amount and format it as desired (i.e. $18.32 -> ($18.32), or $18.32 -> -)
function fmtAsMoney(val, negConversion) {
    if (val == '-' || Number.isNaN(val)) {
        return '-';
    }
    var str = Math.abs(val).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    if (val < 0) {
        return negConversion(str);
    } else {
        return str;
    }
}

// Removes all non-numeric characters and parses a float from the string
function extractNum(str) {
    if (!str) {
        return '-';
    }
    var numPattern = /[\d.]+/g;
    var numStr = str.match(numPattern).join('');
    return parseFloat(numStr);
}

// Runs some very basic initial tests to make sure getters/setters work
function initialTests() {
    var calc = new Calculator({'q1': 'AK', 'q6': new Date(2015, 1, 1), 'q13': '$30,000', 'q14': '2', 'q15': '45,616.73', 'q17': '$20,000.53', 'q18': '5.00%', 'q21': '$513.001'});
    return calc.getPrincipleBalance() == 20000.53 &&
        calc.getCurrentMonthlyPayment() == 513.001 &&
        calc.getCurrentAnnualPayment() == 513.001 * 12 &&
        calc.getPovertyLine() == 19920 &&
        calc.getSpouseIncome() == 30000 &&
        calc.getFamilySize() == 2 &&
        calc.getAgi() == 45616.73 &&
        Math.abs(calc.getTotalHouseholdIncome() - 75616.73) < 0.001;
}

// Runs a single income test
function runIncomeTest(t) {
    var calc = new Calculator({'q1': t[4],
                               'q6': new Date(2013, 1, 1),
                               'q14': '' + t[3],
                               'q15': '' + t[2],
                               'q17': '' + t[0],
                               'q18': '' + t[1]});
    return Math.round(calc.getStandardPayment()) == t[5]
        && Math.round(calc.getPayePayment()) == t[7]
        && Math.round(calc.getRepayePayment()) == t[6]
        && Math.round(calc.getIbrPayment()) == t[8];
}

// Runs all income tests
function runIncomeTests(tests) {
    var failed = false;
    for (var i = 0; i < incomeTests.length; ++i) {
        if (!runIncomeTest(incomeTests[i])) {
            console.log("Income test " + i + " FAILED");
            failed = true;
        }
    }
    console.log(failed ? "Some income tests failed..." : "Income tests passed!");
}

console.log(initialTests() ? "Initial tests passed!" : "Initial tests failed!");
var incomeTests = [
    [45000, 5, 35000, 1, 'Connecticut', 477, 145, 145, 217],
    [80000, 10, 22000, 3, 'Alaska', 1057, 0, 0, 0],
    [20000, 5, 60000, 3, 'Colorado', 212, 249, -1, -1],
    [35000, 5, 45000, 3, 'Delaware', 371, 124, 124, 186],
    [20000, 5, 30000, 1, 'Alabama', 212, 103, 103, 154]
];

runIncomeTests();
