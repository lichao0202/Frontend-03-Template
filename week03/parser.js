const css = require('css');
let currentToken;
let currentAttribute;
let currentTextNode = null
let rules = []

let stack = [{type: 'document', children: []}]

function emit(token) {
  let top = stack[stack.length - 1]

  if (token.type == 'startTag') {
    let element = {
      type: 'element',
      children: [],
      attribute: []
    }

    element.tagName = token.tagName

    for (let p in token) {
      if (p !== 'type' && p !== 'tagName') {
        element.attribute.push({name: p, value: token[p]})
      }
    }

    computeCss(element)

    top.children.push(element)
    element.parent = top

    if (!token.isSelfClosing) {
      stack.push(element)
    }

    currentTextNode = null
  } else if (token.type == 'endTag') {
    if (top.tagName !== token.tagName) {
      throw new Error('Tag start and end not match')
    } else {
      /* 处理css */
      if (token.tagName == 'style') {
        addCssRules(currentTextNode.content)
      }
      stack.pop()
    }
    currentTextNode = null
  } else if (token.type == 'text') {
    if (currentTextNode === null) {
      currentTextNode = {
        type: 'Text',
        content: ''
      }

      top.children.push(currentTextNode)
    }

    currentTextNode.content += token.content
  }
}

function addCssRules(content) {
  const ast = css.parse(content)
  rules.push(...ast.stylesheet.rules)
}

function computeCss(element) {
  console.log(rules)
  const elements = stack.slice().reverse()

  if (!element.computedStyle) {
    element.computedStyle = {}
  }

  for (let rule of rules) {
    // 这里假设只有以空格分隔的简单css规则，没有复合选择器
    const selectorList = rule.selectors[0].split(' ').reverse()

    if (!match(element, selectorList[0])) {
      continue
    }

    let matched = false

    var j = 1 // 从父级元素开始匹配
    for (let i = 0; i < elements.length; i++) {
      if (match(elements[i], selectorList[j])) {
        j++ // 匹配上就继续匹配下一个选择器，没匹配上就再向父级匹配
      }

      // 选择器匹配完成
      if (j >= selectorList.length) {
        matched = true
        break
      }
    }


    if (matched) {
      // 匹配成功
      const computedStyle = element.computedStyle
      for (let declare of rule.declarations) {
        if (!computedStyle[declare.property]) computedStyle[declare.property] = {}

        computedStyle[declare.property].value = declare.value
      }

      console.log(element.computedStyle)
    }
  }
}

function match(element, selector) {
  if (!element || !element.attribute) {
    return false
  }

  if (selector.charAt(0) == '#') {
    const attr = element.attribute.filter(item => item.name == 'id')[0]
    if (attr && attr.value == selector.replace('#', '')) {
      return true
    }
  } else if (selector.charAt(0) == '.') {
    const attr = element.attribute.filter(item => item.name == 'class')[0]
    if (attr && attr.value == selector.replace('.', '')) {
      return true
    }
  } else {
    if (element.tagName == selector) {
      return true
    }
  }

  return false
}

const EOF = Symbol('EOF')

function data(c) {
  // 死等左尖括号
  if (c === '<') {
    return tagOpen
  } else if (c === EOF) {
    emit({
      type: 'EOF'
    })
    return;
  } else {
    emit({
      type: 'text',
      content: c
    })
    return data
  }
}

function tagOpen(c) {
  if (c === '/') {
    // 如果一个字符只是作为标志，不需要消耗，则直接返回状态机
    return engTagOpen
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'startTag',
      tagName: ''
    }
    // 如果一个字符判断之后还需要被消耗，则返回自消耗(reconsume)的状态机
    return tagName(c)
  } else {
    return ;
  }
}

