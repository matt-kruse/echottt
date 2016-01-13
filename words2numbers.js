var adders = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
    "thirty": 30,
    "forty": 40,
    "fourty": 40,
    "fifty": 50,
    "sixty": 60,
    "seventy": 70,
    "eighty": 80,
    "ninety": 90
};
var multipliers = {
    "hundred":  100,
    "thousand": 1000,
    "million": 1000000,
    "billion": 1000000000,
    "trillion": 1000000000000
};
var wordArrayToNumber = function(tokens) {
    var num = 0, tempNum=0;
    tokens.forEach(function(token) {
        if (token=="and") { return; }
        if (adders[token]) {
            tempNum += adders[token];
        }
        else if (multipliers[token]) {
            if (token!="hundred") {
                num += (tempNum*multipliers[token]);
                tempNum=0;
            }
            else {
                tempNum = (tempNum*multipliers[token]);
            }
        }
    });
    if (tempNum>0) { num+=tempNum; }
    return num;
}

var convertWordsToNumbers = function(s) {
    if (typeof s!="string") { return s; }
    var and=null, newTokens=[], numberTokens=[];
    // Split the string to parse it token by token
    var tokens = s.split(' ');
    
    // Iterate through each token and look for numbers as words
    tokens.forEach(function(token) {
        var t = token.toLowerCase();
        if (adders[t] || multipliers[t] || (t=="and" && numberTokens.length>0)) {
            // Found a number word
            numberTokens.push(t);
        }
        else {
            if (numberTokens.length>0) {
                // If the last token was "and" but we're out of number tokens, put it back
                if (numberTokens[numberTokens.length-1]=="and") {
                    and = numberTokens.pop();
                }
                else {
                    and = null;
                }
                newTokens.push(wordArrayToNumber(numberTokens));
                numberTokens=[];
                if (and) {
                    newTokens.push(and);
                }
            }
            newTokens.push(token);
        }
    });
    if (numberTokens.length>0) {
        newTokens.push(wordArrayToNumber(numberTokens));
        numberTokens=[];
    }
    
    return newTokens.join(' ');
}
module.exports = convertWordsToNumbers;
