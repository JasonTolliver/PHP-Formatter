/*
 * Formatter for Selenium 2 / WebDriver Ruby Test/Unit client.
 */

var subScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
subScriptLoader.loadSubScript('chrome://selenium-ide/content/formats/webdriver.js', this);

function testClassName(testName) {
  return testName.split(/[^0-9A-Za-z]+/).map(
      function(x) {
        return capitalize(x);
      }).join('');
}

function testMethodName(testName) {
  return "test_" + underscore(testName);
}

function nonBreakingSpace() {
  return "\"\\xa0\"";
}

function array(value) {
  var str = '[';
  for (var i = 0; i < value.length; i++) {
    str += string(value[i]);
    if (i < value.length - 1) str += ", ";
  }
  str += ']';
  return str;
}

notOperator = function() {
  return "!";
};

Equals.prototype.toString = function() {
  return this.e2.toString() + " == " + this.e1.toString();
};

Equals.prototype.assert = function() {
  return "$this->assertEquals(" + this.e1.toString() + ", " + this.e2.toString() + ");";
};

Equals.prototype.verify = function() {
  return verify(this.assert());
};

NotEquals.prototype.toString = function() {
  return this.e1.toString() + " != " + this.e2.toString();
};

NotEquals.prototype.assert = function() {
  return "$this->assertNotEquals(" + this.e1.toString() + ", " + this.e2.toString() + ");";
};

NotEquals.prototype.verify = function() {
  return verify(this.assert());
};

function joinExpression(expression) {
  return "implode(\",\"," + expression.toString() + ")";
}

function statement(expression) {
  expression.noBraces = true;
  return expression.toString();
}

function assignToVariable(type, variable, expression) {
  return variable + " = " + expression.toString();
}

function ifCondition(expression, callback) {
  return "if (" + expression.toString() + ") {\n" + callback() + "}";
}

function tryCatch(tryStatement, catchStatement, exception) {
  return "try {\n" +
      indents(1) + tryStatement + "\n" +
      "} catch(" + exception + ") {\n" +
      indents(1) + catchStatement + "\n" +
      "}";
}

function assertTrue(expression) {
  return "$this->assertTrue(" + expression.toString() + ");";
}

function assertFalse(expression) {
  return "$this->assertFalse(" + expression.toString() + ");";
}

function verify(statement) {
  return tryCatch(statement, "$this->array_push($this->verificationErrors, $e->toString());","PHPUnit_Framework_AssertionFailedError $e");
}

function verifyTrue(expression) {
  return verify(assertTrue(expression));
}

function verifyFalse(expression) {
  return verify(assertFalse(expression));
}

