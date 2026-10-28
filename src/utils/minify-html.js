const htmlmin = require("html-minifier");

module.exports = function(content) {
  const outputPath = this.page.outputPath;
  if( typeof outputPath === "string" && outputPath.endsWith(".html") ) {
    let minified = htmlmin.minify(content, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true
    });
    return minified;
  }
  return content;
}
