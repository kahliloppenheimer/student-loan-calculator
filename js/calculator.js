// Constructs a new calculator for a client based on an answers object
// produced from web-client

// Calculated as average from 1985-2015, adjusted for inflation
// http://www.moneychimp.com/features/market_cagr.htm
AVERAGE_SANDP_RETURN = 0.0964;
// Average annual US inflation rate between 1913-2013
// http://inflationdata.com/Inflation/Inflation_Rate/Long_Term_Inflation.asp
AVERAGE_US_INFLATION = 0.0322;

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

// Income percentage factors from 2015 taken from:
// https://www.federalregister.gov/articles/2015/03/25/2015-06704/annual-updates-to-the-income-contingent-repayment-icr-plan-formula-for-2015-william-d-ford-federal#h-8
incomePercentageFactors = {
    'single': {
        11150: 0.55,
        15342: 0.5779,
        19471: 0.6057,
        24240: 0.6623,
        28537: 0.7189,
        33954: 0.8033,
        42648: 0.8877,
        53488: 1,
        77318: 1.118,
        99003: 1.235,
        140221: 1.412,
        160776: 1.5,
        286370: 2
    }, 'married': {
        11150: 0.5052,
        17593: 0.5668,
        20965: 0.5956,
        27408: 0.6779,
        33954: 0.7522,
        42648: 0.8761,
        53487: 1,
        64331: 1,
        80596: 1.094,
        107695: 1.25,
        145638: 1.406,
        203682: 1.5,
        332833: 2
    }
};

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
    console.log(this.getFamilySize());
    console.log('povline = ' + povLines[state][this.getFamilySize()]);
    return povLines[state][this.getFamilySize()];
}

Calculator.prototype.getIncomePercentageFactor = function() {
    var agi = get
}

// Returns state that user selected
Calculator.prototype.getState = function() {
    return this.answers['q1'].toLowerCase().trim();
}