RegexpMatch.patternAsRegEx = function(pattern) {
  var str = pattern.replace(/\//g, "\\/");
  if (str.match(/\n/)) {
    str = str.replace(/\n/g, '\\n');
    return '/' + str + '/m';
  } else {
    return str = '/' + str + '/';
  }
};

RegexpMatch.prototype.patternAsRegEx = function() {
  return RegexpMatch.patternAsRegEx(this.pattern);
};

RegexpMatch.prototype.toString = function() {
  return "preg_match(" + this.patternAsRegEx() + this.expression + ") === 1";
};

RegexpMatch.prototype.assert = function() {
  return '$this->assertRegExp(' + this.patternAsRegEx() + ', ' + this.expression + ");";
};

RegexpMatch.prototype.verify = function() {
  return verify(this.assert());
};

RegexpNotMatch.prototype.patternAsRegEx = function() {
  return RegexpMatch.patternAsRegEx(this.pattern);
};

RegexpNotMatch.prototype.toString = function() {
  return this.expression + " !~ " + this.patternAsRegEx();
};

RegexpNotMatch.prototype.assert = function() {
  return '$this->assertNotRegExp(' + this.patternAsRegEx() + ', ' + this.expression + ");";
};

RegexpNotMatch.prototype.verify = function() {
  return verify(this.assert());
};

function waitFor(expression) {
  var negative = expression.negative ? '!' : '';
  return "for ($second = 0;; $second++) { if ($second >= 60) $this->fail(\"timeout\"); if (" +
         negative + expression.invert().toString() +
         ") break; sleep(1); }";
}

function assertOrVerifyFailure(line, isAssert) {
  return tryCatch(line, "return FALSE;", "Exception $expected") +
         '\n\n' +
         '$this->fail("An expected Exception has not been raised.");';
}

function pause(milliseconds) {
  return "sleep(" + (parseInt(milliseconds) / 1000) + ");";
}

function echo(message) {
  return "echo " + xlateArgument(message) + ";";
}

function formatComment(comment) {
  return comment.comment.replace(/.+/mg, function(str) {
    return "// " + str;
  });
}

// TODO
/**
 * Returns a string representing the suite for this formatter language.
 *
 * @param testSuite  the suite to format
 * @param filename   the file the formatted suite will be saved as
 */
function formatSuite(testSuite, filename) {
  formattedSuite = 'require "test/unit"\n' +
      '\n';

  for (var i = 0; i < testSuite.tests.length; ++i) {
    // have saved or loaded a suite
    if (typeof testSuite.tests[i].filename != 'undefined') {
      formattedSuite += 'require "' + testSuite.tests[i].filename.replace(/\.\w+$/, '') + '"\n';
    } else {
      // didn't load / save as a suite
      var testFile = testSuite.tests[i].getTitle();
      formattedSuite += 'require "' + testFile + '"\n';
    }
  }
  return formattedSuite;
}

function defaultExtension() {
  return this.options.defaultExtension;
}


WDAPI.Driver = function() {
  this.ref = options.receiver;
};

this.options = {
  receiver: "$this->session",
  showSelenese: 'false',
  header:
          '<?php\n' +
          '\n' +
          'class ${className} extends PHPUnit_Extensions_SeleniumTestCase {\n' +
          '\n' +
          '  public function ${methodName}(){\n',
  footer:
          "  }\n" +
          "  \n" +
          "  public function element_present(how, what) {\n" +
          "    try {\n" +
          "      " + this.ref + "->element(how, what)\n" +
          "      return TRUE;\n" +
          "    } catch (Exception $e) { return FALSE; }\n" +
          "      return FALSE;\n" +
          "    }\n" +
          "  }\n" +
          "}\n" +
          "\n" +
          "?>",
  indent: "2",
  initialIndents: "2",
  defaultExtension: "php"
};

this.configForm =
    '<description>Variable for Selenium instance</description>' +
        '<textbox id="options_receiver" />' +
        '<description>Header</description>' +
        '<textbox id="options_header" multiline="true" flex="1" rows="4"/>' +
        '<description>Footer</description>' +
        '<textbox id="options_footer" multiline="true" flex="1" rows="4"/>' +
        '<description>Indent</description>' +
        '<menulist id="options_indent"><menupopup>' +
        '<menuitem label="Tab" value="tab"/>' +
        '<menuitem label="1 space" value="1"/>' +
        '<menuitem label="2 spaces" value="2"/>' +
        '<menuitem label="3 spaces" value="3"/>' +
        '<menuitem label="4 spaces" value="4"/>' +
        '<menuitem label="5 spaces" value="5"/>' +
        '<menuitem label="6 spaces" value="6"/>' +
        '<menuitem label="7 spaces" value="7"/>' +
        '<menuitem label="8 spaces" value="8"/>' +
        '</menupopup></menulist>' +
        '<checkbox id="options_showSelenese" label="Show Selenese"/>';

this.name = "PHP / PHPUnit / WebDriver";
this.testcaseExtension = ".php";
this.suiteExtension = ".php";
this.webdriver = true;

SeleniumWebDriverAdaptor.prototype.isTextPresent = function(elementLocator) {
  var driver = new WDAPI.Driver();
  return driver.isTextPresent(this.rawArgs[0]);
};

WDAPI.Driver.searchContext = function(locatorType, locator) {
  var locatorString = xlateArgument(locator);
  switch (locatorType) {
    case 'xpath':
      return "'xpath', " + locatorString;
    case 'css':
      return "'css', " + locatorString;
    case 'id':
      return "'id', " + locatorString;
    case 'link':
      return "'link', " + locatorString;
    case 'name':
      return "'name', " + locatorString;
    case 'tag_name':
      return "'tag_name', " + locatorString;
  }
  throw 'Error: unknown strategy [' + locatorType + '] for locator [' + locator + ']';
};

WDAPI.Driver.prototype.back = function() {
  return this.ref + "->back()";
};

WDAPI.Driver.prototype.close = function() {
  return this.ref + "->close()";
};

WDAPI.Driver.prototype.findElement = function(locatorType, locator) {
  return new WDAPI.Element(this.ref + "->element(" + WDAPI.Driver.searchContext(locatorType, locator) + ")");
};

WDAPI.Driver.prototype.findElements = function(locatorType, locator) {
  return new WDAPI.ElementList(this.ref + "->elements(" + WDAPI.Driver.searchContext(locatorType, locator) + ")");
};

WDAPI.Driver.prototype.isTextPresent = function(text) {
  return '$this->assertContains("' + text + '", ' + this.ref + '->source())';
}

WDAPI.Driver.prototype.getCurrentUrl = function() {
  return this.ref + "->url()";
};

WDAPI.Driver.prototype.get = function(url) {
  if (url.length > 1 && (url.substring(1,8) == "http://" || url.substring(1,9) == "https://")) { // url is quoted
    return this.ref + "->open(" + url + ")";
  } else {
    return this.ref + "->open($base_url + " + url + ")";
  }
};

WDAPI.Driver.prototype.getTitle = function() {
  return this.ref + "->title()";
};

WDAPI.Driver.prototype.refresh = function() {
  return this.ref + "->refresh()";
};

WDAPI.Element = function(ref) {
  this.ref = ref;
};

WDAPI.Element.prototype.clear = function() {
  return this.ref + "->clear()";
};

WDAPI.Element.prototype.click = function() {
  return this.ref + "->click()";
};

WDAPI.Element.prototype.getAttribute = function(attributeName) {
  return this.ref + "->attribute(" + xlateArgument(attributeName) + ")";
};

WDAPI.Element.prototype.getText = function() {
  return this.ref + "->text()";
};

WDAPI.Element.prototype.isDisplayed = function() {
  return this.ref + "->displayed()";
};

WDAPI.Element.prototype.isSelected = function() {
  return this.ref + "->selected()";
};

WDAPI.Element.prototype.sendKeys = function(text) {
  return this.ref + "->sendKeys(" + xlateArgument(text) + ")";
};

WDAPI.Element.prototype.submit = function() {
  return this.ref + "->submit()";
};

WDAPI.Element.prototype.select = function(label) {
  return "Selenium_WebDriver_Support_Select::new(" + this.ref + ")->select_by('text', " + xlateArgument(label) + ")";
};

WDAPI.ElementList = function(ref) {
  this.ref = ref;
};

WDAPI.ElementList.prototype.getItem = function(index) {
  return this.ref + "[" + index + "]";
};

WDAPI.ElementList.prototype.getSize = function() {
  return this.ref + "->size()";
};

WDAPI.ElementList.prototype.isEmpty = function() {
  return this.ref + "->empty()";
};


WDAPI.Utils = function() {
};

WDAPI.Utils.isElementPresent = function(how, what) {
  return "element_present('" + how + "', " + xlateArgument(what) + ")";
};
