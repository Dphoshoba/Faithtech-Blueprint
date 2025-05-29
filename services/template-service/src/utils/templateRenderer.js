const cheerio = require('cheerio');
const prettier = require('prettier');
const CleanCSS = require('clean-css');
const UglifyJS = require('uglify-js');

// Helper to merge HTML content
const mergeHTML = (baseHTML, customHTML) => {
  if (!customHTML) return baseHTML;
  
  const base$ = cheerio.load(baseHTML);
  const custom$ = cheerio.load(customHTML);

  // Replace or merge content based on data-component-id
  custom$('[data-component-id]').each((_, elem) => {
    const componentId = custom$(elem).attr('data-component-id');
    const baseElem = base$(`[data-component-id="${componentId}"]`);
    if (baseElem.length) {
      baseElem.replaceWith(elem);
    }
  });

  return prettier.format(base$.html(), { parser: 'html' });
};

// Helper to merge CSS content
const mergeCSS = (baseCSS, customCSS) => {
  const merged = [baseCSS, customCSS].filter(Boolean).join('\n');
  return new CleanCSS({
    level: 2,
    format: 'beautify'
  }).minify(merged).styles;
};

// Helper to merge JS content
const mergeJS = (baseJS, customJS) => {
  const merged = [baseJS, customJS].filter(Boolean).join('\n');
  return UglifyJS.minify(merged, {
    compress: true,
    mangle: true,
    output: {
      beautify: true
    }
  }).code;
};

// Helper to apply component settings
const applySettings = (content, settings) => {
  if (!settings || Object.keys(settings).length === 0) return content;

  const $ = cheerio.load(content);

  // Apply settings based on data attributes
  Object.entries(settings).forEach(([key, value]) => {
    $(`[data-setting="${key}"]`).each((_, elem) => {
      const $elem = $(elem);
      
      // Handle different types of settings
      switch ($elem.attr('data-setting-type')) {
        case 'text':
          $elem.text(value);
          break;
        case 'html':
          $elem.html(value);
          break;
        case 'class':
          $elem.attr('class', value);
          break;
        case 'style':
          $elem.css(JSON.parse(value));
          break;
        case 'attr':
          Object.entries(JSON.parse(value)).forEach(([attr, val]) => {
            $elem.attr(attr, val);
          });
          break;
      }
    });
  });

  return $.html();
};

// Main HTML generation function
exports.generateHTML = async (instance) => {
  const template = instance.template;
  let html = '';
  let css = '';
  let js = '';

  // Process each component
  for (const component of template.components) {
    const customization = instance.customizations.find(
      c => c.componentId.toString() === component._id.toString()
    );

    // Merge HTML
    const componentHTML = mergeHTML(
      component.content.html,
      customization?.changes?.html
    );

    // Apply settings
    const finalHTML = applySettings(
      componentHTML,
      {
        ...component.settings,
        ...(customization?.changes?.settings || {})
      }
    );

    html += finalHTML;

    // Merge CSS
    css = mergeCSS(
      css,
      mergeCSS(
        component.content.css,
        customization?.changes?.css
      )
    );

    // Merge JS
    js = mergeJS(
      js,
      mergeJS(
        component.content.js,
        customization?.changes?.js
      )
    );
  }

  // Wrap HTML with template structure
  html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${instance.name}</title>
      <link rel="stylesheet" href="styles.css">
    </head>
    <body>
      ${html}
      <script src="script.js"></script>
    </body>
    </html>
  `;

  // Format final output
  return {
    html: prettier.format(html, { parser: 'html' }),
    css,
    js
  };
};

// Helper to validate template structure
exports.validateTemplate = (template) => {
  const errors = [];

  if (!template.components || !Array.isArray(template.components)) {
    errors.push('Template must have an array of components');
    return errors;
  }

  template.components.forEach((component, index) => {
    if (!component.content) {
      errors.push(`Component ${index + 1} must have content`);
    }

    if (component.content && !component.content.html) {
      errors.push(`Component ${index + 1} must have HTML content`);
    }

    if (component.settings) {
      try {
        // Validate settings structure
        Object.entries(component.settings).forEach(([key, value]) => {
          if (typeof key !== 'string') {
            errors.push(`Component ${index + 1} has invalid setting key`);
          }
          if (value === undefined || value === null) {
            errors.push(`Component ${index + 1} has invalid setting value for ${key}`);
          }
        });
      } catch (error) {
        errors.push(`Component ${index + 1} has invalid settings structure`);
      }
    }
  });

  return errors;
}; 