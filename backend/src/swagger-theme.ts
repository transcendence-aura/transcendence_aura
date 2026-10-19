export const SWAGGER_CUSTOM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

:root {
  --aura-page: #fafaf8;
  --aura-card: #ffffff;
  --aura-surface: #e8f0ec;
  --aura-subtle: #f3f1eb;
  --aura-text: #2c2420;
  --aura-text-secondary: #4a4540;
  --aura-text-muted: #a09890;
  --aura-border: #dedad4;
  --aura-accent: #dc9b9b;
  --aura-online: #3d7a5e;
  --aura-error: #c0392b;
  --aura-footer: #1e1b18;
}

html, body, .swagger-ui, .swagger-ui .wrapper { background: var(--aura-page) !important; }

.swagger-ui, .swagger-ui p, .swagger-ui li, .swagger-ui td, .swagger-ui th, .swagger-ui label,
.swagger-ui .btn, .swagger-ui select, .swagger-ui input, .swagger-ui textarea,
.swagger-ui .parameter__name, .swagger-ui .parameter__type, .swagger-ui .parameter__in,
.swagger-ui .response-col_status, .swagger-ui .response-col_description,
.swagger-ui .opblock-summary-description, .swagger-ui .tab li, .swagger-ui .model {
  font-family: 'Jost', sans-serif;
  color: var(--aura-text-secondary);
}

.swagger-ui .info .title, .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3,
.swagger-ui .opblock-tag, .swagger-ui section.models h4, .swagger-ui .dialog-ux .modal-ux-header h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 400;
  color: var(--aura-text);
}
.swagger-ui .info .title { font-size: 42px; font-weight: 300; font-style: italic; }
.swagger-ui .info .title small { background: var(--aura-accent); border-radius: 20px; }
.swagger-ui .info .title small.version-stamp { background: var(--aura-surface); }
.swagger-ui .info .title small.version-stamp pre { color: var(--aura-online); }
.swagger-ui .info .title small pre { color: var(--aura-text); font-family: 'Jost', sans-serif; }
.swagger-ui .info a { color: var(--aura-text); text-decoration: underline; }
.swagger-ui .info code, .swagger-ui .markdown code, .swagger-ui .renderedMarkdown code {
  background: var(--aura-surface);
  color: var(--aura-text);
  border-radius: 4px;
}

.swagger-ui .topbar {
  background: var(--aura-card);
  border-bottom: 0.5px solid var(--aura-border);
  padding: 0;
}
.swagger-ui .topbar .link, .swagger-ui .topbar a, .swagger-ui .topbar svg, .swagger-ui .topbar img {
  display: none !important;
}
.swagger-ui .topbar .topbar-wrapper { min-height: 64px; }
.swagger-ui .topbar .topbar-wrapper::before {
  content: 'Aura';
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  letter-spacing: 0.18em;
  color: var(--aura-text);
}

.swagger-ui .scheme-container {
  background: var(--aura-subtle);
  box-shadow: none;
  border-bottom: 0.5px solid var(--aura-border);
}
.swagger-ui .scheme-container .wrapper { background: transparent !important; }
.swagger-ui .servers > label select { background: var(--aura-card); }

.swagger-ui .opblock-tag { border-bottom: 0.5px solid var(--aura-border); }
.swagger-ui .opblock-tag:hover { background: var(--aura-subtle); }

