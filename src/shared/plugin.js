import assign from 'object-assign'
import $meta from './$meta'
import batchUpdate from '../client/batchUpdate'

import {
  VUE_META_KEY_NAME,
  VUE_META_ATTRIBUTE,
  VUE_META_SERVER_RENDERED_ATTRIBUTE,
  VUE_META_TAG_LIST_ID_KEY_NAME
} from './constants'

// set some default options
const defaultOptions = {
  keyName: VUE_META_KEY_NAME,
  attribute: VUE_META_ATTRIBUTE,
  ssrAttribute: VUE_META_SERVER_RENDERED_ATTRIBUTE,
  tagIDKeyName: VUE_META_TAG_LIST_ID_KEY_NAME
}

// automatic install
if (typeof Vue !== 'undefined') {
  Vue.use(VueMeta)
}

/**
 * Plugin install function.
 * @param {Function} Vue - the Vue constructor.
 */
export default function VueMeta (Vue, options = {}) {
  // combine options
  options = assign(defaultOptions, options)

  // bind the $meta method to this component instance
  Vue.prototype.$meta = $meta(options)

  // store an id to keep track of DOM updates
  let batchID = null

  // watch for client side component updates
  Vue.mixin({
    beforeCreate () {
      // coerce function-style metaInfo to a computed prop so we can observe
      // it on creation
      if (typeof this.$options[options.keyName] === 'function') {
        if (typeof this.$options.computed === 'undefined') {
          this.$options.computed = {}
        }
        this.$options.computed.$metaInfo = this.$options[options.keyName]
      }
    },
    created () {
      // if computed $metaInfo exists, watch it for updates & trigger a refresh
      // when it changes (i.e. automatically handle async actions that affect metaInfo)
      // credit for this suggestion goes to [Sébastien Chopin](https://github.com/Atinux)
      if (this.$metaInfo) {
        this.$watch('$metaInfo', () => {
          // batch potential DOM updates to prevent extraneous re-rendering
          batchID = batchUpdate(batchID, () => this.$meta().refresh())
        })
      }
    },
    beforeMount () {
      // batch potential DOM updates to prevent extraneous re-rendering
      batchID = batchUpdate(batchID, () => this.$meta().refresh())
    },
    activated () {
      batchID = batchUpdate(batchID, () => this.$meta().refresh())
    }
  })
}
