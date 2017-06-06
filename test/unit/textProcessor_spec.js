var expect = chai.expect;

describe('TextProcessor', () => {
  it('should exist', () => {
    expect(TextProcessor).to.exist;
  });

  describe('#parse', () => {
    var URL = TextProcessor.TYPE.URL;
    var TXT = TextProcessor.TYPE.TXT;

    it('should exist and be a function', () => {
      expect(TextProcessor.parse).to.exist;
      expect(TextProcessor.parse).to.be.a('function');
    });


    var testCases = [{
      title: 'should process correctly text only lines',
      data: [{
        value: 'A line  without   URL    and more than 1 consecutive white spaces',
        type: TXT,
      }],
    }, {
      title: 'should process correctly a line that is exactly an URL',
      data: [{
        value: 'https://url1.com',
        type: URL,
      }],
    }, {
      title: 'should process correctly mixed lines that end on an URL',
      data: [{
        value: 'p1 p2  p3   line.newphrase    ',
        type: TXT,
      }, {
        value: 'http://url1.com',
        type: URL,
      }, {
        value: '  ',
        type: TXT,
      }, {
        value: 'http://url2.es',
        type: URL,
      }, {
        value: ' ',
        type: TXT,
      }, {
        value: 'http://url3.com',
        type: URL,
      }],
    }, {
      title: 'should process correctly mixed lines that end in text',
      data: [{
        value: 'p1 p2  p3   line.newphrase    ',
        type: TXT,
      }, {
        value: 'http://url1.com',
        type: URL,
      }, {
        value: ' ',
        type: TXT,
      }, {
        value: 'http://url2.es',
        type: URL,
      }, {
        value: '  text',
        type: TXT,
      }],
    }, {
      title: 'should process correctly lines that start with a valid url and finish with text',
      data: [{
        value: 'http://www.url1.com',
        type: URL,
      }, {
        value: ' text',
        type: TXT,
      }],
    }, {
      title: 'should process correctly lines that start with a valid URL and finish with text' +
             ' (including contiguous white spaces',
      data: [{
        value: 'http://www.url1.com',
        type: URL,
      }, {
        value: '  text',
        type: TXT,
      }],
    }];

    testCases.forEach((testCase) => {
      it(testCase.title, () => {
        var fullLine = '';
        var input = testCase.data;

        input.forEach((partOfLine) => {
          fullLine += partOfLine.value;
        });

        var result = TextProcessor.parse(fullLine);

        expect(result.length).to.equal(input.length);

        for (var i = 0, l = result.length; i < l; i++) {
          expect(result[i].type).to.equal(input[i].type);
          expect(result[i].value).to.equal(input[i].value);
        }
      });
    });
  });
});
