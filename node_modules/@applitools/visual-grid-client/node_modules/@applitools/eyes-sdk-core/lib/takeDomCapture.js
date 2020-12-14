'use strict'

const Axios = require('axios')
const {URL} = require('url')
const {
  getCaptureDomAndPollScript,
  getPollScript,
  getCaptureDomAndPollForIE,
  getPollForIE,
} = require('@applitools/dom-capture')
const ArgumentGuard = require('./utils/ArgumentGuard')
const GeneralUtils = require('./utils/GeneralUtils')
const PerformanceUtils = require('./utils/PerformanceUtils')
const EyesError = require('./errors/EyesError')

const SCRIPT_RESPONSE_STATUS = {
  WIP: 'WIP',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  SUCCESS_CHUNKED: 'SUCCESS_CHUNKED',
}

const EXECUTION_TIMEOUT = 5 * 60 * 1000
const DOM_CAPTURE_PULL_TIMEOUT = 200 // ms
const IOS_MAX_CHUNK_SIZE = 100000 // chars in string

async function takeDomCapture(logger, driver, options = {}) {
  ArgumentGuard.notNull(logger, 'logger')
  ArgumentGuard.notNull(driver, 'driver')
  const {executionTimeout = EXECUTION_TIMEOUT, axios = Axios.create()} = options

  const {browserName = '', browserVersion = 0, platformName = ''} = driver
  const isIE = browserName === 'internet explorer'
  const isEdgeLegacy = browserName.toLowerCase().includes('edge') && browserVersion <= 44
  const isIOS = platformName === 'iOS'
  const maxChunkSize = isIOS ? IOS_MAX_CHUNK_SIZE : undefined
  const scripts = {}
  if (isIE || isEdgeLegacy) {
    scripts.capture = `${await getCaptureDomAndPollForIE()} return __captureDomAndPollForIE.apply(this, arguments[0]);`
    scripts.poll = `${await getPollForIE()} return __pollForIE.apply(this, arguments[0]);`
  } else {
    scripts.capture = `${await getCaptureDomAndPollScript()} return __captureDomAndPoll.apply(this, arguments[0]);`
    scripts.poll = `${await getPollScript()} return __poll.apply(this, arguments[0]);`
  }

  const url = await driver.getUrl()
  const dom = await captureContextDom(driver.mainContext)

  return dom

  async function captureContextDom(context) {
    const capture = await captureDom(context)
    if (!capture) return {}
    const raws = capture.split('\n')
    const tokens = JSON.parse(raws[0])
    const cssEndIndex = raws.indexOf(tokens.separator)
    const frameEndIndex = raws.indexOf(tokens.separator, cssEndIndex + 1)
    let dom = raws[frameEndIndex + 1]

    const cssResources = await Promise.all(
      raws.slice(1, cssEndIndex).reduce((cssResources, href) => {
        return href ? cssResources.concat(fetchCss(url, href)) : cssResources
      }, []),
    )

    for (const {href, css} of cssResources) {
      dom = dom.replace(`${tokens.cssStartToken}${href}${tokens.cssEndToken}`, css)
    }

    const framePaths = raws.slice(cssEndIndex + 1, frameEndIndex)

    for (const xpaths of framePaths) {
      if (!xpaths) continue
      const references = xpaths.split(',').reduce((parent, selector) => {
        return {reference: {type: 'xpath', selector}, parent}
      }, null)
      let contextDom
      try {
        const frame = await context.context(references)
        contextDom = await captureContextDom(frame)
      } catch (ignored) {
        logger.log('Switching to frame failed')
        contextDom = {}
      }
      dom = dom.replace(`${tokens.iframeStartToken}${xpaths}${tokens.iframeEndToken}`, contextDom)
    }

    return dom
  }

  async function captureDom(context) {
    let isExecutionTimedOut = false
    const executionTimer = setTimeout(() => (isExecutionTimedOut = true), executionTimeout)
    const result = {value: null, error: null}
    try {
      logger.verbose('executing dom capture')
      let response = JSON.parse(await context.execute(scripts.capture))
      while (!isExecutionTimedOut) {
        if (response.status === SCRIPT_RESPONSE_STATUS.SUCCESS_CHUNKED) {
          if (!result.value) result.value = response.value
          else result.value += response.value

          if (response.done) {
            result.value = JSON.parse(result.value)
            break
          }
        } else if (response.status === SCRIPT_RESPONSE_STATUS.SUCCESS) {
          result.value = response.value
          break
        } else if (response.status === SCRIPT_RESPONSE_STATUS.ERROR) {
          result.error = response.error
          break
        }
        await GeneralUtils.sleep(DOM_CAPTURE_PULL_TIMEOUT)
        logger.verbose('polling dom capture')
        response = JSON.parse(await context.execute(scripts.poll, [{maxChunkSize}]))
      }
    } finally {
      clearTimeout(executionTimer)
    }

    if (result.error) {
      throw new EyesError(
        `Error during capture dom and pull script: '${result.error}'`,
        result.error,
      )
    }

    if (isExecutionTimedOut) {
      throw new EyesError('dom-capture Timed out')
    }

    return result.value
  }

  async function fetchCss(baseUri, href, retriesCount = 1) {
    try {
      logger.verbose(`Given URL to download: ${href}`)
      let absHref = href
      if (!GeneralUtils.isAbsoluteUrl(href)) {
        absHref = new URL(href.toString(), baseUri).href
      }

      const timeStart = PerformanceUtils.start()
      const response = await axios(absHref)
      const css = response.data
      logger.verbose(
        `downloading CSS in length of ${css.length} chars took ${timeStart.end().summary}`,
      )
      const escapedCss = GeneralUtils.cleanStringForJSON(css)
      return {href: absHref, css: escapedCss}
    } catch (err) {
      console.log(err)
      logger.verbose(err.toString())
      retriesCount -= 1
      if (retriesCount > 0) {
        return fetchCss(baseUri, href, retriesCount)
      }
      return {href, css: ''}
    }
  }
}

module.exports = takeDomCapture
