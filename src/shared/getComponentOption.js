import deepmerge from 'deepmerge'

/**
 * Returns the `opts.option` $option value of the given `opts.component`.
 * If methods are encountered, they will be bound to the component context.
 * If `opts.deep` is true, will recursively merge all child component
 * `opts.option` $option values into the returned result.
 *
 * @param  {Object} opts - options
 * @param  {Object} opts.component - Vue component to fetch option data from
 * @param  {String} opts.option - what option to look for
 * @param  {Boolean} opts.deep - look for data in child components as well?
 * @param  {Function} opts.arrayMerge - how should arrays be merged?
 * @param  {Boolean} opts.backtrace - look for data in ancestor components as well??
 * @param  {Object} [result={}] - result so far
 * @return {Object} result - final aggregated result
 */
export default function getComponentOption (opts, result = {}) {
  const { component, option, deep, arrayMerge, backtrace } = opts
  const { $options } = component

  // only collect option data if it exists
  if (typeof $options[option] !== 'undefined' && $options[option] !== null) {
    let data = $options[option]

    // if option is a function, replace it with it's result
    if (typeof data === 'function') {
      data = data.call(component)
    }

    if (typeof data === 'object') {
      // merge with existing options
      result = deepmerge(result, data, {
        clone: true,
        arrayMerge
      })
    } else {
      result = data
    }
  }

  if (backtrace) {
    const ancestorComponentList = getAncestorComponentList(component)
    ancestorComponentList.forEach((component) => {
      result = getComponentOption({
        component,
        option,
        deep,
        arrayMerge
      }, result)
    })
  }

  // collect & aggregate child options if deep = true
  if (deep && component.$children.length) {
    component.$children.forEach((childComponent) => {
      result = getComponentOption({
        component: childComponent,
        option,
        deep,
        arrayMerge
      }, result)
    })
  }

  return result
}

function getAncestorComponentList (component) {
  let currentComponent = component
  const ancestorComponentList = []
  while (currentComponent.$parent) {
    currentComponent = currentComponent.$parent
    ancestorComponentList.unshift(currentComponent)
  }
  return ancestorComponentList
}
