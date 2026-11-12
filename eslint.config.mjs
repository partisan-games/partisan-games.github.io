import globals from 'globals'

export default [{
  ignores: ['libs/**', 'node_modules/**', 'test-results/**'],
}, {
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
    },

    ecmaVersion: 'latest',
    sourceType: 'module',

    parserOptions: {
      ecmaFeatures: {
        impliedStrict: true,
        jsx: true,
      },
    },
  },

  rules: {
    'array-callback-return': 'error',
    'no-constant-binary-expression': 'error',
    'no-promise-executor-return': 'error',
    'no-self-compare': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unsafe-optional-chaining': 'error',
    'array-bracket-spacing': ['warn', 'never'],
    'arrow-body-style': ['warn', 'as-needed'],
    'arrow-parens': ['warn', 'as-needed'],
    'arrow-spacing': 'warn',
    'block-scoped-var': 'error',
    'brace-style': ['warn', '1tbs'],

    'comma-spacing': ['warn', {
      before: false,
      after: true,
    }],

    'computed-property-spacing': ['warn', 'never'],
    'constructor-super': 'error',
    curly: ['warn', 'multi'],
    'dot-notation': 'warn',
    'getter-return': 'error',

    indent: ['warn', 2, {
      SwitchCase: 1,
    }],

    'key-spacing': ['warn', {
      afterColon: true,
    }],

    'keyword-spacing': 'warn',
    'no-class-assign': ['error'],
    'no-cond-assign': 'error',
    'no-const-assign': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': 'error',
    'no-global-assign': 'error',
    'no-invalid-this': 'error',

    'no-multi-spaces': ['warn', {
      ignoreEOLComments: true,
    }],

    'no-multiple-empty-lines': ['warn', {
      max: 1,
      maxEOF: 1,
    }],

    'no-param-reassign': 'warn',
    'no-redeclare': 'error',
    'no-return-assign': ['warn', 'always'],
    'no-shadow-restricted-names': 'error',
    'no-this-before-super': 'error',
    'no-trailing-spaces': 'warn',
    'no-undef': 'error',
    'no-unexpected-multiline': 'error',
    'no-unneeded-ternary': 'warn',
    'no-unreachable': 'error',
    'no-unused-private-class-members': 'warn',

    'no-unused-vars': ['error', {
      args: 'after-used',
    }],

    'no-use-before-define': ['error', {
      functions: false,
    }],

    'no-useless-constructor': 'warn',
    'no-useless-rename': 'error',
    'no-var': 'error',
    'object-curly-spacing': ['warn', 'always'],
    'object-shorthand': 'warn',
    'operator-assignment': ['warn', 'always'],
    'prefer-arrow-callback': 'warn',

    'prefer-const': ['warn', {
      ignoreReadBeforeAssign: true,
    }],

    'prefer-destructuring': ['warn', {
      object: true,
      array: false,
    }],

    'prefer-spread': 'error',
    quotes: ['warn', 'single'],

    semi: ['warn', 'never', {
      beforeStatementContinuationChars: 'always',
    }],

    'semi-spacing': ['warn', {
      before: false,
      after: true,
    }],

    'space-before-blocks': 'warn',
    'space-before-function-paren': ['warn', 'never'],
    'space-in-parens': ['warn', 'never'],
    'space-infix-ops': 'warn',
    'spaced-comment': ['warn', 'always'],
    'vars-on-top': 'error',

    yoda: ['error', 'never', {
      exceptRange: true,
    }],
  },
}, {
  // browser timers caused bugs in games: they keep running through pause, game over and a switch to another game
  files: ['core/**/*.js', 'core3d/**/*.js', 'scenes/**/*.js'],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: "MethodDefinition[key.name='update'] CallExpression[callee.name='setTimeout']",
      message: 'update() runs every frame, so this schedules a new timer each frame; count game time with dt instead.',
    }, {
      selector: "CallExpression[callee.name='setTimeout']:not(MethodDefinition[key.name='update'] CallExpression)",
      message: 'A browser timer keeps running through pause and into the next game; use after() of the session scopes (this.session.gameplay or presentation) or of an actor clock.',
    }, {
      selector: "CallExpression[callee.name='setInterval'], CallExpression[callee.property.name='setInterval']",
      message: 'An interval keeps running through pause and after the game ends; count game time with dt in update() instead.',
    }, {
      selector: "CallExpression[callee.object.name=/^(Date|performance)$/][callee.property.name='now'], NewExpression[callee.name='Date']",
      message: 'Wall-clock time runs on through pause and after the game ends; count game time with dt or read the session clock.',
    }],
  },
}, {
  // the rules and the runtime are plain logic that every game shares: they must not reach into games, the page or rendering
  files: ['core/gameplay/**/*.js', 'core/runtime/**/*.js'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        regex: '^(/|three)',
        message: 'core/gameplay and core/runtime import only each other, by relative path: no games, page, rendering or io.',
      }],
    }],
  },
}]