function tagName(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += c
    return tagName
  } else if (c === '/') {
    return selfClosingStartTag
  } else if (c.match(/^[\s]$/)) { // TODO：这里方括号内正则是不是可以用\s代替？
    return beforeAttributeName
  } else if (c === '>') { // 一个标签结束，等待下一个标签
    emit(currentToken)
    return data 
  } else {
    return tagName
  }
}

function engTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'endTag',
      tagName: ''
    }
    return tagName(c)
  } else if (c === '>') {

  } else if (c === EOF) {

  }
}

function selfClosingStartTag(c) {
  if (c == '>') {
    currentToken.isSelfClosing = true
    emit(currentToken)
    return data
  }
}

function beforeAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (c === '/' || c === '>' || c === EOF) { // 等待下一个标签
    return afterAttributeName(c)
  } else if (c === '=') { // TODO: 这一块逻辑不是很懂
    return beforeAttributeName
  } else {
    currentAttribute = {
      name: '',
      value: ''
    }
    return attributeName(c)
  }
}

function afterAttributeName(c) {
  if (c === '/') {
    return selfClosingStartTag
  } else if (c == '>') {
    return selfClosingStartTag(c)
  }
}

function attributeName(c) {
  if (c.match(/^[\t\n\f ]$/) || c == '/' || c == '>' || c == EOF) {
    return afterAttributeName(c)
  } else if (c == '=') {
    return beforeAttributeValue
  } else if (c == '\u0000') {

  } else if (c == '\"' || c == '\'' || c == '<') {

  } else {
    currentAttribute.name += c
    return attributeName
  }
}

function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/) || c == '/' || c == '>' || c == EOF) { // TODO： 这里的逻辑是不是有问题
    return beforeAttributeName
  } else if (c == '\"') {
    return doubleQuotedAttributeValue
  } else if (c == '\'') {
    return singleQuotedAttributeValue
  } else if (c == '>') { // <div name=>

  } else {
    return unquotedAttributeValue(c)
  }
}

function doubleQuotedAttributeValue(c) {
  if (c == '\"') {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterDoubleQuotedAttributeValue
  } else if (c == '\u0000') {

  } else if (c == EOF) {

  } else {
    currentAttribute.value += c
    return doubleQuotedAttributeValue
  }
}

function singleQuotedAttributeValue(c) {
  if (c == '\'') {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterSingleQuotedAttributeValue
  } else if (c == '\u0000') {

  } else if (c == EOF) {

  } else {
    currentAttribute.value += c
    // return doubleQuotedAttributeValue // TODO：单引号也进入双引号状态机？但是双引号状态机里面也没有判断单引号的情况呀？
    return singleQuotedAttributeValue
  }
}

function unquotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value
    return beforeAttributeName
  } else if (c == '/') {
    currentToken[currentAttribute.name] = currentAttribute.value
    return selfClosingStartTag
  } else if (c == '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c == '\u0000') {

  } else if (c == '\"' || c == '\'' || c == '<' || c == '=' || c == '`') {

  } else if (c == EOF) {

  } else {
    currentAttribute.value += c
    return unquotedAttributeValue
  }
}

function afterSingleQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) { // TODO: 遇到空格就进入下一个属性解析？那class可以多个空格怎么办？
    return beforeAttributeName
  } else if (c == '/') {
    return selfClosingStartTag
  } else if (c == '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c == EOF) {

  } else {
    currentAttribute.value += c
    return singleQuotedAttributeValue // TODO: 单引号的属性值怎么办？
  }
}
function afterDoubleQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) { // TODO: 遇到空格就进入下一个属性解析？那class可以多个空格怎么办？
    return beforeAttributeName
  } else if (c == '/') {
    return selfClosingStartTag
  } else if (c == '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c == EOF) {

  } else {
    currentAttribute.value += c
    return doubleQuotedAttributeValue // TODO: 单引号的属性值怎么办？
  }
}

module.exports.parseHtml = function parseHtml(html) {
  state = data
  for (c of html) {
    state = state(c)
  }
  console.log(stack)
  state = state(EOF)
}