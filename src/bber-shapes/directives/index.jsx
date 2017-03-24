
import { union } from 'lodash'

const BLOCK_DIRECTIVE_MARKER = ':'
const INLINE_DIRECTIVE_MARKER = ':'
const BLOCK_DIRECTIVE_FENCE = '::: '
const INLINE_DIRECTIVE_FENCE = '::: '
const BLOCK_DIRECTIVE_MARKER_MIN_LENGTH = 3
const INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 3

// block
const FRONTMATTER_DIRECTIVES = [
  'halftitlepage',
  'titlepage',
  'dedication',
  'epigraph',
  'foreword',
  'preface',
  'acknowledgments'
]
const BODYMATTER_DIRECTIVES = [
  'introduction',
  'prologue',
  'chapter',
  'subchapter',
  'epilogue',
  'afterword',
  'conclusion'
]
const BACKMATTER_DIRECTIVES = [
  'loi',
  'appendix',
  'seriespage',
  'credits',
  'contributors',
  'colophon'
]

// block union
const BLOCK_DIRECTIVES = union(FRONTMATTER_DIRECTIVES, BODYMATTER_DIRECTIVES, BACKMATTER_DIRECTIVES)

// inline
const INLINE_DIRECTIVES = [
  'image'
  // 'image-inline' // TODO: what should output look for inline images?
]

// misc
const MISC_DIRECTIVES = [
  'pull-quote',
  'dialogue',
  'epigraph'
]

const DIRECTIVE_ATTRIBUTES = {
  section: {
    required: {},
    optional: {
      title: {
        input: 'title:"foo"',
        output: 'title="foo"'
      },
      classes: {
        input: 'classes:"foo bar baz"',
        output: 'class="foo bar baz'
      },
      pagebreak: [{
        input: 'pagebreak:before',
        output: 'style="page-break-before:always;"'
      }, {
        input: 'pagebreak:after',
        output: 'style="page-break-before:always;"'
      }]
    }
  },

  image: {
    required: {
      source: {
        input: 'source:foo.jpg',
        output: 'src="foo.jpg"'
      }
    },
    optional: {
      caption: {
        input: 'caption:"foo bar"',
        output: /data-caption="foo bar"/
      },
      alt: {
        input: 'alt:foo',
        output: 'alt="foo"'
      },
      classes: {
        input: 'classes:"foo bar baz"',
        output: 'class="foo bar baz'
      }
    }
  },

  // misc
  misc: {
    'pull-quote': {
      required: {},
      optional: {
        citation: {
          input: 'citation:"foo bar"',
          output: /<cite>&#8212;&#160;foo bar<\/cite>/
        },
        classes: {
          input: 'classes:"foo bar baz"',
          output: 'class="foo bar baz'
        }
      }
    },
    // 'dialogue': {
    //   required: {},
    //   optional: {}
    // },
    // 'epigraph': {
    //   required: {},
    //   optional: {}
    // }
  }

  // // audio/video
  // video: {
  //   required: {
  //     source: {
  //       input: 'source:foo.mp4',
  //       output: /<source src="foo.mp4" type="video\/mp4"/
  //     }
  //   },
  //   optional: {
  //     poster: {
  //       input: 'poster:foo.jpg',
  //       output: 'poster="foo.jpg"'
  //     },
  //     autoplay: {
  //       input: 'autoplay:yes',
  //       output: 'autoplay="autoplay"'
  //     },
  //     loop: {
  //       input: 'loop:yes',
  //       output: 'loop="loop"'
  //     },
  //     controls: {
  //       input: 'controls:yes',
  //       output: 'controls="controls"'
  //     },
  //     muted: {
  //       input: 'muted:yes',
  //       output: 'muted="muted"'
  //     }
  //   }
  // },

  // audio: {
  //   required: {
  //     source: {
  //       input: 'source:foo.mp3',
  //       output: /<source src="foo.mp3" type="audio\/mp3"/
  //     }
  //   },
  //   optional: {
  //     autoplay: {
  //       input: 'autoplay:yes',
  //       output: 'autoplay="autoplay"'
  //     },
  //     loop: {
  //       input: 'loop:yes',
  //       output: 'loop="loop"'
  //     },
  //     controls: {
  //       input: 'controls:yes',
  //       output: 'controls="controls"'
  //     },
  //     muted: {
  //       input: 'muted:yes',
  //       output: 'muted="muted"'
  //     }
  //   }
  // },

  // wildcard
  // attrs: { input: '',  output: '' },
}

const GLOBAL_ATTRIBUTES = ['id']

export { BLOCK_DIRECTIVE_MARKER, INLINE_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_FENCE, INLINE_DIRECTIVE_FENCE,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH, INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
  FRONTMATTER_DIRECTIVES, BODYMATTER_DIRECTIVES, BACKMATTER_DIRECTIVES,
  BLOCK_DIRECTIVES, INLINE_DIRECTIVES, MISC_DIRECTIVES, DIRECTIVE_ATTRIBUTES,
  GLOBAL_ATTRIBUTES }
