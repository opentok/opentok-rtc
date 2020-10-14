!(globals => {
  const EJSTemplate = function (aTemplateOptions) {
    if (aTemplateOptions.url) {
      this._templatePromise =
        Request.sendXHR('GET', aTemplateOptions.url, null, null, 'text')
          .then(aTemplateSrc => {
            return ejs.compile(aTemplateSrc, { filename: aTemplateOptions.url });
          });
    } else {
      this._templatePromise = Promise.resolve(ejs.compile(aTemplateOptions.text));
    }
    this.render = function (aData) {
      return this._templatePromise.then(aTemplate => {
        return aTemplate(aData);
      });
    };
  };

  globals.EJSTemplate = EJSTemplate;
})(this);