// Returns the date of the oldest loan taken out
Calculator.prototype.getDate = function() {
    return new Date(this.answers['q6']);
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

// Returns true iff the user indicated they are filing taxes jointly
Calculator.prototype.isFilingJointly = function() {
    return this.answers['q12'] && this.answers['q12'].toLowerCase().trim().indexOf('jointly') >= 0;
}

// Returns true iff the user indicated the user is filing taxes as single
Calculator.prototype.isFilingSingle = function() {
    return this.answers['q12'] && this.answers['q12'].toLowerCase().trim().indexOf('single') >= 0;
}

// Returns adjusted gross income for client
Calculator.prototype.getAgi = function() {
    return extractNum(this.answers['q15']);
}

// Returns combined spouse's income if filing jointly, otherwise just user's agi
Calculator.prototype.getAgiForCalculation = function() {
    return this.isFilingJointly() ? this.getTotalHouseholdIncome() : this.getAgi();
}

// Returns true iff the user answered yes to having graduate loans
Calculator.prototype.hasGraduateLoans = function() {
    return this.answers['q5'].toLowerCase().trim().charAt(0) == 'y';
}

// Returns client + spouse total income
Calculator.prototype.getTotalHouseholdIncome = function() {
    return this.getAgi() + this.getSpouseIncome();
}

// Returns difference between Agi and 150% of poverty line index
Calculator.prototype.getDiscretionaryIncome = function(countSpouse) {
    if (!countSpouse) {
        return Math.max(0, this.getAgiForCalculation() - 1.5 * this.getPovertyLine());
    } else {
        return Math.max(0, this.getTotalHouseholdIncome() - 1.5 * this.getPovertyLine());
    }
}

// Returns difference between agi and 100% of poverty line index
Calculator.prototype.getDiscretionaryIncomeForIcr = function() {
    return Math.max(0, this.getAgiForCalculation() - this.getPovertyLine());
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

Calculator.prototype.getExtendedPayment = function() {
    return this.getPrincipleBalance() >= 30000 ? valueOfLoanAfterDuration(this.getPrincipleBalance(), this.getInterestRate(), 12 * 25) / (12 * 25) : -1;
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

// 25 years if the student has any graduate loans, otherwise 20 years
Calculator.prototype.getRepayePeriod = function() {
    return this.hasGraduateLoans() ? 25 * 12 : 20 * 12;
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

Calculator.prototype.getIcrPayment = function() {
    // income percentage factor
    var ipf = 0.55;
    var agi = this.getAgiForCalculation();
    var opt1 = 0.20 * this.getDiscretionaryIncomeForIcr() / 12;
    // Income value percentages for tax-filing status
    var ipfs = incomePercentageFactors[this.isFilingSingle() ? 'single' : 'married'];
    // Income value percentage of user based on agi
    var i = 0;
    var ipf = ipfs[Object.keys(ipfs)[i]];
    while (Object.keys(ipfs)[i] < agi) {
        i++;
        ipf = ipfs[Object.keys(ipfs)[i]];
    }
    var opt2 = ipf * valueOfLoanAfterDuration(this.getPrincipleBalance(), this.getInterestRate(), 12 * 12) / (12 * 12);
    return Math.min(opt1, opt2);
}

// Investment estimate equations pulled from:
// https://home.ubalt.edu/ntsbarsh/business-stat/otherapplets/CompoundCal.htm
// Returns the future value (FV) of an investment of present value (PV) dollars
// earning interest at an annual rate of r compounded m times per year for a
// period of t years with payments p added m times per year. r is converted into
// a real interest rate by taking US inflation into consideration as in:
// http://www.investopedia.com/terms/n/nominalinterestrate.asp
function getFvIncreasingAnnuity(pv, p, r, m, t) {
    // r = r - AVERAGE_US_INFLATION;
    r = (1 + r) / (1 + AVERAGE_US_INFLATION) - 1;
    var i = r / m;
    var n = m * t;
    return pv * Math.pow(1 + i, n) + p * (Math.pow(1 + i, n) - 1) / i;
}

// Takes in the principle balance p, the interest rate r, and the monthly payment m
// and returns the number of months required to pay off the loan. Notably, this will
// give an upper-bound estimate (i.e. the ceiling) of the true value of the number
// of months. Taken from:
// http://www.had2know.com/finance/how-long-pay-off-loan.html
function getPeriodOld(p, r, m) {
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

// Gets payment period, amount paid, and remaining balance for loan with
// principle p, interest rate r, and monthly payment m with possible options:
// {capitalize: true, numMonthsForgiven: 36, pctForgiven: 100}
// Return object is of form
// {length: 120, amountPaid: 15350.25, remainingBalance: 250.17, forgivenInterest: 20.03}
getFinalLoanState = function(p, r, m, maxPeriod, options) {
    options = options ? options : {};
    var capitalize = options['capitalize'] ? options['capitalize'] : true;
    var numMonthsForgiven = options['numMonthsForgiven'] ? options['numMonthsForgiven'] : 0;
    var pctForgiven = options['pctForgiven'] ? options['pctForgiven'] : 0;
    // Convert percentages to decimal
    if (pctForgiven > 1) {
        pctForgiven /= 100;
    }
    if (r > 1) {
        r /= 100;
    }
    // Return infinity for non-positive monthly payments
    if (m <= 0) {
        m = 0;
    }
    var monthlyRate = r / 12;
    var currTerm = 0;
    var amtPaid = 0;
    var totalForgivenInterest = 0;
    var interest = 0;
    // amount the user should pay this month (i.e. either m or the remaining amount if small enough)
    var payment;
    // Interest of current payment
    var currInterest;
    // amount of the payment that should go to paying off interest
    var amtToInterest;
    while (p > 0.001 && currTerm < maxPeriod) {
        // Calculate how much interest for this month
        currInterest = capitalize ? monthlyRate * (p + interest) : monthlyRate * p;
        // Calculate whether payment should be m or whatever is left
        payment = Math.min(interest + currInterest + p, m);
        // Determine how much of the payment goes towards interest
        amtToInterest = Math.min(payment, currInterest);
        amtPaid += payment;
        payment -= amtToInterest;
        // Check for case where there is interest forgiveness
        if (currTerm < numMonthsForgiven) {
            var fullInterest = currInterest - amtToInterest;
            var forgivenInterest = pctForgiven * fullInterest;
            interest = interest + fullInterest - forgivenInterest;
            totalForgivenInterest += forgivenInterest;
        } else {
            interest = interest + currInterest - amtToInterest;
        }
        p -= payment;
        ++currTerm;
    }
    return {length: currTerm, amountPaid: amtPaid, remainingBalance: p + interest, forgivenInterest: totalForgivenInterest};
}

// Returns a table of results to display given a user's answers
function getResults(answers) {
    var calc = new Calculator(answers);
    console.log(calc.getPovertyLine());
    console.log(calc.getAgiForCalculation());
    console.log(calc.getDiscretionaryIncome());
    // Headers of results table
    var results = [
        ['Payment Plan',
        'Monthly Payment ($)',
        'Monthly Savings ($)',
        'Total Amount Paid ($)',
        'Projected Loan Forgiveness ($)',
        'Projected Loan Interest Forgiven ($)',
        'Amount Earned if Savings Invested ($)',
        'Repayment Period (months)']
    ];
    // 3-tuples containing payment plan name, monthly payment, and maximum repayment term
    var paymentPlans = [
        ['Current', calc.getCurrentMonthlyPayment(), Number.MAX_VALUE],
        ['Standard', calc.getStandardPayment(), 12 * 10],
        ['Extended', calc.getExtendedPayment(), 12 * 25],
        ['REPAYE', calc.getRepayePayment(), calc.getRepayePeriod(), {capitalize: false, numMonthsForgiven: calc.getRepayePeriod(), pctForgiven: 50}],
        ['PAYE', calc.getPayePayment(), 240, {capitalize: false, numMonthsForgiven: 36, pctForgiven: 100}],
        ['IBR', calc.getIbrPayment(), 300, {capitalize: false, numMonthsForgiven: 36, pctForgiven: 100}],
        ['IBR for New Borrowers', calc.getIbrForNewBorrowerPayment(), 240, {capitalize: false, numMonthsForgiven: 36, pctForgiven: 100}],
        ['ICR', calc.getIcrPayment(), 300, {capitalize: true, numMonthsForgiven: 0, pctForgiven: 0}]
    ];

    // Go through each plan and monthly payment and add row to results table
    for (var i = 0; i < paymentPlans.length; ++i) {
        var plan = paymentPlans[i][0];
        var payment = paymentPlans[i][1];
        var maxPeriod = paymentPlans[i][2];
        var options = paymentPlans[i][3];
        var savings = calc.getCurrentMonthlyPayment() - payment;
        // Max period possible for the given plan
        // Period required if the payments were to pay off the entire balance
        var finalLoanState = getFinalLoanState(calc.getPrincipleBalance(), calc.getInterestRate(), payment, maxPeriod, options);
        var fullPeriod = finalLoanState['length'];
        var amtPaid = finalLoanState['amountPaid'];
        var forgiveness = finalLoanState['remainingBalance'];
        var forgivenInterest = finalLoanState['forgivenInterest'];
        // Take min of the two of the maxPeriod exists
        var period = maxPeriod ? Math.min(maxPeriod, fullPeriod) : fullPeriod;
        // Projected forigveness is full amount that would be paid minus the amount that is paid
        // Projected earings if savings are Invested
        var fv = getFvIncreasingAnnuity(0, savings, AVERAGE_SANDP_RETURN, 12, period / 12);
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
                fmtAsMoney(amtPaid, fun),
                fmtAsMoney(forgiveness, forgivenessFun),
                fmtAsMoney(forgivenInterest, forgivenessFun),
                fmtAsMoney(fv, forgivenessFun),
                period
            ];
        } else {
            nextPlan = [
                plan + ' (ineligable)',
                '-',
                '-',
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

// Tests calculation of repayment periods for loans
function runPeriodTests() {
    for (var i = 0; i < 500; ++i) {
        var p = randFloat(3000, 70000);
        var r = randFloat(2, 9);
        var m = randFloat(25, 550);
        var t1 = getPeriodOld(p, r, m);
        var t2 = getFinalLoanState(p, r, m, 12 * 1000)['length'];
        if (t1 != t2 && !(Number.isNaN(t1) && t2 == 12 * 1000)) {
            console.log('Period test ' + i + ' failed!\tt1 = ' + t1 + ' t2 = ' + t2 + '\t(p = ' + p + ' r = ' + r + ' m = ' + m + ')');
            return;
        }
    }
    console.log('Period tests passed!');
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function randFloat(min, max) {
    return Math.random() * (max - min) + min + Math.random();
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
runPeriodTests();

var answers = {"q1":"MA","q2":"Yes","q3":"Yes","q4":"Yes","q5":"No","q6":"2016-01-01T05:00:00.000Z","q7":"No","q10":"No","q11":"Single","q14": "1", "q15":"30000","q16":"300","q17":"25000","q18":"5","q19":"Current","q21":"200","q22":"Yes"}
console.log(getResults(answers));
