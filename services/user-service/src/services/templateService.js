/**
 * Template Service
 * Handles template rendering, variable substitution, and PDF generation
 */

const Template = require('../models/Template');
const TemplateInstance = require('../models/TemplateInstance');

/**
 * Render template with user variables
 * @param {Object} template - Template object
 * @param {Object} variables - User-provided variable values
 * @returns {String} - Rendered content
 */
const renderTemplate = (template, variables) => {
  let content = template.content;

  // Replace all variables in the format {{variableName}}
  template.variables.forEach(variable => {
    const value = variables[variable.key] || variable.defaultValue || '';
    const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'g');
    content = content.replace(regex, value);
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  content = processConditionals(content, variables);

  // Handle loops {{#each array}}...{{/each}}
  content = processLoops(content, variables);

  return content;
};

/**
 * Process conditional blocks in template
 * @param {String} content - Template content
 * @param {Object} variables - Variable values
 * @returns {String} - Processed content
 */
const processConditionals = (content, variables) => {
  const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  
  return content.replace(conditionalRegex, (match, variableName, blockContent) => {
    const value = variables[variableName];
    // Show block if variable is truthy
    return value ? blockContent : '';
  });
};

/**
 * Process loops in template
 * @param {String} content - Template content
 * @param {Object} variables - Variable values
 * @returns {String} - Processed content
 */
const processLoops = (content, variables) => {
  const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
  
  return content.replace(loopRegex, (match, arrayName, blockContent) => {
    const array = variables[arrayName];
    
    if (!Array.isArray(array)) {
      return '';
    }
    
    return array.map((item, index) => {
      let itemContent = blockContent;
      // Replace {{this}} with array item
      itemContent = itemContent.replace(/{{this}}/g, item);
      // Replace {{index}} with array index
      itemContent = itemContent.replace(/{{index}}/g, index + 1);
      return itemContent;
    }).join('');
  });
};

/**
 * Convert markdown to HTML
 * @param {String} markdown - Markdown content
 * @returns {String} - HTML content
 */
const markdownToHTML = (markdown) => {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
};

/**
 * Generate HTML from template and variables
 * @param {Object} template - Template object
 * @param {Object} instance - Template instance with variables
 * @returns {String} - Complete HTML document
 */
const generateHTML = (template, instance) => {
  // Render template with variables
  const renderedContent = renderTemplate(template, instance.variables || {});
  
  // Convert to HTML if markdown
  const bodyContent = template.contentType === 'markdown' 
    ? markdownToHTML(renderedContent)
    : renderedContent;

  // Apply branding
  const branding = instance.branding || {};
  const styling = template.styling || {};

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${instance.title}</title>
        <style>
          @page {
            size: ${styling.pageSize || 'Letter'};
            margin: ${styling.margins?.top || 1}in ${styling.margins?.right || 1}in ${styling.margins?.bottom || 1}in ${styling.margins?.left || 1}in;
          }
          body {
            font-family: ${branding.fontFamily || styling.fontFamily || 'Arial, sans-serif'};
            font-size: ${styling.fontSize || 12}pt;
            color: #333;
            line-height: 1.6;
          }
          h1, h2, h3 {
            color: ${branding.primaryColor || styling.primaryColor || '#1976d2'};
          }
          .header {
            text-align: center;
            border-bottom: 2px solid ${branding.primaryColor || styling.primaryColor || '#1976d2'};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img {
            max-height: 100px;
            margin-bottom: 10px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 10pt;
            color: #666;
            text-align: center;
          }
          .content {
            margin: 20px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: ${branding.primaryColor || styling.primaryColor || '#1976d2'};
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${branding.logoURL ? `<img src="${branding.logoURL}" alt="Logo">` : ''}
          ${branding.organizationName ? `<h1>${branding.organizationName}</h1>` : ''}
          ${branding.headerText ? `<p>${branding.headerText}</p>` : ''}
        </div>
        
        <div class="content">
          ${bodyContent}
        </div>
        
        <div class="footer">
          ${branding.footerText || styling.footerText || ''}
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `;

  return html;
};

/**
 * Validate template variables
 * @param {Object} template - Template object
 * @param {Object} variables - User-provided variables
 * @returns {Object} - Validation result with errors
 */
const validateVariables = (template, variables) => {
  const errors = {};

  template.variables.forEach(variable => {
    const value = variables[variable.key];

    // Check required
    if (variable.required && (!value || value.trim() === '')) {
      errors[variable.key] = `${variable.label} is required`;
      return;
    }

    // Skip validation if no value provided and not required
    if (!value) return;

    // Type validation
    switch (variable.type) {
      case 'number':
        if (isNaN(value)) {
          errors[variable.key] = `${variable.label} must be a number`;
        } else if (variable.validation) {
          const numValue = parseFloat(value);
          if (variable.validation.min !== undefined && numValue < variable.validation.min) {
            errors[variable.key] = `${variable.label} must be at least ${variable.validation.min}`;
          }
          if (variable.validation.max !== undefined && numValue > variable.validation.max) {
            errors[variable.key] = `${variable.label} must be at most ${variable.validation.max}`;
          }
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[variable.key] = `${variable.label} must be a valid email address`;
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch (e) {
          errors[variable.key] = `${variable.label} must be a valid URL`;
        }
        break;

      case 'select':
        if (variable.options && !variable.options.includes(value)) {
          errors[variable.key] = `${variable.label} must be one of the provided options`;
        }
        break;

      case 'text':
      case 'textarea':
        if (variable.validation?.pattern) {
          const regex = new RegExp(variable.validation.pattern);
          if (!regex.test(value)) {
            errors[variable.key] = variable.validation.message || `${variable.label} format is invalid`;
          }
        }
        break;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Generate PDF from HTML (placeholder - would integrate with puppeteer or similar)
 * @param {String} html - HTML content
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generatePDF = async (html, options = {}) => {
  // This is a placeholder. In production, you would use:
  // - puppeteer
  // - pdfkit
  // - wkhtmltopdf
  // - or a cloud service like DocRaptor, PDFShift

  console.log('PDF generation requested (mock implementation)');
  console.log('Options:', options);
  
  // For now, return a mock response
  return Buffer.from('Mock PDF content');
};

module.exports = {
  renderTemplate,
  processConditionals,
  processLoops,
  markdownToHTML,
  generateHTML,
  validateVariables,
  generatePDF
};