.swagger-ui .opblock {
  border: 0.5px solid var(--aura-border);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(44, 36, 32, 0.06);
}
.swagger-ui .opblock.opblock-get { background: var(--aura-surface); border-color: var(--aura-border); }
.swagger-ui .opblock.opblock-get .opblock-summary { border-color: var(--aura-border); }
.swagger-ui .opblock.opblock-get .opblock-summary-method { background: var(--aura-online); }
.swagger-ui .opblock.opblock-post { background: var(--aura-subtle); border-color: var(--aura-border); }
.swagger-ui .opblock.opblock-post .opblock-summary { border-color: var(--aura-border); }
.swagger-ui .opblock.opblock-post .opblock-summary-method { background: var(--aura-text); }
.swagger-ui .opblock .opblock-summary-method {
  border-radius: 4px;
  font-family: 'Jost', sans-serif;
  font-weight: 500;
  letter-spacing: 0.08em;
}
.swagger-ui .opblock .opblock-summary-path,
.swagger-ui .opblock .opblock-summary-path__deprecated {
  font-family: 'Jost', sans-serif;
  font-weight: 500;
  color: var(--aura-text);
}
.swagger-ui .opblock .opblock-section-header {
  background: var(--aura-card);
  box-shadow: none;
  border-bottom: 0.5px solid var(--aura-border);
}
.swagger-ui .opblock .opblock-section-header .tab-header .tab-item.active h4 span::after {
  background: var(--aura-text) !important;
}
.swagger-ui .opblock .opblock-section-header h4 { color: var(--aura-text); font-family: 'Jost', sans-serif; }
.swagger-ui .opblock-body, .swagger-ui .opblock-description-wrapper { background: var(--aura-card); }
.swagger-ui .responses-inner { background: var(--aura-card); }
.swagger-ui table thead tr th, .swagger-ui table thead tr td {
  color: var(--aura-text-muted);
  border-bottom: 0.5px solid var(--aura-border);
  font-weight: 500;
}
.swagger-ui table.responses-table tbody tr td, .swagger-ui table.parameters tbody tr td {
  border-color: var(--aura-border);
}
.swagger-ui .response-col_status { color: var(--aura-text); font-weight: 500; }
.swagger-ui .parameter__name.required span, .swagger-ui .parameter__name.required::after { color: var(--aura-error); }
.swagger-ui .prop-type { color: var(--aura-online); }

.swagger-ui .btn {
  border-radius: 0;
  border: 1px solid var(--aura-text);
  box-shadow: none;
  background: transparent;
  color: var(--aura-text);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
  font-weight: 500;
}
.swagger-ui .btn:hover { box-shadow: none; background: var(--aura-subtle); }
.swagger-ui .btn.authorize { color: var(--aura-online); border-color: var(--aura-online); }
.swagger-ui .btn.authorize svg { fill: var(--aura-online); }
.swagger-ui .btn.execute { background: var(--aura-text); border-color: var(--aura-text); color: var(--aura-page); }
.swagger-ui .btn.execute:hover { background: var(--aura-text-secondary); }
.swagger-ui .btn.cancel, .swagger-ui .btn.btn-clear { color: var(--aura-error); border-color: var(--aura-error); }

.swagger-ui input[type=text], .swagger-ui input[type=password], .swagger-ui textarea, .swagger-ui select {
  background: var(--aura-card);
  border: 1px solid var(--aura-border);
  border-radius: 4px;
  box-shadow: none;
}
.swagger-ui input[type=text]:focus, .swagger-ui input[type=password]:focus,
.swagger-ui textarea:focus, .swagger-ui select:focus {
  outline: none;
  border-color: var(--aura-text);
}

.swagger-ui .highlight-code > .microlight, .swagger-ui .microlight, .swagger-ui pre.microlight {
  background: var(--aura-footer) !important;
  border-radius: 4px;
}

.swagger-ui section.models {
  background: var(--aura-card);
  border: 0.5px solid var(--aura-border);
  border-radius: 4px;
}
.swagger-ui section.models .model-container { background: var(--aura-subtle); border-radius: 4px; }
.swagger-ui .model-box { background: transparent; border: 0; box-shadow: none; }
.swagger-ui section.models .model-container .model-box { padding: 0; }
.swagger-ui section.models h4 { border-bottom: 0.5px solid var(--aura-border); }
.swagger-ui .model-title { color: var(--aura-text); box-shadow: none; border: 0; background: transparent; }
.swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table, .swagger-ui .info .base-url,
.swagger-ui .opblock .opblock-summary-description, .swagger-ui .opblock-description-wrapper p,
.swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .markdown p, .swagger-ui .renderedMarkdown p,
.swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5, .swagger-ui .scheme-container label,
.swagger-ui .opblock-tag small, .swagger-ui .model-title, .swagger-ui .model, .swagger-ui .prop-type {
  font-family: 'Jost', sans-serif !important;
}

.swagger-ui .dialog-ux .modal-ux {
  background: var(--aura-card);
  border: 0.5px solid var(--aura-border);
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(44, 36, 32, 0.14);
}
.swagger-ui .dialog-ux .modal-ux-header { border-bottom: 0.5px solid var(--aura-border); }
`;
