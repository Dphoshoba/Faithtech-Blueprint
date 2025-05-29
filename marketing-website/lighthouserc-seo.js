module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 0.9 }],
        'meta-description': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'html-has-lang': ['error', { minScore: 1 }],
        'link-text': ['error', { minScore: 1 }],
        'robots-txt': ['error', { minScore: 1 }],
        'tap-targets': ['error', { minScore: 1 }],
        'hreflang': ['error', { minScore: 1 }],
        'canonical': ['error', { minScore: 1 }],
        'font-size': ['error', { minScore: 1 }],
        'plugins': ['error', { minScore: 1 }],
        'structured-data': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}; 